# local-build 分支说明

> 本分支基于 `upstream/main`（EchoHS/GeekezBrowser），用于**本地打包一个已修复代理问题的可用版本**。
> 打包/使用前请先阅读本文件。

## 本分支包含的改动

### 1. 修复：移除过时的 `allowInsecure`（TLS 节点无法启动）

- **文件**：`src/main/utils.js`
- **问题**：内置的 Xray 26.x 已移除 `allowInsecure` 这个 TLS 选项（迁移到 `pinnedPeerCertSha256`）。`parseProxyLink()` 在所有 TLS 分支硬编码了 `allowInsecure: true`，导致 **vmess(+tls) / vless / trojan / ss(obfs=tls)** 节点全部启动失败，报错 `Failed to build TLS config`，界面表现为「代理启动失败」。纯 Shadowsocks（无 TLS）节点不受影响。
- **修复**：删除 4 处 `allowInsecure: true`。使用有效 CA 证书的节点在标准 TLS 校验下正常连接。
- **对应上游 PR**：[#47](https://github.com/EchoHS/GeekezBrowser/pull/47)

### 2. 修复：放宽代理就绪探测超时（健康节点被误判「启动失败」）

- **文件**：`src/main/index.js`
- **问题**：启动后通过 `www.gstatic.com` / `cp.cloudflare.com` / `www.google.com` 的 `generate_204` 探测代理可用性，超时即判「启动失败」。原超时过于激进（fast 900ms/2200ms、slow 1400ms/2600ms）。冷启动首个请求要建立上游连接并完成 TLS 握手，实测常需 1.5–4s，导致健康节点被误判失败（此时 Xray 其实已启动并在转发流量）。
- **修复**：放宽单次/整体超时（fast 2000ms/3000ms、slow 4500ms/8000–9000ms）。硬失败（ECONNREFUSED、ECONNRESET、HTTP 4xx/5xx 等）仍通过 `HARD_PROXY_PROBE_PATTERNS` 立即返回，不受影响。
- **对应上游 PR**：[#48](https://github.com/EchoHS/GeekezBrowser/pull/48)

### 3. 本地打包适配：`electron.vite.config.js` → `electron.vite.config.mjs`

- **原因**：本机安装的 `electron-vite@5` 为纯 ESM 包，而 `package.json` 无 `"type": "module"`，用 `.js`（被当作 CommonJS）加载会报 `ERR_REQUIRE_ESM`。
- **改动**：改用 `.mjs` 扩展名强制 ESM，并把 `__dirname` 换成 `fileURLToPath(import.meta.url)` 写法。
- **注意**：这是**纯本地构建适配**，不属于功能修复，因此**未包含在上游 PR #47/#48 中**。

## 如何用本分支打包（macOS arm64）

```bash
# 1. 切到本分支
git checkout local-build

# 2. 安装依赖（postinstall 会自动下载 Xray Core）
npm install

# 3. 打包 mac 版（arm64）
npm run build:mac
```

产物：

- App：`dist/mac-arm64/GeekEZ Browser.app`
- DMG：`dist/GeekEZ Browser-1.6.0-mac-arm64.dmg`

其它平台：`npm run build:win` / `npm run build:linux`。

## 安装说明（本地 ad-hoc 签名）

本地包是 ad-hoc 签名、未做 Apple 公证，首次打开需放行：

```bash
# 退出旧版后，拖入 /Applications，再去除隔离属性
xattr -dr com.apple.quarantine "/Applications/GeekEZ Browser.app"
```

若双击无法打开，右键 App → **打开**（绕过 Gatekeeper 首次拦截）。

## 与上游同步

两个功能修复已分别提为独立 PR（#47、#48）。上游合并后，可用官方 Release 替代本地包；本分支仅需保留第 3 项打包适配即可继续本地构建。
