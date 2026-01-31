# 📧 邮箱管理平台 (Email Admin)

<p align="center">
  <img src="https://img.shields.io/badge/Vue-3.5-4FC08D?style=flat-square&logo=vue.js" alt="Vue 3.5">
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/FastAPI-0.109-009688?style=flat-square&logo=fastapi" alt="FastAPI">
  <img src="https://img.shields.io/badge/Python-3.10+-3776AB?style=flat-square&logo=python" alt="Python">
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=flat-square" alt="License">
</p>

<p align="center">
  一个功能完善的多账户邮箱管理平台，支持 Web、Android 和 iOS 多平台部署。
</p>

---

## ✨ 功能特性

| 功能 | 描述 |
|------|------|
| 📧 **多账户管理** | 支持添加、编辑、删除多个邮箱账户 |
| 🌐 **多平台支持** | Gmail、Outlook、QQ邮箱、163邮箱、Yahoo邮箱等 |
| 📱 **跨平台部署** | Web、Android、iOS 全平台覆盖 |
| 🔒 **安全存储** | 邮箱凭据 AES 加密存储 |
| 📬 **邮件管理** | 收件箱浏览、邮件详情、已读/未读、星标管理 |
| 🔄 **邮件同步** | 自动/手动同步邮件 |
| 🔑 **Token 管理** | API Token 生成与管理 |
| 📊 **数据统计** | 邮件数量、账户状态等统计信息 |
| 📝 **访问日志** | 完整的 API 访问日志记录 |
| 🌙 **响应式设计** | 适配桌面端和移动端 |

## 🛠️ 技术栈

