# proomet-hub

一个轻量级 prompt 预览与分类聚合平台。自身不保存 prompt 数据，通过 GitHub/Gitee API 实时拉取你指定的 git 仓库中的 markdown 文件，按 tag 聚合展示。

采用 Vercel 风格的暗色设计，Next.js 15 App Router + Tailwind + shiki。

## 功能

- 🗂 多 git 源聚合浏览，按 tag 多选 OR 筛选
- 🔍 全文搜索 + `⌘K` 命令面板（prompt/tag/author 快速跳转）
- 📝 详情 Modal（URL 可分享），Markdown 渲染 + shiki 代码高亮 + 一键复制
- ⭐ 收藏（localStorage / 持久化 JSON）
- 👤 按作者、源仓库二级聚合页
- 🌓 浅色/深色主题切换，导入/导出配置
- 🧠 内存 10 分钟 TTL 缓存，支持 GitHub PAT（私有仓库）
- 🐳 Docker + Vercel 双模部署

## 源仓库 Markdown 规范

项目递归扫描源仓库内所有 `.md` 文件，头部 frontmatter 格式：

```md
---
tags: [写作, 代码]
author: yourname
desc: 简短描述
---

这里是 prompt 正文，支持 Markdown。
```

- `tags` / `author` / `desc` 均为可选；`tags` 可为数组或逗号分隔字符串
- **没有 frontmatter 或 tags 缺失的文件**会被归入 `其他` tag，正文仍然可见
- 正文本身即是 prompt，详情页「Copy prompt」会复制整段正文

## 快速开始

### 本地开发

```bash
npm install
npm run dev
# http://localhost:3000
```

### Docker（推荐自部署）

```bash
docker compose up -d
```

数据持久化到 `./data/` 目录下：
- `sources.json` —— 已添加的 git 源列表
- `favorites.json` —— 收藏的 prompt id
- `settings.json` —— 主题 / PAT 等

要备份/迁移，只需把 `./data` 目录打包即可。

### Vercel（无文件系统）

直接 import 本仓库到 Vercel 即可。Vercel 无持久化文件系统时项目会自动降级：所有源配置、收藏、设置都存到浏览器 `localStorage`。设置页的「导出 JSON」可以导出配置，在任意设备/浏览器之间迁移。

## 环境变量

| 变量 | 说明 |
| --- | --- |
| `DATA_DIR` | 服务端持久化目录。存在即启用 FS 模式；不存在走 localStorage 模式。Docker 镜像默认 `/data`。 |

## 添加源

进入 `/sources` 页面粘贴完整 git URL 即可，如：

- `https://github.com/owner/repo`
- `https://github.com/owner/repo/tree/branch/subdir`（指定分支与子目录）
- `https://gitee.com/owner/repo`（Gitee 需在设置页填 token 提升配额）

## 技术栈

Next.js 15 · React 19 · TailwindCSS · shiki · react-markdown · gray-matter · cmdk · zustand · lucide-react
