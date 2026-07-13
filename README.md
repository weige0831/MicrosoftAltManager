# 微软账号管理器 (MicrosoftAltManager)

通过 API / 网站上传、提取微软账号（账密、Cookie、应用 RefreshToken），提取后倒计时自动删除，AES-256-GCM 加密存储。前端 UI 对标 new-api 新版设计语言。

> Copyright © 2026 [weige0831](https://github.com/weige0831/MicrosoftAltManager). License: AGPLv3.
> 本项目主题系统（theme.css / theme-presets.css）衍生自 [New API](https://github.com/QuantumNous/new-api)（AGPLv3），依 §7 保留署名与原项目链接。

## 功能

- **上传账号**：用户名/密码（必填）、Cookie（必填）、备注、多个应用的 RefreshToken（可选）；记录上传时间
- **提取账号**：FIFO（从旧到新），支持数量 / 上传时间晚于 / 备注 / 应用名 筛选；**提取后立即标记已使用，不可二次提取**
- **自动删除**：全局「提取后保留时长」到期自动清理；额外「未提取最长保留期」兜底
- **加密存储**：password / cookie / refresh_token 使用 AES-256-GCM 加密落库
- **鉴权**：单管理员（浏览器登录 Session）+ API Key（bcrypt，可分别授予 upload / extract 权限）
- **管理后台**：概览统计、账号列表（脱敏）、操作日志、系统设置

## 技术栈

| 层 | 技术 |
|----|------|
| 前端 | React 19 + Vite + Tailwind v4 + shadcn/ui（new-api 风格 OKLCH 主题）+ zustand + react-router |
| 后端 | Go + Gin + GORM |
| 数据库 | PostgreSQL（生产）/ SQLite（开发兜底，纯 Go 无 CGO） |
| 加密 | AES-256-GCM |
| 部署 | Docker / docker-compose |

## 快速开始

### Docker Compose（推荐）

```bash
git clone https://github.com/weige0831/MicrosoftAltManager.git
cd MicrosoftAltManager
cp .env.example .env
# 生成随机密钥并填入 .env
docker compose up -d --build
```

访问 `http://<服务器IP>:27321`，默认管理员 `admin / admin123`（**登录后请立即修改**）。

### 直接运行（SQLite）

```bash
# 前端
cd frontend && npm ci && npm run build && cd ..
# 后端
go build -o msm ./cmd/server
./msm   # 自动生成 .env，使用 data/manager.db
```

## API 速览

统一响应信封 `{ success, message, data }`。

| 方法 | 路径 | 鉴权 | 说明 |
|------|------|------|------|
| POST | `/api/auth/login` | 无 | 管理员登录 |
| POST | `/api/account` | API Key(upload) / session | 上传账号 |
| POST | `/api/account/batch` | API Key(upload) / session | 批量上传 |
| POST | `/api/account/extract` | API Key(extract) / session | **提取**（FIFO，防二次提取） |
| GET  | `/api/accounts` | session | 列表（脱敏） |
| GET  | `/api/account/:id` | session | 明文详情 |
| DELETE | `/api/account/:id` | session | 删除 |
| CRUD | `/api/api-keys` | session | API Key 管理 |
| GET/PUT | `/api/settings/all` `/api/settings` | session | 全局 TTL 等 |
| GET | `/api/dashboard/stats` | session | 概览统计 |

### 示例：用 API Key 上传

```bash
curl -X POST http://<ip>:27321/api/account \
  -H "Authorization: Bearer msm_xxxxxxxx" \
  -H "Content-Type: application/json" \
  -d '{"username":"a@outlook.com","password":"pw","cookie":"...","refresh_tokens":[{"app_name":"xbox","refresh_token":"..."}]}'
```

### 示例：提取

```bash
curl -X POST http://<ip>:27321/api/account/extract \
  -H "Authorization: Bearer msm_xxxxxxxx" \
  -H "Content-Type: application/json" \
  -d '{"count":5,"uploaded_after":"2026-01-01T00:00:00Z"}'
```

## 配置项（环境变量 / .env）

| 变量 | 默认 | 说明 |
|------|------|------|
| `PORT` | `27321` | 监听端口（被占用自动顺延） |
| `DATABASE_URL` | 空→SQLite | PostgreSQL 连接串 |
| `SQLITE_PATH` | `data/manager.db` | SQLite 路径（无 DATABASE_URL 时） |
| `MASTER_KEY` | 自动生成 | AES 主密钥（**生产必须固定**） |
| `SESSION_SECRET` | 自动生成 | Session 签名密钥 |
| `TZ` | `Asia/Shanghai` | 时区 |

系统设置（后台可改）：`ttl_after_extract`（默认 86400 秒）、`max_age_unused`（默认 2592000 秒）、`brand_name`。

## 安全提示

- 敏感字段 AES-256-GCM 加密落库，列表接口脱敏
- API Key 仅存 bcrypt hash，明文仅创建时展示一次
- 生产请务必：固定 `MASTER_KEY` / `SESSION_SECRET`、修改默认 admin 密码、配置 HTTPS（nginx/Caddy 反代）

## License

AGPLv3。前端设计灵感来自 [New API](https://github.com/QuantumNous/new-api)。
