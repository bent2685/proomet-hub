# AGENTS.md

> 给所有大语言模型 / AI 编码代理（Claude Code、Cursor、Codex、Continue、Aider 等）的项目工作守则。
>
> **在 proomet-hub 任意位置开始编码之前，请先把这份文件从头读完。** 这是项目的最高约束，遇到与你的"通用习惯"冲突时一律以本文件为准。

---

## 1. 项目快照

**proomet-hub** 是一个轻量级 prompt 预览与分类聚合平台 —— 自身**不保存任何 prompt 数据**，通过 GitHub/Gitee API 实时拉取用户指定的 git 仓库中的 markdown 文件，按 tag / author 聚合展示。

### 1.1 技术栈

| 层 | 技术 |
| --- | --- |
| 框架 | Next.js 14 (App Router) + React 18 + TypeScript |
| 样式 | Tailwind CSS 3（CSS 变量驱动浅/深色主题）|
| 状态 | zustand（单 store：`lib/store.ts`）|
| Markdown | `gray-matter`（frontmatter）+ `react-markdown` + `remark-gfm` |
| 代码高亮 | shiki（服务端渲染 HTML，`/api/highlight`）|
| 命令面板 | cmdk |
| 图标 | lucide-react |
| 部署 | Docker（standalone 构建）+ Vercel 双模 |

### 1.2 目录结构

```
app/
  api/              # Route Handlers
    storage-mode/   # 探测 fs / client 模式
    sources/        # FS 模式下的源 CRUD
    favorites/      # FS 模式下的收藏 CRUD
    settings/       # FS 模式下的设置 CRUD
    prompts/        # 聚合拉取：POST { sources, settings, refresh } → { items }
    highlight/      # shiki 服务端高亮
  authors/
    [name]/         # 作者详情页
  favorites/        # 收藏列表
  settings/         # 设置页（主题 / PAT / 导入导出）
  sources/          # 源管理页
  page.tsx          # 首页（HomeView 容器）
  layout.tsx        # 根布局：Header + main
  globals.css       # CSS 变量 + 基础样式

components/
  header.tsx           # 顶部导航 + cmd+K 入口 + 主题切换
  command-palette.tsx  # ⌘K 命令面板
  tag-cloud.tsx        # 首页 tag 云（频次强度）
  prompt-card.tsx      # 卡片
  prompt-detail.tsx    # 详情 Modal
  markdown.tsx         # Markdown 渲染（含 CodeBlock 接管）
  code-block.tsx       # 代码块 + 复制按钮（shiki）
  home-view.tsx        # 首页主视图（筛选 / 搜索 / Modal URL 同步）
  empty-state.tsx      # 空状态 + 一键添加示例源
  hero.tsx             # 首页 hero
  hydrate.tsx          # 启动时 hydrate store
  theme-script.tsx     # 阻塞式主题脚本（防闪烁）

lib/
  types.ts             # 公共类型 + `UNCATEGORIZED_TAG = "其他"`
  store.ts             # zustand store（唯一状态源）
  github.ts            # git 仓库拉取 + frontmatter 解析 + 10min TTL 缓存
  storage/
    server.ts          # 服务端 FS 存储（需 `DATA_DIR` 环境变量）
    client.ts          # 浏览器端存储（自动路由 fs API / localStorage）
```

### 1.3 核心数据流

1. 用户在 `/sources` 添加 git 仓库 URL → `useStore.addSource()` → 持久化到 FS/localStorage
2. `useStore.reloadPrompts()` → `POST /api/prompts` → 服务端 `fetchAllSources()` 并发抓取
3. `lib/github.ts` 先查 10 分钟 TTL 内存缓存；未命中则 git tree 递归列出所有 `.md` → 并发 raw 拉取 → `gray-matter` 解析
4. 无 frontmatter / 无 tags 的文件归入 `UNCATEGORIZED_TAG`（`"其他"`），正文仍可见
5. 聚合后的 `PromptItem[]` 写回 store，首页即时渲染

### 1.4 双模持久化

