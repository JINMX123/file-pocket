# 文件口袋 · 桌面端（Tauri）

网页原型的真实桌面版：常驻托盘、无边框透明小窗、监听操作系统真实文件拖拽、按关键词规则**真实移动文件**到目标文件夹。

## 功能

- **真实拖拽归档**：把文件/文件夹拖到口袋窗口上，实时预览去向，松手后由 Rust 侧执行移动（重名自动追加 `(2)`，跨盘自动降级为复制+删除）
- **关键词识别**：与网页原型同一套 `src/lib/model.ts` 规则引擎，最长关键词优先
- **规则持久化**：文件夹、关键词、皮肤保存在系统配置目录的 `config.json`（如 Windows 的 `%APPDATA%/com.filepocket.app/`）
- **系统托盘**：托盘图标左键或菜单「显示 / 隐藏」切换窗口，「退出」关闭程序
- **边缘休眠**：30 秒无操作，窗口滑到屏幕右缘只露 20px 挂扣，鼠标靠近即唤醒
- **三款皮肤**：蓝莓 / 抹茶 / 蜜桃

## 本地开发

```bash
npm install
npm run tauri dev        # 需要 Rust 工具链：https://rustup.rs
```

## 本机打包（出什么包取决于你的系统）

```bash
npm run tauri build
# Windows → src-tauri/target/release/bundle/msi/*.msi 与 nsis/*.exe
# macOS   → src-tauri/target/release/bundle/dmg/*.dmg
```

## GitHub Actions 一次出双平台包

1. 把本目录作为仓库推到 GitHub（或将 `.github/workflows/release.yml` 放到仓库根，并调整 `npm ci` 与 action 的 `projectPath`）。
2. 打一个版本标签并推送：

```bash
git tag v0.3.0 && git push origin v0.3.0
```

3. Action 会同时在 macOS / Windows / Linux 三个 runner 上构建，并生成一个 **draft Release**，把安装包传上去。
4. 确认后发布 Release，把安装包链接填进官网 `src/pages/Landing.tsx` 顶部的 `DOWNLOAD_URLS` 即可（填了链接按钮自动变成直接下载）。

> macOS 未配置签名证书时，用户首次打开需在「系统设置 → 隐私与安全性」里允许；如需免提示，请在 CI 里配置 Apple 签名 secrets（见 tauri-action 文档）。

## 目录结构

```
src/            React 前端（口袋挂件 + 工作台面板，复用原型组件）
src/lib/model.ts    关键词识别引擎（与网页版同源）
src-tauri/      Rust 后端：move_files / 配置读写 / 托盘 / 边缘停靠
.github/        双平台打包流水线
```
