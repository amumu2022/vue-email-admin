# 邮箱管理平台 (Email Admin)

一个功能完善的多账户邮箱管理平台，支持 Web、Android 和 Windows 多平台部署。

## 功能特性

- 📧 **多账户管理**: 支持添加、编辑、删除多个邮箱账户
- 🌐 **多平台支持**: 支持 Gmail、Outlook、QQ邮箱、163邮箱、Yahoo邮箱等主流邮箱
- 📱 **跨平台部署**: 支持 Web、Android、Windows 平台
- 🔒 **安全存储**: 邮箱凭据加密存储
- 📬 **邮件管理**: 收件箱浏览、邮件详情查看、已读/未读标记、星标管理
- 🔄 **邮件同步**: 自动/手动同步邮件

## 技术栈

### 前端
- **Vue 3** - 渐进式 JavaScript 框架
- **TypeScript** - 类型安全的 JavaScript 超集
- **Vite** - 下一代前端构建工具
- **Element Plus** - Vue 3 组件库
- **Pinia** - Vue 状态管理
- **Vue Router** - Vue 路由管理
- **Capacitor** - 跨平台原生运行时

### 后端
- **FastAPI** - 现代、快速的 Python Web 框架
- **SQLAlchemy** - Python SQL 工具包和 ORM
- **SQLite** - 轻量级数据库
- **Pydantic** - 数据验证库

## 项目结构

```
emailAdmin/
├── frontend/                 # 前端项目
│   ├── src/
│   │   ├── api/             # API 服务层
│   │   ├── components/      # 公共组件
│   │   ├── layouts/         # 布局组件
│   │   ├── router/          # 路由配置
│   │   ├── stores/          # Pinia 状态管理
│   │   ├── styles/          # 全局样式
│   │   ├── types/           # TypeScript 类型定义
│   │   ├── utils/           # 工具函数
│   │   └── views/           # 页面视图
│   ├── capacitor.config.ts  # Capacitor 配置
│   └── package.json
│
├── backend/                  # 后端项目
│   ├── app/
│   │   ├── api/             # API 路由
│   │   ├── models/          # 数据库模型
│   │   ├── utils/           # 工具函数
│   │   ├── database.py      # 数据库配置
│   │   └── schemas.py       # Pydantic 模型
│   ├── main.py              # 应用入口
│   └── requirements.txt
│
└── README.md
```

## 快速开始

### 环境要求

- Node.js >= 18
- Python >= 3.10
- npm 或 yarn

### 前端启动

```bash
# 进入前端目录
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

前端将在 http://localhost:3000 启动

### 后端启动

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

# 安装依赖
pip install -r requirements.txt

# 启动服务器
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

后端 API 将在 http://localhost:8000 启动
API 文档: http://localhost:8000/docs

## 打包部署

### Web 部署

```bash
cd frontend
npm run build
```

构建产物在 `frontend/dist` 目录

### Android 打包

```bash
cd frontend

# 构建前端
npm run build

# 添加 Android 平台
npx cap add android

# 同步代码
npx cap sync android

# 打开 Android Studio
npx cap open android
```

### Windows 打包

可以使用 Electron 或其他桌面打包工具将 Web 应用打包为 Windows 应用。

## 邮箱配置说明

### Gmail
- IMAP: imap.gmail.com:993
- SMTP: smtp.gmail.com:587
- 需要开启"允许不够安全的应用"或使用应用专用密码

### Outlook
- IMAP: outlook.office365.com:993
- SMTP: smtp.office365.com:587

### QQ邮箱
- IMAP: imap.qq.com:993
- SMTP: smtp.qq.com:587
- 需要使用授权码而非登录密码

### 163邮箱
- IMAP: imap.163.com:993
- SMTP: smtp.163.com:465
- 需要使用授权码而非登录密码

## API 接口

### 账户管理
- `GET /api/accounts` - 获取所有账户
- `POST /api/accounts` - 创建账户
- `PUT /api/accounts/:id` - 更新账户
- `DELETE /api/accounts/:id` - 删除账户
- `POST /api/accounts/test-connection` - 测试连接
- `POST /api/accounts/:id/sync` - 同步邮件

### 邮件管理
- `GET /api/emails` - 获取邮件列表
- `GET /api/emails/:id` - 获取邮件详情
- `PATCH /api/emails/:id/read` - 标记已读/未读
- `PATCH /api/emails/:id/starred` - 标记星标
- `DELETE /api/emails/:id` - 删除邮件
- `POST /api/emails/refresh` - 刷新邮件

## 开发计划

- [ ] 邮件发送功能
- [ ] 邮件搜索优化
- [ ] 邮件标签管理
- [ ] 邮件草稿箱
- [ ] 邮件模板
- [ ] 深色模式
- [ ] 国际化支持

## 许可证

MIT License