- **Docker / 本地**：设置 `DATA_DIR`（默认 `/data`），所有 sources/favorites/settings 以独立 JSON 文件保存，映射出去即可迁移
- **Vercel / 无盘环境**：未设 `DATA_DIR` → 服务端返回 `mode: "client"` → 客户端自动降级 localStorage；设置页提供 JSON 导入/导出以便跨设备迁移

### 1.5 源仓库 markdown 约定

```md
---
tags: [写作, 代码]          # 数组或逗号分隔字符串
author: yourname            # 可选
desc: 简短描述              # 可选
title: 自定义标题           # 可选，缺省用文件名
---

正文即 prompt，详情页「Copy prompt」会复制此处全部内容。
```

---

## 2. 写代码守则（核心：克制）

### 2.1 只做被要求的事

- **不要主动添加功能**。一个 bug 修复不需要顺手"清理周围代码"；一个简单功能不需要额外配置项。
- **不要为不存在的场景写错误处理 / 兜底 / fallback / 校验**。只在系统边界（用户输入、外部 API）做校验。内部代码彼此信任。
- **不要为了"未来可能的需求"做抽象**。一次性操作就用一次性代码。三行相似代码好过一个过早的抽象。
- **不要给你没改过的代码加注释 / docstring / 类型注解**。只在逻辑确实不显然的地方注释。
- **不要做无关的重命名 / 重排 / 风格统一**。保持 diff 最小。

### 2.2 改之前先读

- **不允许凭印象修改没读过的文件。** 用户说"改 X 函数"，先 `Read` 整个文件，理解上下文，再 `Edit`。
- 改一个公共类型 / 函数前，先 `Grep` 全仓 call site，确认影响面。
- 改样式时先看 sibling 文件用的什么模式，**抄 neighbor 不要发明**。

### 2.3 避免破坏性"快捷方式"

- 遇到障碍**不要靠删除 / 绕过 / 关检查解决**。先定位根因。
- 不允许 `--no-verify`、`--no-gpg-sign`、`git reset --hard`、`git push --force`、`rm -rf` 等操作除非用户**明确**授权。
- 看见不认识的文件 / 分支 / 配置时，先调查再处理 —— 可能是用户在做的事。

### 2.4 工具偏好

- **能用 dedicated tool 就不要用 bash**：
  - 读文件 → `Read`，不要 `cat` / `head` / `tail`
  - 改文件 → `Edit`，不要 `sed` / `awk`
  - 找文件 → `Glob`，不要 `find` / `ls`
  - 找内容 → `Grep`，不要 `grep` / `rg`
  - 写文件 → `Write`，不要 `cat <<EOF`
- 多个独立工具调用**并发执行**（同一个 message 里多个 tool call），不要串行。

---

## 3. 项目铁律（非零容忍）

违反以下任一条即视为 PR 必须打回重写，不接受"已经写了就算了"。

### 3.1 不把 prompt 内容当主数据

proomet-hub 的核心定位是**聚合平台**，不是存储平台。

- **严禁**把源仓库内容写入任何**永久性**存储（数据库、同步到外部、做 fork/镜像）。用户撤掉源，必须在下一次缓存失效前彻底消失。
- **允许**以"带 TTL 的缓存"形式把拉取到的内容落盘（`DATA_DIR/cache.json`），原因：避免每次刷新都打 GitHub API（限流 60/hr），也避免 dev 环境进程重启丢缓存。
- `DATA_DIR` **只允许**出现这四个文件：
  - `sources.json` —— 已添加的 git 源
  - `favorites.json` —— 收藏的 prompt id
  - `settings.json` —— 主题外设置（PAT 等）
  - `cache.json` —— **带 TTL 的** 聚合结果缓存，TTL 常量在 `lib/cache.ts::CACHE_TTL_MS`，目前 24h
- 新增第五类必须在这里登记并说明理由。
- 缓存的写入**只允许**走 `lib/cache.ts`；其它位置直接写 `cache.json` 属违规。

### 3.2 不引入重型依赖

定位是"机器轻量级"：

