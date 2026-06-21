# QRcode-Refresh

动态刷新二维码服务。二维码会按配置的间隔定时刷新，旧的二维码自动失效，必须扫描屏幕上当前的二维码才能识别出内容并跳转。

## 工作原理

- 服务端每隔 `REFRESH_INTERVAL_MS` 毫秒生成一个新的随机 token 并丢弃旧 token
- 二维码内容是 `${PUBLIC_BASE_URL}/scan?token=xxx`
- 扫码访问 `/scan`，服务端校验 token：
  - 当前 token 有效 → 302 跳转到 `TARGET_URL`
  - token 过期或不存在 → 返回 "二维码已失效" 页面
- 前端页面轮询 `/api/status`，检测到 token 轮换后立即刷新二维码图片并显示倒计时

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 复制环境变量配置
cp .env.example .env
#   按需修改 .env 中的 TARGET_URL、REFRESH_INTERVAL_MS、PUBLIC_BASE_URL

# 3. 启动
npm start
# 开发模式（自动重启）
npm run dev
```

默认访问 http://localhost:3000 即可看到自动刷新的二维码。

## 配置项 (.env)

| 变量 | 说明 | 默认值 |
| --- | --- | --- |
| `PORT` | 服务监听端口 | `3000` |
| `TARGET_URL` | 扫描有效二维码后跳转到的真实链接 | `https://github.com/Seanoll/QRcode-Refresh` |
| `REFRESH_INTERVAL_MS` | 二维码刷新间隔（毫秒） | `10000` |
| `PUBLIC_BASE_URL` | 二维码内容的服务访问地址，必须能被扫码设备访问到本服务 | `http://localhost:3000` |

> 本地调试时手机和电脑需在同一网络，`PUBLIC_BASE_URL` 应设为电脑局域网 IP，例如 `http://192.168.1.10:3000`。

## API

- `GET /` 展示二维码的页面
- `GET /api/qrcode` 当前二维码 SVG 图片
- `GET /api/status` 当前状态 JSON：`refreshIntervalMs` / `msUntilNextRotation` / `rotationId` / `hasTarget`
- `GET /scan?token=xxx` 扫码访问入口，有效则跳转 `TARGET_URL`，无效返回 410 失效页

## 技术栈

- Node.js + Express
- [qrcode](https://www.npmjs.com/package/qrcode) 生成 SVG 二维码
- 原生 HTML/CSS/JS 前端，无构建步骤

## License

MIT
