# proomet-hub

一个轻量级 prompt 预览与分类聚合平台。自身不保存 prompt 数据，通过 GitHub/Gitee API 实时拉取你指定的 git 仓库中的 markdown 文件，按 tag 聚合展示。

采用 Vercel 风格的暗色设计，Next.js 14 App Router + Tailwind + shiki + next-themes。

## 功能

- 🗂 多 git 源聚合浏览，按 tag 单选筛选
- 🔍 全文搜索 + `⌘K` 命令面板（prompt/tag/author 快速跳转）
- 📝 详情 Modal（URL 可分享），Markdown 渲染 + shiki 代码高亮 + 一键复制
- ⭐ 收藏（localStorage / 持久化 JSON）
- 👤 按作者、源仓库二级聚合页
- 🌓 浅色 / 深色 / 跟随系统，导入/导出配置
- 🧠 24h 持久化缓存（`cache.json`），手动刷新按钮按需重拉
- 🔐 GitHub PAT 支持（私有仓库 & 提升限流至 5000/hr）
- 🐳 Docker + Vercel 双模部署，镜像已发布多架构（amd64 / arm64）

## 源仓库 Markdown 规范

项目递归扫描源仓库内所有 `.md` 文件，头部 frontmatter 格式：

```md
---
title: 任务结束                  # 可选，缺省用文件名
tags: [流程, 任务]               # 可选
author: bent                     # 可选
desc: 任务结束后可以做的事        # 可选
---

这里是 prompt 正文，支持 Markdown 与代码块高亮。
```

字段别名均受支持：
- **tags**：`tags` / `tag` / `keywords` / `keyword` / `labels` / `label`
- **title**：`title` / `name`
- **author**：`author` / `by` / `creator` / `owner`
- **desc**：`desc` / `description` / `summary` / `intro`

没有 frontmatter 或 tags 缺失的文件会归入 `其他` 标签，正文仍可见。正文本身即是 prompt，详情页「Copy prompt」复制整段。仓库根目录的 `README.md` 不会进入 prompt 列表，而是展示在 Sources 页对应源的条目下方。

## 用 Docker 运行（推荐自部署）

已发布多架构镜像到 Docker Hub：[`bent2685/proomet-hub`](https://hub.docker.com/r/bent2685/proomet-hub)（`linux/amd64` + `linux/arm64`）。

### 方式一：docker run（单机最简）

```bash
docker run -d \
  --name proomet-hub \
  -p 3000:3000 \
  -v "$PWD/data:/data" \
  --restart unless-stopped \
  bent2685/proomet-hub:latest
```

访问 http://localhost:3000 即可。

### 方式二：docker compose（推荐）

新建目录，放一个 `docker-compose.yml`：

```yaml
services:
  proomet-hub:
    image: bent2685/proomet-hub:latest
    container_name: proomet-hub
    restart: unless-stopped
    ports:
      - "3000:3000"
    volumes:
      - ./data:/data
```

启动：

```bash
docker compose up -d
```

### 常用命令

```bash
docker compose logs -f           # 看日志
docker compose pull && docker compose up -d    # 升级到最新
docker compose restart           # 重启
docker compose down              # 停止并移除容器
```

### 持久化数据

数据写入宿主机挂载的 `./data/`：

| 文件 | 作用 |
| --- | --- |
| `sources.json` | 已添加的 git 源列表 |
| `favorites.json` | 收藏的 prompt id |
| `settings.json` | 主题、PAT 等设置 |
| `cache.json` | 24h TTL 聚合缓存（可手动删除） |

备份 / 迁移只要把 `./data/` 目录打包带走即可。

### 指定版本

```bash
docker pull bent2685/proomet-hub:0.1.0        # 指定精确版本
docker pull bent2685/proomet-hub:0.1          # 语义化主.次号
docker pull bent2685/proomet-hub:latest       # 跟随最新 release
```

## 部署到 Vercel（无持久化）

Vercel 没有可写文件系统，项目会自动降级：源配置、收藏、设置全部存浏览器 `localStorage`，换设备/浏览器时用「设置 → 导出 JSON / 导入 JSON」迁移。

直接 import 本仓库到 Vercel 即可，无需额外配置。

## 本地开发

```bash
pnpm install          # 或 npm install --legacy-peer-deps
pnpm dev
# http://localhost:3000
```

## 环境变量

| 变量 | 说明 |
| --- | --- |
| `DATA_DIR` | 服务端持久化目录。存在即启用 FS 模式；不存在走 localStorage 模式。Docker 镜像默认 `/data`。 |

## 添加源

进入 `/sources` 页面粘贴完整 git URL：

- `https://github.com/owner/repo`
- `https://github.com/owner/repo/tree/branch/subdir`（指定分支与子目录）
- `https://gitee.com/owner/repo`（Gitee 建议在设置页填 token 提升配额）

**强烈建议在 `/settings` 填一个 GitHub PAT**（Fine-grained token → 选 Public Repositories (read-only) → Generate 即可），把匿名限流 60/hr 提升到 5000/hr。

## 技术栈

Next.js 14 · React 18 · TailwindCSS · next-themes · shiki · react-markdown · gray-matter · cmdk · zustand · lucide-react
