#!/usr/bin/env bash
#
# bin/deploy.sh
#
# Detekuje, zda na stroji běží nginx nebo Apache, nakopíruje příslušný
# konfigurák z _server/<server>/artewu.cz.conf do sites-available,
# vytvoří symlink do sites-enabled, otestuje syntaxi a reloadne službu.
#
# V konfiguráku se token __WEBROOT__ nahrazuje skutečnou cestou
# k adresáři dist/ v aktuálním checkoutu repozitáře.
#
# Použití (po `pnpm build`):
#   pnpm deploy
# Pokud nejsi root, skript si sám vyžádá sudo.

set -euo pipefail

SITE="artewu.cz"
CONFIG_NAME="${SITE}.conf"

# Cesty
SCRIPT_DIR="$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &>/dev/null && pwd )"
REPO_ROOT="$( cd "${SCRIPT_DIR}/.." &>/dev/null && pwd )"
WEBROOT="${REPO_ROOT}/dist"

log()  { printf '\033[1;34m[deploy]\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m[deploy]\033[0m %s\n' "$*" >&2; }
err()  { printf '\033[1;31m[deploy]\033[0m %s\n' "$*" >&2; }

# Sanity checks
if [[ ! -d "${WEBROOT}" ]]; then
    err "Adresář ${WEBROOT} neexistuje. Spusť nejdřív 'pnpm build'."
    exit 1
fi

if [[ ! -f "${WEBROOT}/index.html" ]]; then
    err "V ${WEBROOT} chybí index.html — vypadá to, že build proběhl chybně."
    exit 1
fi

# Detekce webserveru
if   [[ -d /etc/nginx/sites-available  ]]; then
    SERVER="nginx"
    AVAIL_DIR="/etc/nginx/sites-available"
    ENABLED_DIR="/etc/nginx/sites-enabled"
    TEST_CMD=(nginx -t)
    RELOAD_CMD=(systemctl reload nginx)
elif [[ -d /etc/apache2/sites-available ]]; then
    SERVER="apache"
    AVAIL_DIR="/etc/apache2/sites-available"
    ENABLED_DIR="/etc/apache2/sites-enabled"
    TEST_CMD=(apache2ctl configtest)
    RELOAD_CMD=(systemctl reload apache2)
else
    err "Nenalezen ani /etc/nginx/sites-available, ani /etc/apache2/sites-available."
    err "Nainstaluj nginx (apt install nginx) nebo apache2 (apt install apache2)."
    exit 1
fi

SOURCE_CONFIG="${REPO_ROOT}/_server/${SERVER}/${CONFIG_NAME}"
TARGET_CONFIG="${AVAIL_DIR}/${CONFIG_NAME}"
ENABLED_LINK="${ENABLED_DIR}/${CONFIG_NAME}"

if [[ ! -f "${SOURCE_CONFIG}" ]]; then
    err "Zdrojový konfigurák ${SOURCE_CONFIG} nenalezen."
    exit 1
fi

log "Detekován webserver: ${SERVER}"
log "Webroot:             ${WEBROOT}"
log "Zdroj konfigurace:   ${SOURCE_CONFIG}"
log "Cíl:                 ${TARGET_CONFIG}"

# Vynucení root práv
if [[ $EUID -ne 0 ]]; then
    log "Není spuštěno jako root — přepínám přes sudo."
    exec sudo -E bash "${BASH_SOURCE[0]}" "$@"
fi

# Vlastní instalace konfigurace (s nahrazením __WEBROOT__)
log "Kopíruji konfiguraci a doplňuji webroot..."
TMP_CONFIG="$(mktemp)"
trap 'rm -f "${TMP_CONFIG}"' EXIT

sed "s|__WEBROOT__|${WEBROOT}|g" "${SOURCE_CONFIG}" > "${TMP_CONFIG}"

# Přepis existující konfigurace (s varováním a zálohou)
if [[ -f "${TARGET_CONFIG}" ]]; then
    if cmp -s "${TARGET_CONFIG}" "${TMP_CONFIG}"; then
        log "Konfigurace je beze změny, přepisování přeskočeno."
    else
        BACKUP="${TARGET_CONFIG}.bak.$(date +%Y%m%d-%H%M%S)"
        cp -p "${TARGET_CONFIG}" "${BACKUP}"
        warn "Existující konfigurace přepsána. Záloha: ${BACKUP}"
    fi
fi

install -m 0644 "${TMP_CONFIG}" "${TARGET_CONFIG}"

# Symlink do sites-enabled
if [[ -L "${ENABLED_LINK}" ]] || [[ -e "${ENABLED_LINK}" ]]; then
    rm -f "${ENABLED_LINK}"
fi
ln -s "${TARGET_CONFIG}" "${ENABLED_LINK}"
log "Symlink vytvořen: ${ENABLED_LINK} -> ${TARGET_CONFIG}"

# Test syntaxe
log "Testuji syntaxi konfigurace..."
if ! "${TEST_CMD[@]}"; then
    err "Test konfigurace selhal — služba nebyla reloadnuta."
    exit 1
fi

# Reload služby
log "Reloaduji ${SERVER}..."
"${RELOAD_CMD[@]}"

log "Hotovo. ${SITE} běží přes ${SERVER}."
log "Tip: pro HTTPS spusť 'sudo certbot --${SERVER} -d ${SITE} -d www.${SITE}'."
