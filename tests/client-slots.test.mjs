import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import vm from 'node:vm'

/**
 * Locks the client half's plugin surface.
 *
 * The plugin must stay out of the way: it registers exactly one slot entry,
 * `plugins.bundle.config`, keyed by its own package name, so its configuration
 * renders on the plugin's own page in Settings → Plugins. Registering
 * `sidebar.panellist` or `main` puts a permanent entry in the session sidebar
 * and is the regression this file guards against.
 */

const PKG_NAME = 'dsh-feishu-cli'

function reactStub() {
  const createElement = (type, props, ...children) => ({
    type,
    props: props ?? {},
    children: children.length ? children : undefined,
  })
  return {
    createElement,
    Fragment: 'Fragment',
    useState: (initial) => [typeof initial === 'function' ? initial() : initial, () => {}],
    useEffect: () => undefined,
    useMemo: (factory) => factory(),
    useCallback: (fn) => fn,
    useRef: (initial) => ({ current: initial ?? null }),
  }
}

async function loadClientHalf() {
  const source = await fs.readFile(new URL('../lib/client.js', import.meta.url), 'utf8')
  let mod = null
  const sandbox = {
    window: {
      __ModuleLoader__: {
        load: ({ id, factory }) => {
          mod = { id, factory }
        },
      },
    },
    console,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
  }
  vm.createContext(sandbox)
  vm.runInContext(source, sandbox, { filename: 'lib/client.js' })
  assert.ok(mod, 'client half must call window.__ModuleLoader__.load()')
  assert.equal(mod.id, PKG_NAME)
  return mod.factory((name) => {
    if (name === 'react') return reactStub()
    throw new Error('unexpected require: ' + name)
  })
}

/** Minimal ctx: records every registration instead of mounting anything. */
function fakeCtx() {
  const registered = []
  const injected = []
  const ctx = {
    slots: {
      inject: (name, run) => {
        injected.push(name)
        return run()
      },
      register: (options, component) => {
        registered.push({ options, component })
        return () => {}
      },
    },
    locale: {
      register: () => () => {},
      bind: () => (key) => key,
    },
    effect: (run) => {
      const dispose = run()
      return dispose
    },
  }
  return { ctx, registered, injected }
}

test('client half only contributes the bundle configuration slot', async () => {
  const client = await loadClientHalf()
  const { ctx, registered, injected } = fakeCtx()
  client.apply(ctx)

  const names = registered.map((entry) => entry.options.name)
  assert.deepEqual(names, ['plugins.bundle.config'], 'only the bundle config slot may be registered')
  assert.deepEqual(injected, ['plugins.bundle.config'], 'inject must wait for the same slot')

  for (const entry of registered) {
    assert.equal(entry.options.key, PKG_NAME, 'bundle config must be keyed by the package name')
  }
})

test('no sidebar entry and no main page are registered', async () => {
  const client = await loadClientHalf()
  const { ctx, registered } = fakeCtx()
  client.apply(ctx)

  const forbidden = ['sidebar.panellist', 'main', 'sidebar.item', 'sidebar.right.pane.tab']
  for (const entry of registered) {
    assert.equal(
      forbidden.includes(entry.options.name),
      false,
      `${entry.options.name} would add a permanent navigation entry`,
    )
  }
})

test('the configuration renders for the page view without hooks breaking', async () => {
  const client = await loadClientHalf()
  const { ctx, registered } = fakeCtx()
  client.apply(ctx)

  const { component } = registered[0]
  const shell = component({ view: 'page', t: (key) => key })
  assert.equal(typeof shell.type, 'function', 'slot entry must render the panel component')

  const element = shell.type(shell.props)
  assert.equal(element.type, 'div', 'configuration must render a container element')
  const inner = element.children
  assert.ok(Array.isArray(inner) && inner.length > 0, 'container must have children')
})
