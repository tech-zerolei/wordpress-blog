# Zero 博客（WordPress）— 版本一

从云服务器 `39.106.8.132` 克隆下来的博客服务完整快照，作为**版本一（v1）**基线。

- 站点名：**Zero**　|　主题：**argon**　|　语言：**zh_CN**
- WordPress：**7.1.3**（PHP 8.3.35）　|　数据库：**MariaDB 11.8.9**
- 内容规模：5 篇文章 / 1 个页面 / 65 个媒体附件 / 4 条评论 / 1 个用户
- 快照时间：2026-10-23 12:57（Asia/Shanghai）
- 还原验证：2026-10-23 于 `47.109.100.96` 通过（详见文末）

---

## 一、服务器上的原始形态

| 项目 | 值 |
| --- | --- |
| 主机 | `39.106.8.132`（阿里云 ECS，Alibaba Cloud Linux 3） |
| 主机名 | `iZ2ze2gtj9woyo2c2yi6hoZ` |
| 编排文件 | `/opt/wordpress/docker-compose.yml` |
| 容器 | `wordpress`（`wordpress:latest`，本地镜像 ID `56e40abd9d55`）<br>`wpdb`（`mariadb:11`，本地镜像 ID `53ef799caed2`） |
| 端口 | `80 → 80`，`371 → 80`（宿主机 → 容器） |
| 数据卷 | `wordpress_wp_html → /var/www/html`<br>`wordpress_wp_db → /var/lib/mysql` |
| 卷实际路径 | `/var/lib/docker/volumes/wordpress_wp_html/_data`<br>`/var/lib/docker/volumes/wordpress_wp_db/_data` |

容器环境变量（DB 凭据，见 `docker-compose.yml`）：

```
WORDPRESS_DB_USER=wordpress   WORDPRESS_DB_PASSWORD=WpDb_9xK2mZpWv4Q
WORDPRESS_DB_NAME=wordpress   MARIADB_ROOT_PASSWORD=WpRoot_7kL3nQx8vZ2
```

> ⚠️ 凭据以明文保存在 `docker-compose.yml` 中——与服务器现状一致，便于一键还原。
> 若此仓库以后要推到公共远端，请先把凭据抽成 `.env` 并加入 `.gitignore`。

---

## 二、仓库结构

```
wordpress-blog/
├── docker-compose.yml               # 服务器 /opt/wordpress/ 原件，未改动
├── wordpress/
│   ├── wp-config.php                # 服务器卷内原件（Docker 版，读环境变量）
│   ├── .htaccess                    # 伪静态规则（当前仅 WP 默认标记块）
│   └── wp-content/
│       ├── themes/                  # argon(启用) / Sakurairo / 2023-2025 默认主题
│       ├── plugins/                 # akismet / metronet-profile-picture（均未启用）
│       ├── mu-plugins/              # 空
│       ├── languages/               # 中文语言包（必需，见文末「验证发现」）
│       └── uploads/                 # 2026/ 与 iro_gallery/ 媒体文件
├── database/
│   └── wordpress-20261023.sql       # mariadb-dump 全库导出（含建库语句）
├── vendor/
│   └── wp-7.1.3-core.tar.gz         # WordPress 7.1.3 核心（22M，离线还原用）
├── scripts/
│   ├── pull-from-server.sh          # 从服务器重新拉取快照
│   └── restore-local.sh             # 本地还原整套服务
└── docs/
    └── SNAPSHOT.md                  # 元数据、采集命令、还原验证记录
```

### 为什么核心是压缩包而不是展开目录

核心代码属于**可替换的软件**，不是站点数据。展开入库会让每次 WP 升级产生数千文件、
上万行噪声 diff，掩盖真正变化的主题、插件与内容。因此核心以 `vendor/wp-<版本>-core.tar.gz`
的形式**按版本存档**：还原时解压覆盖，升级时换一个包即可，历史版本仍可回溯。

`wp-content/languages` 则相反——它虽是"下载来的"，但**直接决定渲染结果**（CJK 摘要截断、
`lang` 属性），必须随快照一起保存。

`wp-content/cache`、`wp-content/upgrade` 为纯运行时产物，不入库。

---

## 三、本地还原

```bash
# 一次性彻底重装（会删除旧数据卷）
FRESH=1 ./scripts/restore-local.sh
```

脚本等价于手工执行：

```bash
# 1) 起容器（首次启动会自动建库、初始化卷）
docker compose up -d
docker compose ps            # 等 wpdb 变为 healthy（首次约 1-2 分钟）

# 2) 恢复数据库（覆盖镜像初始化的空库）
docker exec -i wpdb sh -c 'mariadb -uroot -p"$MARIADB_ROOT_PASSWORD" wordpress' \
  < database/wordpress-20261023.sql

# 3) 覆盖 WordPress 核心到 7.1.3（镜像自带的是 7.1.2）
docker cp vendor/wp-7.1.3-core.tar.gz wordpress:/tmp/core.tar.gz
docker exec wordpress tar -xzf /tmp/core.tar.gz -C /var/www/html
docker exec wordpress rm -f /tmp/core.tar.gz

# 4) 覆盖站点文件
docker cp wordpress/wp-config.php  wordpress:/var/www/html/wp-config.php
docker cp wordpress/.htaccess      wordpress:/var/www/html/.htaccess
docker cp wordpress/wp-content/.   wordpress:/var/www/html/wp-content/
docker exec wordpress chown -R www-data:www-data /var/www/html

# 5) 重启并访问
docker compose restart wordpress
# http://localhost:371
```

