# Zero 博客 · 版本二（v2.0.0）

2026-10-24 发布的阅读优先二次元美化版本。保留 WordPress / Argon，不修改文章内容，不引入任何形式的看板娘。

## 本地与生产位置

- Git 工作目录：`/home/gaozikun/git/wordpress-blog/`
- 增强层源码：`/home/gaozikun/git/wordpress-blog/wordpress/wp-content/mu-plugins/zero-anime/`
- 增强层加载器：`/home/gaozikun/git/wordpress-blog/wordpress/wp-content/mu-plugins/zero-anime.php`
- 生产宿主机：`/var/lib/docker/volumes/wordpress_wp_html/_data/wp-content/mu-plugins/`
- WordPress 容器内：`/var/www/html/wp-content/mu-plugins/`
- 生产备份（不进入 Git）：`/opt/wordpress/backups/beautify-20261024-1125/`

## 版本二内容

- 樱粉 / 雾蓝 / 月夜配色、原创静态樱花湖景 SVG；正文采用实色背景。
- 首页双列卡片与最新文章强调布局；移动端单列。
- **长标题完整换行，不再使用负边距导致裁切。**
- **桌面 / 移动端搜索图标清晰可见，键盘可操作，输入框在焦点切换时保持展开。**
- 6 个可独立启停的特效模块，全部默认关闭；访客有统一「阅读偏好」入口。
- 系统减少动态效果、后台标签页、省流量模式优先；关闭模块会移除节点、监听与动画。
- 不依赖外部字体、特效 CDN、看板娘、音乐播放器或额外前端框架。
- 保留原主题、原有内联美化代码和 Additional CSS 的数据库原值。新增强层只在输出阶段屏蔽已识别的旧增强层；停用即可恢复。
- CSS/JS 资源使用内容 SHA-256 后缀自动更新缓存版本。

## 使用入口

访客：右下角 **阅读偏好** → 页面配色 / 各项开关 / 关闭全部特效 / 恢复站点默认。

站长：WordPress 后台 **设置 → Zero 二次元美化**。后台默认值与访客本地偏好分离。

默认配置：`/home/gaozikun/git/wordpress-blog/wordpress/wp-content/mu-plugins/zero-anime/config.php`。

## 文档与验证

- 方案、文件清单、开关说明：`/home/gaozikun/git/wordpress-blog/docs/V2-DELIVERY.md`
- 回滚：`/home/gaozikun/git/wordpress-blog/docs/ROLLBACK.md`
- 公开仓库历史安全提示：`/home/gaozikun/git/wordpress-blog/docs/SECURITY.md`
- HTTP 检查结果：`/home/gaozikun/git/wordpress-blog/docs/verification/http-verification.json`
- 模块生命周期单测：`node /home/gaozikun/git/wordpress-blog/tests/modules.test.mjs`

验证包括：23 项 HTTP 页面/资产检查、首页与移动端搜索（EVA 返回 5 个结果）、桌面 PJAX 换页、进度模块挂载/卸载、6 个模块清理测试、文章与 CSS 数据哈希一致性。

## 新环境初始化（不是生产升级脚本）

```bash
cd /home/gaozikun/git/wordpress-blog
./scripts/init-env.sh
./scripts/restore-local.sh
```

这会生成本机私有 `.env`，启动新容器，安装增强层与既有主题/上传资源；**不自动导入生产数据库、不覆盖现有容器或数据卷、不修改运行中的数据库密码**。需要完成 WordPress 初始化并启用 Argon。旧版数据库文件已经停止跟踪，完整私有备份需由站长安全导入。

生产仅上线 MU 增强层；仓库中的环境变量版 Compose / wp-config 模板未替换生产配置。

## Git 版本

- `v1`：版本一历史快照（保留，不重写）。
- `v2`、`v2.0.0`：版本二美化与可维护性增强。
- 不使用强制推送；保留原提交链。

## 必须处理的安全事项

**仓库是公开仓库。版本一历史中已有数据库快照、明文数据库口令和 WordPress 密钥。版本二清理当前分支不等于清理历史，也不能撤回别人已下载的数据。**

版本二已改用环境变量模板、停止跟踪数据库转储，原始私有文件保留在 Git 忽略的 `.private-v1/`，权限受限。请由站长轮换已暴露口令、密钥及聊天中提供的 GitHub 令牌；是否重写历史或调整可见性需单独授权。
