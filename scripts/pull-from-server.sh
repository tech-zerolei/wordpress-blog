#!/usr/bin/env bash
# Read-only, private backup. Uses SSH key/interactive authentication; never stores SSH credentials.
set -euo pipefail
ROOT=$(cd -- "$(dirname -- "$0")/.." && pwd)
HOST=${1:?Usage: scripts/pull-from-server.sh user@host}
OUT="$ROOT/backups/private-$(date +%Y%m%d-%H%M%S)"
umask 077
mkdir -p "$OUT"
ssh "$HOST" 'tar --acls --xattrs -czpf - -C /var/lib/docker/volumes/wordpress_wp_html/_data .' > "$OUT/wordpress-files.tar.gz"
ssh "$HOST" 'docker exec wpdb sh -c '\''MYSQL_PWD="$MARIADB_ROOT_PASSWORD" mariadb-dump -uroot --single-transaction --routines --triggers --events --hex-blob --databases "$MARIADB_DATABASE"'\''' | gzip > "$OUT/database.sql.gz"
ssh "$HOST" 'cat /opt/wordpress/docker-compose.yml' > "$OUT/docker-compose.private.yml"
gzip -t "$OUT/wordpress-files.tar.gz" "$OUT/database.sql.gz"
(cd "$OUT" && sha256sum wordpress-files.tar.gz database.sql.gz docker-compose.private.yml > SHA256SUMS)
printf 'Private backup saved in %s (ignored by Git).\n' "$OUT"