- **禁止**引入数据库（SQLite/Postgres/Redis 等）。需要持久化就写 JSON。
- **禁止**引入 ORM、任务队列、全文检索引擎（Elasticsearch/Meilisearch 等）。搜索就在客户端 `filter + includes` 做。
- 新增 npm 依赖前先问自己："能不能 30 行手写搞定？" —— 能就手写。
- 尤其**禁止**引入任何让 Docker 镜像 > 300MB 的依赖。

### 3.3 单用户、无认证、不做账号体系

- **禁止**引入登录 / 注册 / JWT / session / OAuth 到本项目主干。这是自部署单用户工具。
- 用户隐私数据（PAT token）**只存本机**：FS 模式下 `settings.json`，Vercel 模式下 localStorage。**绝不**通过 API 回传、日志打印、错误上报外泄。
- 需要公网部署保护 → 用户自行在前面加 Nginx Basic Auth / Cloudflare Access，不是本项目职责。

### 3.4 双模部署必须同时可用

任何涉及持久化 / 文件读写的改动必须在**两种模式下都可用**：

- FS 模式（`DATA_DIR` 存在）：走 `/api/*` Route Handlers + `lib/storage/server.ts`
- Client 模式（Vercel 无盘）：`/api/storage-mode` 返回 `client` → `lib/storage/client.ts` 降级 localStorage
- **禁止**只做其中一种。`storage.*` 封装是**唯一**数据访问入口，新功能也必须走它。

### 3.5 样式铁律：只用 token，不硬编码颜色

- 颜色**一律**走 `bg-bg* / text-fg* / border-border* / bg-accent / text-accent-foreground`
- **禁止** `bg-white` / `text-black` / `#0d1117` / `bg-gray-*` 这类硬值 —— 浅色模式会翻车（已踩过的坑）
- 浅色模式通过 `html.light` 类 + CSS 变量切换；新增颜色 → 在 `app/globals.css` 的 `:root` 和 `html.light` 两处都要加

### 3.6 类型与边界

- `strict: true` 是开启的，**禁止** `// @ts-ignore` / `// @ts-expect-error` 绕过类型错误。解决根因。
- `lib/types.ts` 是类型唯一来源，`PromptItem` / `Source` / `Settings` / `Favorite` 的形状变更必须同步更新两端（server 存储 + client store）。
- API Route 返回的 JSON shape 有默认契约，修改必须同步改 `lib/storage/client.ts` 的解析处。

### 3.7 服务端 vs 客户端

- `"use client"` 只加在真正需要浏览器 API / hooks 的组件上，不要全局撒
- `lib/storage/server.ts` / `lib/github.ts` **禁止**被客户端组件 import（会把 `fs` 打进前端 bundle）
- `lib/storage/client.ts` / `lib/store.ts` 禁止被 Route Handler import

---

## 4. 提交规范

### 4.1 Conventional Commits 风格

格式：`<type>: <subject>`，subject 用中文。

| type | 用途 |
| --- | --- |
| `feat` | 新功能 |
| `fix` | bug 修复 |
| `refactor` | 不改外部行为的内部重构 |
| `chore` | 杂项（依赖、配置、构建脚本） |
| `docs` | 文档（README / AGENTS.md / 注释） |
| `test` | 加测试 / 改测试 |
| `style` | 纯格式调整（不改语义） |
| `perf` | 性能优化 |


### 4.2 小步多提交

**强约束：一次提交只做一件事。**

- 一个 PR 里如果有 3 个独立改动 → **3 个 commit**，不是 1 个塞满的大 commit
- 重构 + 新功能 → 拆开：先 commit 重构（行为不变），再 commit 新功能
- 修复 bug + 顺手发现的 typo → 拆开：先 commit fix，再 commit chore
- 写代码 + 写测试 → 可以一起 commit，但**不能写代码却不写测试**

判断标准：**如果这一段改动需要回滚时你想精准回滚，就单独 commit**。

### 4.3 commit message body

- 写**为什么**，不是**做了什么**（diff 已经告诉你做了什么）
- 1-3 句话足够。不需要写小说。
- 关联的 issue / PR 用 `owner/repo#123` 形式

