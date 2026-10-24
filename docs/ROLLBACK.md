# 回滚操作

生产目录：`/var/lib/docker/volumes/wordpress_wp_html/_data/wp-content/mu-plugins/zero-anime/`。

## 方案 A：仅停用增强层（推荐，文章和评论不回退）

以已有 SSH 登录方式连接服务器，然后执行：

```bash
P=/var/lib/docker/volumes/wordpress_wp_html/_data/wp-content/mu-plugins/zero-anime
# 新建哨兵文件；不修改或删除原主题/文章。
touch "$P/disabled.flag"
curl -fsS http://127.0.0.1/ | grep 'zero-sakura-style'
```

停用后，原主题、旧内联美化代码和原 Additional CSS 自动恢复输出。没有必要重启容器。浏览器刷新即可。

恢复版本二时，删除本次新建的哨兵文件：

```bash
rm -- /var/lib/docker/volumes/wordpress_wp_html/_data/wp-content/mu-plugins/zero-anime/disabled.flag
curl -fsS http://127.0.0.1/ | grep 'zero-anime/style.css'
```

也可在后台「设置 → Zero 二次元美化」关闭总开关。Must-Use 插件不能在普通插件列表直接停用。

本次验证（此前 SSH 可用时）：通过独立 PHP 进程设置 `ZERO_ANIME_DISABLED=true`，恢复旧页脚 35,549 字节、旧 Additional CSS 13,110 字节；未在生产访客请求中实际切回旧页面。

## 方案 B：替换为已知可用的代码版本

1. 使用方案 A 停用当前增强层。
2. 在私有目录备份当前加载器和 `zero-anime/` 文件夹。
3. 在本地检出已知可用版本，先 PHP/JS 语法检查，再上传到暂存目录。
4. 先部署 `zero-anime/` 资产，最后原子更新顶层 `zero-anime.php` 加载器。
5. 删除停用哨兵，刷新并验证。不要对整个 WordPress 数据卷执行覆盖式部署。

## 方案 C：完整灾难恢复（非普通美化回滚）

**该操作会覆盖数据库和站点文件，可能丢失备份之后的文章、评论和配置。仅在确认需要恢复全站、已做好当前全量备份后使用。**

已备份目录：`/opt/wordpress/backups/beautify-20261024-1125/`。

包括 `wordpress-files.tar.gz`、`database.sql.gz`、原 `docker-compose.yml`、容器镜像标识、`SHA256SUMS`。

步骤：

1. 校验旧备份：在备份目录执行 `sha256sum -c SHA256SUMS` 和 `gzip -t wordpress-files.tar.gz database.sql.gz`。
2. 进入维护窗口，停止 `wordpress` 容器，保持 `wpdb` 可用。
3. **先另行保存当前文件与数据库**，并检验备份可读性。
4. 停用或移走新增的 `zero-anime.php` 加载器；不要留下新插件继续加载。将当前站点数据目录整体重命名到私有恢复目录，准备空目标目录（不要直接 `rm -rf`）。Docker 命名卷路径操作需确认挂载与容器已停止。
5. 以 root 在原挂载目录解压旧文件：`tar --acls --xattrs -xzpf wordpress-files.tar.gz -C /var/lib/docker/volumes/wordpress_wp_html/_data`，保持权限与所有者。
6. 私有数据库导入示例（不打印或硬编码口令）：

```bash
gzip -dc /opt/wordpress/backups/beautify-20261024-1125/database.sql.gz |
  docker exec -i wpdb sh -c 'MYSQL_PWD="$MARIADB_ROOT_PASSWORD" mariadb -uroot'
```

7. 若需恢复 Compose，先备份当前 Compose，再从私有备份恢复；不得把真实口令的 Compose 放入公开 Git。
8. 启动 `wordpress` 容器；检查首页、文章、后台、搜索与容器日志，确认后退出维护窗口。

本次没有执行覆盖式全站恢复，也未进行恢复演练；压缩包、SQL 结束标记与校验和均已检查。
