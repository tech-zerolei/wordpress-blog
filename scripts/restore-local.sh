#!/usr/bin/env bash
# Local NEW deployment only; refuses to overwrite a populated WordPress volume.
set -euo pipefail
ROOT=$(cd -- "$(dirname -- "$0")/.." && pwd)
cd "$ROOT"
[ -f .env ] || { echo 'Run scripts/init-env.sh first.' >&2; exit 1; }
if docker container inspect wordpress >/dev/null 2>&1 || docker container inspect wpdb >/dev/null 2>&1; then
  echo 'Existing blog containers found (running or stopped); refusing automatic overwrite.' >&2; exit 1
fi
PROJECT=${COMPOSE_PROJECT_NAME:-wordpress-blog}
if docker volume ls -q --filter "label=com.docker.compose.project=$PROJECT" | grep -q .; then
  echo 'Existing project volumes found; refusing to overwrite data.' >&2; exit 1
fi
docker compose up -d
# Wait for WP files to be installed by the official image; DB health is checked by Compose.
for _ in $(seq 1 60); do docker exec wordpress test -f /var/www/html/wp-includes/version.php && break || sleep 2; done
if docker exec wordpress sh -c 'test -d /var/www/html/wp-content/mu-plugins/zero-anime'; then
  echo 'Existing Zero Anime release found; refusing overwrite.' >&2; exit 1
fi
docker exec wordpress mkdir -p /var/www/html/wp-content/mu-plugins
docker cp wordpress/wp-content/mu-plugins/zero-anime wordpress:/var/www/html/wp-content/mu-plugins/zero-anime
# Do not overwrite production wp-config.php; official image generates its environment-backed config.
if [ -d wordpress/wp-content/themes/argon ]; then docker cp wordpress/wp-content/themes/argon wordpress:/var/www/html/wp-content/themes/argon; fi
if [ -d wordpress/wp-content/uploads ]; then docker cp wordpress/wp-content/uploads wordpress:/var/www/html/wp-content/uploads; fi
docker cp wordpress/wp-content/mu-plugins/zero-anime.php wordpress:/var/www/html/wp-content/mu-plugins/zero-anime.php
docker exec wordpress chown -R www-data:www-data /var/www/html/wp-content
printf 'New environment prepared. Complete WP installation and activate Argon. No private database imported.\n'
