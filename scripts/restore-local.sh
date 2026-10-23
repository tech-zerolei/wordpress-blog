#!/usr/bin/env bash
# 在本地用本仓库还原整套博客服务
#
# 用法：
#   ./scripts/restore-local.sh                      # 使用最新一份 database/*.sql
#   SQL=database/wordpress-20261023.sql ./scripts/restore-local.sh
#   FRESH=1 ./scripts/restore-local.sh              # 先删卷再还原（彻底重装）
#
# 依赖：docker + docker compose；镜像 wordpress:latest、mariadb:11
#      （离线环境见 README「镜像」一节）
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

SQL="${SQL:-$(ls -1t database/*.sql 2>/dev/null | head -1)}"
PORT="${PORT:-371}"
CORE="$(ls -1 vendor/wp-*-core.tar.gz 2>/dev/null | head -1 || true)"

COMPOSE="docker compose"
$COMPOSE version >/dev/null 2>&1 || COMPOSE="docker-compose"

if [ -z "${SQL:-}" ] || [ ! -f "$SQL" ]; then
  echo "找不到数据库文件（database/*.sql）" >&2
  exit 1
fi

echo "==> 数据库：$SQL"
echo "==> 核心包：${CORE:-未提供，使用镜像自带核心}"
echo "==> 端口：$PORT"

if [ "${FRESH:-0}" = "1" ]; then
  echo "==> [0/6] 清除旧容器与数据卷"
  $COMPOSE down -v --remove-orphans
fi

echo "==> [1/6] 启动容器"
$COMPOSE up -d

echo "==> [2/6] 等待数据库就绪"
for i in $(seq 1 60); do
  if docker exec wpdb sh -c 'mariadb-admin ping -uroot -p"$MARIADB_ROOT_PASSWORD" --silent' >/dev/null 2>&1; then
    echo "    wpdb 就绪"; break
  fi
  sleep 2
  [ "$i" = 60 ] && { echo "    数据库超时" >&2; exit 1; }
done

echo "==> [3/6] 导入数据库"
docker exec -i wpdb sh -c 'mariadb -uroot -p"$MARIADB_ROOT_PASSWORD" wordpress' < "$SQL"

echo "==> [4/6] 覆盖 WordPress 核心"
if [ -n "${CORE:-}" ] && [ -f "$CORE" ]; then
  docker cp "$CORE" wordpress:/tmp/core.tar.gz
  docker exec wordpress tar -xzf /tmp/core.tar.gz -C /var/www/html
  docker exec wordpress rm -f /tmp/core.tar.gz
  docker exec wordpress sh -c 'grep "wp_version =" /var/www/html/wp-includes/version.php' || true
else
  echo "    跳过（无 vendor 核心包，将使用镜像自带的 WordPress 版本）"
fi

echo "==> [5/6] 覆盖站点文件"
docker cp wordpress/wp-config.php wordpress:/var/www/html/wp-config.php
[ -f wordpress/.htaccess ] && docker cp wordpress/.htaccess wordpress:/var/www/html/.htaccess
docker cp wordpress/wp-content/. wordpress:/var/www/html/wp-content/
docker exec wordpress chown -R www-data:www-data /var/www/html

echo "==> [6/6] 重启 WordPress"
$COMPOSE restart wordpress

echo
echo "完成 → http://localhost:${PORT}"
echo "站点地址若与快照不一致，见 README「换地址/换域名」一节。"