---

## 四、换地址 / 换域名

快照中 `siteurl` / `home` 为 `http://39.106.8.132`，且**文章正文里硬编码了 12 处同样的地址**
（图片链接）。换主机后必须一并替换，否则图片会指向旧服务器。

```bash
OLD=39.106.8.132
NEW=新服务器IP

docker exec wpdb sh -c "mariadb -uroot -p\"\$MARIADB_ROOT_PASSWORD\" wordpress -e \"
UPDATE wp_options      SET option_value = REPLACE(option_value,'http://$OLD','http://$NEW');
UPDATE wp_posts        SET post_content = REPLACE(post_content,'http://$OLD','http://$NEW');
UPDATE wp_posts        SET guid         = REPLACE(guid,'http://$OLD','http://$NEW');
UPDATE wp_postmeta     SET meta_value   = REPLACE(meta_value,'http://$OLD','http://$NEW');\""
```

> 若新旧 IP **长度不同**，直接 `REPLACE` 会破坏 `wp_options` 里序列化值的长度前缀。
> 此时应改用 `wp search-replace`（wordpress:cli 镜像）或 PHP 中反序列化后再替换。

顺带：`wp_posts.guid` 中有 6 条附件指向 `gaozikun2009.icu:371`，那是上传时的域名。
`guid` 不参与前台渲染，无需替换；若追求干净可一并改。

---

## 五、镜像（离线环境）

目标机器若拉不到 Docker Hub，从源服务器直传即可（同机房走内网最快）：

```bash
# 在源服务器执行；目标机需先装好 docker 并允许 root 免密
docker save wordpress:latest mariadb:11 | gzip -1 \
  | ssh root@目标机 'gunzip | docker load'
```

约 1.1G 原始数据、传输 78 秒。注意：`docker load` 后 `docker images` 显示的 ID 可能与
源机不同（containerd 镜像存储按 manifest 计算），**以镜像内版本为准**：

```bash
docker run --rm --entrypoint sh wordpress:latest -c 'grep "wp_version =" /usr/src/wordpress/wp-includes/version.php'
```

---

## 六、日常增量备份

不要重做全量克隆，只拉变化部分即可：

```bash
./scripts/pull-from-server.sh          # 重新生成 database/*.sql、wp-content、核心包
git add -A && git commit -m "内容更新：<说明>"
```

---

## 七、还原验证记录（2026-10-23）

目标机 `47.109.100.96`（Ubuntu 22.04 / 2 vCPU / 1.7G 内存 / 40G 磁盘，
Docker 29.1.3 + Compose 2.40.3，apt 源为阿里云镜像）。

| 检查项 | 结果 |
| --- | --- |
| `restore-local.sh` 全流程 | ✅ 通过，无人工干预 |
| 数据库 10 张内容表（posts/postmeta/comments/terms/users…） | ✅ md5 逐表一致 |
| `wp-content` 1902 个文件 | ✅ 逐字节一致（sha256） |
| 首页 HTML | ✅ 112600 字节，归一化 IP 后 **0 处差异**（仅浏览量计数 +1） |
| 5 篇文章页 / 登录页 / 后台跳转 | ✅ 全部 HTTP 200（后台 302 → 登录页） |
| 首页 15 个静态资源 | ✅ 15/15 HTTP 200 |
| 内存占用 | ✅ wordpress 86M + mariadb 120M，1.7G 机器无压力 |

修订后**再次清空数据卷、仅用本仓库全新还原**（`FRESH=1 ./scripts/restore-local.sh`）：
核心自动落到 7.1.3，首页与原站 **0 字节差异**，9 张内容表 md5 全部一致。

### 验证暴露并已修复的三个问题

1. **核心版本漂移**：镜像 `wordpress:latest` 内置 7.1.2，而原站已在卷内升级到 7.1.3。
   直接还原会导致摘要渲染、`lang` 属性不同。→ 已补入 `vendor/wp-7.1.3-core.tar.gz`。
2. **语言包不是"可再生成"的**：排除 `wp-content/languages` 后，中文摘要不再按字符截断
   （整段正文被完整输出），`lang` 从 `zh-Hans` 变 `zh-CN`。→ 已纳入仓库。
3. **正文硬编码旧 IP**：12 篇文章的图片链接写死 `http://39.106.8.132`。→ 已在 README
   写明迁移步骤；本次验证中手动替换后图片全部 200。

### 未解决项

- 目标机 **公网 80 / 371 端口从外部不可达**（阿里云安全组未放行），只能在服务器内
  `curl 127.0.0.1` 访问。需要放行安全组规则后才能对外访问。

---

## 八、版本记录

| 版本 | 日期 | 说明 |
| --- | --- | --- |
| v1 | 2026-10-23 | 初始快照：WordPress 7.1.3 + argon 主题 + 全库导出；已按还原验证结果补入语言包与核心包 |
