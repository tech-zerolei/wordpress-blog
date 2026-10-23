#!/usr/bin/env bash
# 从云服务器重新拉取博客快照（数据库 + wp-content + 核心包 + 部署配置）
#
# 依赖：ssh 免密登录（推荐）。若仍用密码，可先执行：
#   ssh-copy-id root@39.106.8.132
#
# 用法：
#   ./scripts/pull-from-server.sh                 # 默认服务器
#   HOST=root@1.2.3.4 ./scripts/pull-from-server.sh
set -euo pipefail

HOST="${HOST:-root@39.106.8.132}"
REMOTE_STAGE="/tmp/blogclone"
LOCAL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VOL="/var/lib/docker/volumes/wordpress_wp_html/_data"
STAMP="$(date +%Y%m%d-%H%M)"
SQL_NAME="wordpress-${STAMP}.sql"

echo "==> 目标：${HOST}  →  ${LOCAL_DIR}"

echo "==> [1/4] 服务器端打包"
ssh "$HOST" bash -s <<EOS
set -e
rm -rf "${REMOTE_STAGE}"; mkdir -p "${REMOTE_STAGE}/wp"
docker exec wpdb sh -c 'mariadb-dump -uroot -p"\$MARIADB_ROOT_PASSWORD" \
  --single-transaction --quick --skip-lock-tables --default-character-set=utf8mb4 \
  --routines --triggers --databases wordpress' > "${REMOTE_STAGE}/db.sql"
cp "${VOL}/wp-config.php" "${VOL}/.htaccess" "${REMOTE_STAGE}/wp/"
tar -C "${VOL}/wp-content" -czf "${REMOTE_STAGE}/wp-content.tar.gz" \
  --exclude=./cache --exclude=./upgrade --exclude='*.log' .
tar -C "${VOL}" -czf "${REMOTE_STAGE}/core.tar.gz" \
  --exclude=./wp-content --exclude=./wp-config.php \
  --exclude=./wp-config-docker.php --exclude=./wp-config-sample.php .
cp /opt/wordpress/docker-compose.yml "${REMOTE_STAGE}/"
ls -lh "${REMOTE_STAGE}"
EOS

echo "==> [2/4] 拉取到本地"
rm -rf "${LOCAL_DIR}/.staging"; mkdir -p "${LOCAL_DIR}/.staging"
ssh "$HOST" "tar -C '${REMOTE_STAGE}' -czf - ." | tar -xzf - -C "${LOCAL_DIR}/.staging"

echo "==> [3/4] 展开并替换"
mkdir -p "${LOCAL_DIR}/wordpress/wp-content" "${LOCAL_DIR}/database" "${LOCAL_DIR}/vendor"
tar -xzf "${LOCAL_DIR}/.staging/wp-content.tar.gz" -C "${LOCAL_DIR}/wordpress/wp-content"
cp "${LOCAL_DIR}/.staging/wp/wp-config.php" "${LOCAL_DIR}/wordpress/wp-config.php"
cp -a "${LOCAL_DIR}/.staging/wp/.htaccess" "${LOCAL_DIR}/wordpress/.htaccess"
cp "${LOCAL_DIR}/.staging/docker-compose.yml" "${LOCAL_DIR}/docker-compose.yml"
cp "${LOCAL_DIR}/.staging/db.sql" "${LOCAL_DIR}/database/${SQL_NAME}"

VER="$(tar -xzOf "${LOCAL_DIR}/.staging/core.tar.gz" ./wp-includes/version.php 2>/dev/null \
       | grep -oE "wp_version = '[^']+'" | head -1 | cut -d"'" -f2 || true)"
VER="${VER:-unknown}"
cp "${LOCAL_DIR}/.staging/core.tar.gz" "${LOCAL_DIR}/vendor/wp-${VER}-core.tar.gz"
rm -rf "${LOCAL_DIR}/.staging"

echo
echo "完成："
echo "  数据库  database/${SQL_NAME}"
echo "  核心包  vendor/wp-${VER}-core.tar.gz"
echo "下一步：git add -A && git commit -m \"内容更新：<说明>\""
