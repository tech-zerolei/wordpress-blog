#!/usr/bin/env bash
# Generate a new private config for NEW deployments only; never rotate a running DB implicitly.
set -euo pipefail
ROOT=$(cd -- "$(dirname -- "$0")/.." && pwd)
[ ! -e "$ROOT/.env" ] || { echo '.env already exists; refusing to overwrite.' >&2; exit 1; }
umask 077
python3 - "$ROOT/.env" <<'PY'
import os,secrets,sys
keys=['WORDPRESS_DB_PASSWORD','MARIADB_ROOT_PASSWORD','WORDPRESS_AUTH_KEY','WORDPRESS_SECURE_AUTH_KEY','WORDPRESS_LOGGED_IN_KEY','WORDPRESS_NONCE_KEY','WORDPRESS_AUTH_SALT','WORDPRESS_SECURE_AUTH_SALT','WORDPRESS_LOGGED_IN_SALT','WORDPRESS_NONCE_SALT']
with open(sys.argv[1],'x') as f:
    f.write('# Private runtime config. Never commit this file.\n')
    for key in keys:f.write(key+'='+secrets.token_hex(32)+'\n')
os.chmod(sys.argv[1],0o600)
PY
printf 'Created private .env. Keep it out of Git and use it only for a new deployment.\n'