### 前端
| 技术 | 版本 | 说明 |
|------|------|------|
| [Vue 3](https://vuejs.org/) | 3.5.x | 渐进式 JavaScript 框架 |
| [TypeScript](https://www.typescriptlang.org/) | 5.9.x | 类型安全的 JavaScript 超集 |
| [Vite](https://vitejs.dev/) | 7.x | 下一代前端构建工具 |
| [Element Plus](https://element-plus.org/) | 2.13.x | Vue 3 组件库 |
| [Pinia](https://pinia.vuejs.org/) | 3.x | Vue 状态管理 |
| [Vue Router](https://router.vuejs.org/) | 4.x | Vue 路由管理 |
| [Capacitor](https://capacitorjs.com/) | 8.x | 跨平台原生运行时 |
| [Axios](https://axios-http.com/) | 1.x | HTTP 客户端 |

### 后端
| 技术 | 版本 | 说明 |
|------|------|------|
| [FastAPI](https://fastapi.tiangolo.com/) | 0.109.x | 现代、快速的 Python Web 框架 |
| [Tortoise ORM](https://tortoise.github.io/) | 0.19.x | 异步 ORM 框架 |
| [Pydantic](https://docs.pydantic.dev/) | 2.5.x | 数据验证库 |
| [IMAPClient](https://imapclient.readthedocs.io/) | 3.x | IMAP 客户端库 |
| [Loguru](https://loguru.readthedocs.io/) | 0.7.x | 日志记录库 |
| [Cryptography](https://cryptography.io/) | 41.x | 加密库 |

## 📁 项目结构

```
emailAdmin/
├── 📂 frontend/                  # 前端项目
│   ├── 📂 src/
│   │   ├── 📂 api/              # API 服务层
│   │   │   ├── account.ts       # 账户 API
│   │   │   ├── auth.ts          # 认证 API
│   │   │   ├── email.ts         # 邮件 API
│   │   │   ├── logs.ts          # 日志 API
│   │   │   ├── stats.ts         # 统计 API
│   │   │   └── token.ts         # Token API
│   │   ├── 📂 components/       # 公共组件
│   │   ├── 📂 layouts/          # 布局组件
│   │   ├── 📂 router/           # 路由配置
│   │   ├── 📂 stores/           # Pinia 状态管理
│   │   ├── 📂 styles/           # 全局样式
│   │   ├── 📂 types/            # TypeScript 类型定义
│   │   ├── 📂 utils/            # 工具函数
│   │   └── 📂 views/            # 页面视图
│   │       ├── 📂 account/      # 账户管理页面
│   │       ├── 📂 auth/         # 认证页面
│   │       ├── 📂 dashboard/    # 仪表盘
│   │       ├── 📂 docs/         # API 文档
│   │       ├── 📂 email/        # 邮件管理页面
│   │       ├── 📂 logs/         # 日志页面
│   │       ├── 📂 settings/     # 设置页面
│   │       ├── 📂 tokens/       # Token 管理
│   │       └── 📂 users/        # 用户管理
│   ├── capacitor.config.ts      # Capacitor 配置
│   ├── vite.config.ts           # Vite 配置
│   └── package.json
│
├── 📂 backend/                   # 后端项目
│   ├── 📂 app/
│   │   ├── 📂 api/              # API 路由
│   │   │   ├── accounts.py      # 账户接口
│   │   │   ├── auth.py          # 认证接口
│   │   │   ├── emails.py        # 邮件接口
│   │   │   ├── logs.py          # 日志接口
│   │   │   ├── open.py          # 开放接口
│   │   │   ├── stats.py         # 统计接口
│   │   │   └── tokens.py        # Token 接口
│   │   ├── 📂 models/           # 数据库模型
│   │   │   ├── account.py       # 账户模型
│   │   │   ├── email.py         # 邮件模型
│   │   │   ├── token.py         # Token 模型
│   │   │   └── user.py          # 用户模型
│   │   ├── 📂 utils/            # 工具函数
│   │   │   ├── auth.py          # 认证工具
│   │   │   ├── crypto.py        # 加密工具
│   │   │   └── email_service.py # 邮件服务
│   │   ├── database.py          # 数据库配置
│   │   ├── logger.py            # 日志配置
│   │   └── schemas.py           # Pydantic 模型
│   ├── main.py                  # 应用入口
│   ├── run.sh                   # Linux/Mac 一键管理脚本
│   ├── requirements.txt         # Python 依赖
│   └── .env.example             # 环境变量示例
│
├── .gitignore                   # Git 忽略配置
└── README.md                    # 项目说明
```

## 🚀 快速开始

### 环境要求

| 环境 | 版本要求 |
|------|----------|
| Node.js | >= 18.0 |
| Python | >= 3.10 |
| npm / yarn / pnpm | 最新版本 |

### 1️⃣ 克隆项目

```bash
git clone https://gitee.com/xdteam-mumu/vue-email-admin.git
cd vue-email-admin
```

### 2️⃣ 后端配置与启动

#### 方式一：使用一键管理脚本（Linux/Mac 推荐）

项目提供了 `run.sh` 脚本，可以一键完成环境配置和启动：

```bash
# 进入后端目录
cd backend

# 添加执行权限
chmod +x run.sh

# 运行脚本
./run.sh
```

脚本提供以下功能菜单：

| 选项 | 功能 |
|------|------|
| 1 | 一键启动 EmailAdmin |
| 2 | 一键更新（全部自动） |
| 3 | 更新系统软件包 |
| 4 | 安装/检查 Python 依赖 |
| 5 | 更新 EmailAdmin 代码 |
| 6 | 创建虚拟环境并安装依赖 |
| 0 | 退出 |

> 💡 **提示**: 10秒内未选择将自动执行选项 1（启动服务）

#### 方式二：手动配置

```bash
# 进入后端目录
cd backend

# 创建虚拟环境
python -m venv venv

# 激活虚拟环境
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# 安装依赖（使用阿里云镜像加速）
pip install -r requirements.txt -i https://mirrors.aliyun.com/pypi/simple/

# 复制环境变量配置文件
cp .env.example .env

# 编辑 .env 文件，配置加密密钥
# 生成加密密钥命令:
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"

# 启动服务器
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

后端服务地址:
- API 服务: http://localhost:8000
- Swagger 文档: http://localhost:8000/docs
- ReDoc 文档: http://localhost:8000/redoc

### 3️⃣ 前端配置与启动

```bash
# 进入前端目录
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

前端服务地址: http://localhost:3000

### 4️⃣ 默认账户

首次启动后，系统会自动创建默认管理员账户：

| 用户名 | 密码 |
|--------|------|
| admin | admin123 |

> ⚠️ **安全提示**: 请在生产环境中立即修改默认密码！

## 🔄 自动构建与发布

项目配置了 GitHub Actions 自动构建工作流，支持自动打包前端页面和 Android APK。

### 触发方式

| 方式 | 说明 |
|------|------|
| 推送 Tag | 推送 `v*` 格式的 tag 时自动触发（如 `v1.2.0`） |
| 手动触发 | 在 GitHub Actions 页面手动运行，输入版本号 |

### 自动构建产物

| 产物 | 说明 |
|------|------|
| `frontend-dist.zip` | 前端构建产物，可直接部署到 Web 服务器 |
| `EmailAdmin-latest.apk` | Android APK（未签名），需要自行签名后安装 |

### 固定下载链接

为了方便自动更新和分发，项目提供了固定的下载链接，这些链接始终指向最新版本：

| 文件 | 固定下载链接 |
|------|-------------|
| 前端页面 | `https://github.com/{owner}/{repo}/releases/download/latest/frontend-dist.zip` |
| Android APK | `https://github.com/{owner}/{repo}/releases/download/latest/EmailAdmin-latest.apk` |

> 💡 **提示**: 请将 `{owner}` 和 `{repo}` 替换为实际的 GitHub 用户名和仓库名。

### 发布新版本

```bash
# 1. 更新 package.json 中的版本号
cd frontend
npm version 1.2.0

# 2. 提交更改
git add .
git commit -m "chore: bump version to 1.2.0"

# 3. 创建并推送 tag
git tag v1.2.0
git push origin main --tags
```

### 版本更新功能

应用内置了版本更新检查功能，在「设置」页面可以：

- 检查是否有新版本
- 查看更新日志
- 直接下载最新版本的 APK
- 复制固定下载链接

## 📦 打包部署

### Web 部署

```bash
cd frontend

# 构建生产版本
npm run build

# 构建产物在 dist 目录
```

使用 Nginx 部署示例配置：

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    root /path/to/frontend/dist;
    index index.html;
    
    # 前端路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

> 💡 **说明**: 前端应用启动时会引导用户配置后端服务器地址，无需在 Nginx 中配置 API 代理。如果前后端部署在同一服务器，也可以添加 API 代理配置。

### Android 打包

#### 环境要求

| 环境 | 说明 |
|------|------|
| Node.js | >= 18.0 |
| Android Studio | 最新版本 |
| JDK | Android Studio 自带 JBR 或 JDK 11+ |
| Android SDK | API Level 22+ |

#### 方式一：使用一键打包脚本（Windows）

项目提供了 Windows 批处理脚本，可以一键完成打包：

```bash
cd frontend

# Debug 版本（用于开发测试）
build-android.bat

# Release 版本（用于发布）
build-android-release.bat
```

> ⚠️ **注意**: 首次运行前，请修改脚本中的 `JAVA_HOME` 路径为您的 Android Studio JBR 路径，默认为 `C:\Program Files\Android\Android Studio\jbr`

#### 方式二：手动打包步骤

**1. 构建前端项目**

```bash
cd frontend
npm run build
```

**2. 初始化 Android 项目（首次）**

```bash
# 添加 Android 平台（仅首次需要）
npx cap add android
```

**3. 同步 Web 资源到 Android**

```bash
npx cap sync android
```

**4. 打开 Android Studio**

```bash
npx cap open android
```

**5. 在 Android Studio 中打包**

- 等待 Gradle 同步完成
- 菜单栏选择 `Build` → `Build Bundle(s) / APK(s)` → `Build APK(s)`
- 或使用命令行：
  ```bash
  cd frontend/android
  # Windows
  gradlew.bat assembleDebug
  # Linux/Mac
  ./gradlew assembleDebug
  ```

**6. 获取 APK 文件**

打包完成后，APK 文件位于：
- Debug 版本: `frontend/android/app/build/outputs/apk/debug/EmailAdmin-v{版本号}-debug.apk`
- Release 版本: `frontend/android/app/build/outputs/apk/release/EmailAdmin-v{版本号}-release.apk`

#### 方式三：使用 npm 脚本

```bash
cd frontend

# 构建并同步到 Android
npm run build:android

# 打开 Android Studio
npm run cap:open:android
```

#### Release 版本签名

Release 版本需要签名后才能安装，步骤如下：

**1. 生成签名密钥**

```bash
keytool -genkey -v -keystore my-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias my-key-alias
```

**2. 配置签名信息**

在 `frontend/android/app/build.gradle` 中添加签名配置：

```gradle
android {
    ...
    signingConfigs {
        release {
            storeFile file('my-release-key.jks')
            storePassword 'your-store-password'
            keyAlias 'my-key-alias'
            keyPassword 'your-key-password'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            ...
        }
    }
}
```

**3. 打包签名版本**

```bash
cd frontend/android
# Windows
gradlew.bat assembleRelease
# Linux/Mac
./gradlew assembleRelease
```

#### 常见问题

| 问题 | 解决方案 |
|------|----------|
| Gradle 同步失败 | 检查网络连接，配置 Gradle 代理或使用国内镜像 |
| JAVA_HOME 未设置 | 设置环境变量指向 JDK 路径，或修改脚本中的 JAVA_HOME |
| SDK 版本不匹配 | 在 Android Studio 中安装对应版本的 SDK |
| 打包后无法连接服务器 | 检查 `capacitor.config.ts` 中的服务器配置，确保 `cleartext: true` |

### iOS 打包

```bash
cd frontend

# 构建并同步
npm run build:ios

# 或分步执行
npm run build
npx cap add ios
npx cap sync ios
npx cap open ios
```

## 📧 邮箱配置说明

### Gmail
| 协议 | 服务器 | 端口 | 加密 |
|------|--------|------|------|
| IMAP | imap.gmail.com | 993 | SSL |
| SMTP | smtp.gmail.com | 587 | TLS |

> 需要开启"两步验证"并使用[应用专用密码](https://myaccount.google.com/apppasswords)

### Outlook / Office 365
| 协议 | 服务器 | 端口 | 加密 |
|------|--------|------|------|
| IMAP | outlook.office365.com | 993 | SSL |
| SMTP | smtp.office365.com | 587 | TLS |

### QQ 邮箱
| 协议 | 服务器 | 端口 | 加密 |
|------|--------|------|------|
| IMAP | imap.qq.com | 993 | SSL |
| SMTP | smtp.qq.com | 587 | TLS |

> 需要在 QQ 邮箱设置中开启 IMAP 服务并获取[授权码](https://service.mail.qq.com/cgi-bin/help?subtype=1&&id=28&&no=1001256)

### 163 邮箱
| 协议 | 服务器 | 端口 | 加密 |
|------|--------|------|------|
| IMAP | imap.163.com | 993 | SSL |
| SMTP | smtp.163.com | 465 | SSL |

> 需要在 163 邮箱设置中开启 IMAP 服务并获取授权码

### Yahoo 邮箱
| 协议 | 服务器 | 端口 | 加密 |
|------|--------|------|------|
| IMAP | imap.mail.yahoo.com | 993 | SSL |
| SMTP | smtp.mail.yahoo.com | 587 | TLS |

## 🔌 API 接口

### 认证接口
| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/api/auth/login` | 用户登录 |
| POST | `/api/auth/logout` | 用户登出 |
| GET | `/api/auth/me` | 获取当前用户信息 |

### 账户管理
| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/accounts` | 获取所有账户 |
| POST | `/api/accounts` | 创建账户 |
| GET | `/api/accounts/:id` | 获取账户详情 |
| PUT | `/api/accounts/:id` | 更新账户 |
| DELETE | `/api/accounts/:id` | 删除账户 |
| POST | `/api/accounts/test-connection` | 测试连接 |
| POST | `/api/accounts/:id/sync` | 同步邮件 |

### 邮件管理
| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/emails` | 获取邮件列表 |
| GET | `/api/emails/:id` | 获取邮件详情 |
| PATCH | `/api/emails/:id/read` | 标记已读/未读 |
| PATCH | `/api/emails/:id/starred` | 标记星标 |
| DELETE | `/api/emails/:id` | 删除邮件 |
| POST | `/api/emails/refresh` | 刷新邮件 |

### Token 管理
| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/tokens` | 获取所有 Token |
| POST | `/api/tokens` | 创建 Token |
| DELETE | `/api/tokens/:id` | 删除 Token |

### 统计接口
| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/stats/overview` | 获取概览统计 |
| GET | `/api/stats/emails` | 获取邮件统计 |

### 日志接口
| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/logs` | 获取访问日志 |

### 开放接口 (需要 Token 认证)
| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/open/emails` | 获取邮件列表 |
| GET | `/api/open/emails/:id` | 获取邮件详情 |

## 🔐 安全说明

1. **密码加密**: 所有邮箱密码使用 AES-256 加密存储
2. **JWT 认证**: API 使用 JWT Token 进行身份验证
3. **环境变量**: 敏感配置通过环境变量管理，不提交到代码仓库
4. **HTTPS**: 生产环境建议启用 HTTPS
5. **访问日志**: 完整记录 API 访问日志，便于安全审计

## 📋 开发计划

- [x] 多账户邮箱管理
- [x] 邮件收取与查看
- [x] Token API 管理
- [x] 访问日志记录
- [x] 数据统计仪表盘
- [x] GitHub Actions 自动构建
- [x] 版本更新检查功能
- [ ] 邮件发送功能
- [ ] 邮件搜索优化
- [ ] 邮件标签管理
- [ ] 邮件草稿箱
- [ ] 邮件模板
- [ ] 深色模式
- [ ] 国际化支持 (i18n)
- [ ] Docker 部署支持
- [ ] 邮件附件管理

## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

## 📄 许可证

本项目采用 [MIT License](LICENSE) 开源许可证。

## 📞 联系方式

如有问题或建议，欢迎提交 [Issue](https://gitee.com/xdteam-mumu/vue-email-admin/issues)。

---

<p align="center">
  Made with ❤️ by Email Admin Team
</p>