### 4.4 禁止动作

- **永远不要 `git commit --amend`**。除非用户明确说"amend"。要修上一个 commit 就新建一个 fix commit。
- **永远不要 `--no-verify`**。pre-commit hook 失败 → 修底层问题，不要绕过。
- **永远不要 `git push --force` 到 main / master**。
- **永远不要在用户没让你 push 的时候 push**。本地 commit 是免费的，push 是有副作用的。
- **永远不要 commit `.env` / 密钥 / 大于 1MB 的二进制**。

### 4.5 commit 时必须

- 用 `git status` 先看一遍 staged 变动
- 用 `git diff --staged` 确认没夹带无关文件
- 用 `git log -5 --oneline` 看仓库最近的 commit message 风格，**抄风格**

---

## 5. 测试规范

项目目前未引入单测框架 —— 这是**刻意的**（参考 §3.2 轻量原则）。验证优先级如下：

### 5.1 必须跑的三件事

每个改动完成后按顺序全部跑通：

1. **类型检查** —— `npx tsc --noEmit`，**零 error** 才算过
2. **构建** —— `npm run build`，确保 standalone 产物能出来（影响 Docker）
3. **手工回归核心路径** —— 见 §5.3

### 5.2 何时必须加自动化测试

满足下列任一条件，必须在相邻位置放一个 `*.test.ts` 并用 `node --test` 可跑（不引入 vitest/jest）：

- 新增 / 修改 `lib/github.ts` 的 URL 解析、frontmatter 归类、缓存 key 逻辑
- 新增 / 修改 `lib/storage/*` 的模式探测与降级
- 新增任何会被两种部署模式共用的纯函数

规则：只测**纯函数**，不测 React 组件；不 mock HTTP，抽出纯函数再测。

### 5.3 手工回归清单（改动触及相关面才需要跑）

| 触及 | 回归动作 |
| --- | --- |
| `lib/github.ts` | `/sources` 添加一个公开 github 仓库 → 首页能出卡片 → 点开详情正文完整 |
| `lib/storage/*` | 不设 `DATA_DIR` 跑一次 → localStorage 能保存源；设 `DATA_DIR=./data` 跑一次 → `./data/*.json` 生成 |
| 样式 / `globals.css` | ⌘K、详情 Modal、卡片、tag chip 四处都在**浅色 + 深色**下检查一遍 |
| `markdown.tsx` / `code-block.tsx` | 打开一个含代码块的 prompt → 高亮正常 → 复制按钮生效 → 切换主题后高亮主题也跟着换 |
| `api/prompts` | 源列表为空时不报错；源无效时其它源仍正常 |

### 5.4 禁止

- **禁止**为了让测试通过而 mock 掉真实逻辑（例如 mock 掉 `gray-matter`）—— 那种测试没价值
- **禁止**写断言"组件渲染了某个字符串"这种快照式测试
- **禁止**引入 puppeteer / playwright / cypress 到主干依赖

---

## 6. 工作流模板

每接到一个任务，按以下顺序：

1. **复述任务**：用一两句话告诉用户你理解的目标。歧义先 ask 不要先 do。
2. **侦察**：`Glob` / `Grep` 找相关文件，`Read` 关键文件。**不要凭印象写代码**。
3. **小步实施**：
   - 改一个文件 → tsc编译测试;
   - 改一组相关文件 -> 跑测试;
   - 完成一个逻辑节点 → commit（按 §4.2 拆分）
4. **全量验证**;
5. **汇报**：告诉用户改了哪些文件、跑了哪些测试、有没有遗留问题。**不要**自己 push。

---

## 7. 当你不确定时

- 不确定要不要拆 commit → 拆。
- 不确定要不要写测试 → 写。
- 不确定要不要 ask 用户 → ask。
- 不确定要不要做这件事 → 不做，先问。
- 不确定一个改动是否破坏了什么 → `tsc` 全跑。

**贴近用户实际请求的最小改动 + 多测试 + 多提交 + 在不确定时停下询问** —— 这就是这份文档的全部精神。
