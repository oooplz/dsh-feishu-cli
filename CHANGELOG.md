# Changelog

## [1.1.0] - 2026-11-06

### 变更

- **配置入口从侧边栏移到插件自己的页面**：不再注册 `sidebar.panellist` 与 `main`，改为注册
  `plugins.bundle.config`（以包名 `dsh-feishu-cli` 为 key）。配置面板显示在「设置 → 插件 →
  dsh-feishu-cli」详情页的描述与组件列表之间，侧边栏不再出现「飞书」入口。
- 面板去掉页级标题（图标、标题、副标题由插件详情页提供），改为紧凑工具条：状态标签 + 刷新。
- 页面级背景、滚动与内边距交给宿主页面，插件只负责自身的卡片与间距。
- 删除截图与截图清单（`docs/*.png`、`screenshots.json`）：旧截图展示的是已移除的侧边栏面板，
  留着只会误导；README 改为用文字说明入口是「插件 → 飞书 CLI」。

### 内部

- 新增 `tests/client-slots.test.mjs`：锁定"只注册 `plugins.bundle.config`、不注册任何侧边栏或主面板"
  这一行为，防止回归。
- 删除随侧边栏一起失效的 `SidebarIcon`、`FeishuMark` 与对应样式。


本文件记录 dsh-feishu-cli 的版本变更。格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本号遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/)。

## [1.0.0] - 2026-11-04

首个公开发布。

> Fork 说明：本版本同步自 [`hoyin-law/dsh-feishu-cli`](https://github.com/hoyin-law/dsh-feishu-cli) 的 `v1.0.0`，无功能性改动；
> 差异为：仓库元数据指向本 fork、README 补充 npm 安装方式、修正两处与实现不符的说明（Web API 来源校验的范围、启动失败时的提示文案）。

### 新增

- 侧边栏「飞书」面板：应用与登录状态、登录二维码、授权链接、退出登录、取消登录。
- 首次使用引导：一键初始化飞书应用（`config init --new`）与账号登录（二维码 / device code）两阶段流程。
- 登录权限范围选择：可使用全部常用权限，或按业务域授权。
- 命令控制台：在面板内执行任意 `lark-cli` 命令，输出等宽展示；提供常用命令快捷入口。
- CLI 安装引导：首次使用时下载约 50MB 的官方 `lark-cli` 到 `~/.dsh/feishu-cli/bin`，带下载进度与阶段提示，下载后按 SHA-256 校验。
- Agent 工具 `feishu_cli`：执行任意 `lark-cli` 命令，支持 `command` / `cwd` / `timeout_ms` / `stdin` 参数。
- Agent 工具 `feishu_auth`：`status` / `login_start` / `login_wait` / `login_cancel` / `logout` / `list`。
- 系统提示片段：向模型说明如何驱动 CLI、如何判断结果，以及退出码 `10`（high-risk-write）需要用户确认。
- 本地 Web API：`/feishu-cli/api/state`、`/login/start`、`/login/<id>`、`/login/<id>/cancel`、`/logout`、`/run`、`/cli/install`；POST 使用 JSON 并做同源校验。
- 中英文界面文案。
- Windows / macOS / Linux 支持；可通过 `LARK_CLI_BIN` / `LARK_CLI_PATH` 指定已有的 `lark-cli`。
- 发布资料：README（中/英）、SECURITY、PRIVACY、PUBLISHING、CHANGELOG、CI 工作流与市场条目草稿。

### 说明

- 插件不额外保存飞书凭据；应用凭据与登录 token 由官方 `lark-cli` 管理（`~/.lark-cli`）。
- Meegle（飞书项目）不在本插件覆盖范围内，需要单独的 `meegle-cli`。
