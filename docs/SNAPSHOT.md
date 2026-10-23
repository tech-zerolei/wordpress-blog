# 快照元数据

采集时间：**2026-10-23 12:57 (Asia/Shanghai)**
采集方式：通过 SSH 登录 `root@39.106.8.132`，从 Docker 卷与容器内直接导出。

## 主机

| 项目 | 值 |
| --- | --- |
| 公网 IP | `39.106.8.132` |
| 主机名 | `iZ2ze2gtj9woyo2c2yi6hoZ` |
| 系统 | Alibaba Cloud Linux 3 (OpenAnolis Edition) |
| 内核 | 5.10.134-19.1.al8.x86_64 |
| 磁盘 | `/` 30G，已用 12G（41%） |

## 容器

| 容器 | 镜像 | 镜像 ID | 端口 | 状态（快照时） |
| --- | --- | --- | --- | --- |
| `wordpress` | `wordpress:latest` | `56e40abd9d55` | `80→80`, `371→80` | Up 3 days |
| `wpdb` | `mariadb:11` | `53ef799caed2` | 内部 `3306` | Up 3 days (healthy) |

运行时版本：WordPress **7.1.3**（`wp_db_version = 61833`）、PHP **8.3.35**、
MariaDB **11.8.9**。

## 站点

| 配置项 | 值 |
| --- | --- |
| `blogname` | Zero |
| `blogdescription` | （空） |
| `siteurl` / `home` | `http://39.106.8.132` |
| `template` / `stylesheet` | `argon` |
| `WPLANG` | `zh_CN` |
| `permalink_structure` | （空，未启用伪静态） |
| `show_on_front` | `posts` |
| `active_plugins` | `a:0:{}`（无启用插件） |

## 数据量

| 表 / 类型 | 数量 |
| --- | --- |
| 已发布文章 | 5 |
| 页面 | 1 |
| 草稿 | 0 |
| 媒体附件 | 65 |
| 评论 | 4 |
| 用户 | 1 |
| 数据表 | 12 张，合计 4.2 MB |

## 文件

| 目录 | 大小 |
| --- | --- |
| `wp-content/themes` | 45 MB（argon 9.0M，Sakurairo 21M，默认主题 15M） |
| `wp-content/uploads` | 17 MB（`2026/` 与 `iro_gallery/`） |
| `wp-content/plugins` | 1.4 MB（akismet、metronet-profile-picture，均未启用） |
| `wp-content/mu-plugins` | 空 |
| 数据库导出 | 1.5 MB |

## 采集命令留档

```bash
# 数据库
docker exec wpdb sh -c 'mariadb-dump -uroot -p"$MARIADB_ROOT_PASSWORD" \
  --single-transaction --quick --skip-lock-tables \
  --default-character-set=utf8mb4 --routines --triggers \
  --databases wordpress' > wordpress-db.sql

# 站点文件
tar -C /var/lib/docker/volumes/wordpress_wp_html/_data/wp-content -czf wp-content.tar.gz \
  --exclude=./cache --exclude=./upgrade --exclude=./languages --exclude='*.log' .

# 配置
cp /var/lib/docker/volumes/wordpress_wp_html/_data/{wp-config.php,.htaccess} .
cp /opt/wordpress/docker-compose.yml .
```

> 服务器上另存历史安装包 `/root/wordpress-package/`（`images.tar` 1.26G、
> `wp_html.tar.gz` 61M、`wordpress.sql` 1.4M，2026-10-20），可用于离线部署，
> 但内容早于本次快照，**不作为版本一的数据源**。

---

## 还原验证（2026-10-23）

目标机：`47.109.100.96`（阿里云 ECS，Ubuntu 22.04.5 / 2 vCPU / 1.7G 内存 / 40G 磁盘）

| 项目 | 值 |
| --- | --- |
| 主机名 | `iZ2vcei33j06dm3qups8p1Z` |
| Docker | 29.1.3（apt 安装，overlayfs） |
| Compose | v2.40.3 |
| 镜像来源 | 源机 `docker save` → 内网直传 → 目标机 `docker load`（78 秒） |

### 步骤与耗时

1. apt 安装 docker.io + docker-compose-v2（阿里云镜像源）
2. 目标机配置源机公钥，实现源机 → 目标机免密
3. 传输仓库工作树（63M）→ `/opt/wordpress`
4. `FRESH=1 bash scripts/restore-local.sh`

### 结果

```
数据库 10 张内容表 md5 逐表一致
wp-content 1902 文件 sha256 逐字节一致
首页 HTML 112600 字节，归一化 IP 后 0 处差异（仅浏览量计数变化）
5 篇文章页 / 登录页 / 后台跳转 / 15 个静态资源 全部正常
```

### 三个关键发现

| 问题 | 现象 | 处置 |
| --- | --- | --- |
| 镜像核心为 7.1.2，卷内已升级到 7.1.3 | 摘要截断方式、`lang` 属性、generator 元信息不同 | 补入 `vendor/wp-7.1.3-core.tar.gz` |
| 排除 `wp-content/languages` | 中文摘要整段输出（不按字符截断）、`lang` 变 `zh-CN` | 纳入仓库 |
| 正文硬编码 `http://39.106.8.132`（12 处） | 图片指向旧服务器 | README 记录等长替换法 |

### 已知限制

目标机公网 **80 / 371 端口不可达**（阿里云安全组未放行），仅服务器内 `curl 127.0.0.1` 正常。
