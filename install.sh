#!/bin/sh

# SUBSYNC_STALE_JS_CLEANUP_V118B_BEGIN
subsync_remove_file_v118b() {
    f="$1"
    [ -e "$f" ] || return 0
    echo "[Podcop Sub v666] remove stale JS: $f"
    rm -f "$f" 2>/dev/null || true
}

subsync_cleanup_subsync_stale_dir_v118b() {
    dir="$1"
    [ -d "$dir" ] || return 0

    for f in "$dir"/sub_sync_v*.js; do
        subsync_remove_file_v118b "$f"
    done

    for f in "$dir"/sub_sync_live*.js; do
        subsync_remove_file_v118b "$f"
    done

    for f in "$dir"/sub_sync_*.js; do
        [ "$f" = "$dir/sub_sync.js" ] && continue
        subsync_remove_file_v118b "$f"
    done

    for f in "$dir"/sub_sync-*.js; do
        [ "$f" = "$dir/sub_sync.js" ] && continue
        subsync_remove_file_v118b "$f"
    done
}

subsync_cleanup_subsync_uninstall_live_dir_v118b() {
    dir="$1"
    [ -d "$dir" ] || return 0

    for f in "$dir"/*.js; do
        subsync_remove_file_v118b "$f"
    done

    rmdir "$dir" 2>/dev/null || true
}

subsync_cleanup_podkop_stale_dir_v118b() {
    dir="$1"
    [ -d "$dir" ] || return 0

    for f in "$dir"/podkop_subsync_*.js; do
        subsync_remove_file_v118b "$f"
    done

    for f in "$dir"/main_subsync_*.js; do
        subsync_remove_file_v118b "$f"
    done

    for f in "$dir"/*_subsync_*.js; do
        subsync_remove_file_v118b "$f"
    done
}

subsync_cleanup_stale_luci_js_v118b() {
    mode="${1:-install}"

    echo "[Podcop Sub v666] cleanup stale LuCI JS files v118b, mode=$mode"

    live_subsync_dir="/www/luci-static/resources/view/sub_sync"
    live_podkop_dir="/www/luci-static/resources/view/podkop"

    repo_subsync_dir="/root/luci-app-sub-sync/htdocs/luci-static/resources/view/sub_sync"
    repo_podkop_dir="/root/luci-app-sub-sync/htdocs/luci-static/resources/view/podkop"

    if [ "$mode" = "uninstall" ]; then
        subsync_cleanup_subsync_uninstall_live_dir_v118b "$live_subsync_dir"
    else
        subsync_cleanup_subsync_stale_dir_v118b "$live_subsync_dir"
    fi

    subsync_cleanup_podkop_stale_dir_v118b "$live_podkop_dir"

    # Repo cleanup is always conservative:
    # remove only old generated/versioned leftovers, never the main source file.
    subsync_cleanup_subsync_stale_dir_v118b "$repo_subsync_dir"
    subsync_cleanup_podkop_stale_dir_v118b "$repo_podkop_dir"

    rm -rf /tmp/luci-modulecache/* /tmp/luci-indexcache* /tmp/luci-sessions/* 2>/dev/null || true
}

subsync_cleanup_stale_luci_js_v118b "install"
# SUBSYNC_STALE_JS_CLEANUP_V118B_END




REPO="${SUBSYNC_REPO:-kzolotarev95/luci-app-sub-sync666}"
BRANCH="${SUBSYNC_BRANCH:-main}"
RAW="https://raw.githubusercontent.com/${REPO}/${BRANCH}"

VIEW_DIR="/www/luci-static/resources/view/sub_sync"
VIEW_FILE="${VIEW_DIR}/sub_sync.js"
BIN_FILE="/usr/bin/sub-sync"
ACL_FILE="/usr/share/rpcd/acl.d/luci-app-sub-sync.json"

PODKOP_MENU="/usr/share/luci/menu.d/luci-app-podkop.json"
PODKOP_BAK="/usr/share/luci/menu.d/luci-app-podkop.json.bak.subsync"

echo ""
echo "========================================="
echo "  Podcop Sub v666 — integrated install"
echo "========================================="
echo ""

if [ ! -f /etc/openwrt_release ]; then
    echo "ОШИБКА: требуется OpenWrt"
    exit 1
fi

if [ ! -f /etc/config/podkop ]; then
    echo "ОШИБКА: Podkop не установлен"
    exit 1
fi

if [ ! -f "$PODKOP_MENU" ]; then
    echo "ОШИБКА: не найдено меню Podkop: $PODKOP_MENU"
    exit 1
fi

echo "→ Бэкап перед установкой..."
BACKUP="/root/podcop-sub-v666-before-install-$(date +%Y%m%d-%H%M%S).tar.gz"
tar -czf "$BACKUP" -C / \
  usr/share/luci/menu.d/luci-app-podkop.json \
  usr/share/luci/menu.d/luci-app-podkop.json.bak.subsync \
  usr/share/luci/menu.d/luci-app-sub-sync.json \
  usr/share/rpcd/acl.d/luci-app-sub-sync.json \
  www/luci-static/resources/view/sub_sync \
  usr/bin/sub-sync \
  etc/sub-sync \
  2>/dev/null || true
echo "  ✓ Бэкап: $BACKUP"

echo "→ Сохранение родного меню Podkop..."
if grep -q 'sub_sync/sub_sync' "$PODKOP_MENU" 2>/dev/null; then
    echo "  ! Podkop уже переключён на Podcop Sub v666 view"
else
    cp -f "$PODKOP_MENU" "$PODKOP_BAK"
    chmod 644 "$PODKOP_BAK"
    echo "  ✓ Родное меню сохранено: $PODKOP_BAK"
fi

echo "→ Проверка зависимостей..."
opkg update >/dev/null 2>&1 || true
command -v wget >/dev/null 2>&1 || opkg install wget >/dev/null 2>&1 || true
[ -f /etc/ssl/certs/ca-certificates.crt ] || opkg install ca-certificates >/dev/null 2>&1 || true

echo "→ Установка файлов Podcop Sub v666..."
mkdir -p "$VIEW_DIR"
mkdir -p /etc/sub-sync

wget -O "$VIEW_FILE" "${RAW}/htdocs/luci-static/resources/view/sub_sync/sub_sync.js?v=$(date +%s)" || {
    echo "ОШИБКА: не удалось скачать LuCI view"
    exit 1
}

wget -O "$BIN_FILE" "${RAW}/root/usr/bin/sub-sync?v=$(date +%s)" || {
    echo "ОШИБКА: не удалось скачать /usr/bin/sub-sync"
    exit 1
}

sed -i 's/\r$//' "$BIN_FILE" "$VIEW_FILE" 2>/dev/null || true
chmod 755 "$BIN_FILE"
chmod 644 "$VIEW_FILE"

echo "→ Создание ACL Podcop Sub v666..."
cat > "$ACL_FILE" <<'ACLEOF'
{
    "luci-app-sub-sync": {
        "description": "Grant access to Podcop Sub v666",
        "read": {
            "ubus": {
                "file": [ "exec" ]
            },
            "uci": [ "podkop" ],
            "file": {
                "/usr/bin/sub-sync": [ "exec" ]
            }
        },
        "write": {
            "ubus": {
                "file": [ "exec" ]
            },
            "uci": [ "podkop" ],
            "file": {
                "/usr/bin/sub-sync": [ "exec" ]
            }
        }
    }
}
ACLEOF
chmod 644 "$ACL_FILE"

echo "→ Переключение Services → Podkop на интегрированный Podcop Sub v666 view..."
cat > "$PODKOP_MENU" <<'MENUEOF'
{
    "admin/services/podkop": {
        "title": "Podkop",
        "order": 42,
        "action": {
            "type": "view",
            "path": "sub_sync/sub_sync"
        },
        "depends": {
            "acl": [ "luci-app-podkop", "luci-app-sub-sync" ],
            "uci": { "podkop": true }
        }
    }
}
MENUEOF
chmod 644 "$PODKOP_MENU"

echo "→ Удаление отдельного пункта Services → Podcop Sub v666, если был..."
rm -f /usr/share/luci/menu.d/luci-app-sub-sync.json

# SUBSYNC_INSTALL_HELPERS_ACL_V120_BEGIN
echo "→ Установка helper файлов Podcop Sub v666..."

for helper in \
    sub-sync.v51base \
    sub-sync-section \
    sub-sync-autoadd \
    sub-sync-subs-info \
    sub-sync-system-info \
    sub-sync-singbox-log
do
    echo "  - /usr/bin/$helper"
    if ! wget -qO "/usr/bin/$helper" "$RAW/root/usr/bin/$helper?v=$(date +%s)"; then
        echo "ERROR: helper не скачался: $helper"
        exit 1
    fi
    chmod 755 "/usr/bin/$helper"
    sh -n "/usr/bin/$helper" || {
        echo "ERROR: helper syntax bad: $helper"
        exit 1
    }
done

echo "  - /usr/bin/sub-sync-donaters optional"
if wget -qO "/usr/bin/sub-sync-donaters" "$RAW/root/usr/bin/sub-sync-donaters?v=$(date +%s)"; then
    chmod 755 "/usr/bin/sub-sync-donaters" 2>/dev/null || true
    sh -n "/usr/bin/sub-sync-donaters" || rm -f "/usr/bin/sub-sync-donaters"
else
    rm -f "/usr/bin/sub-sync-donaters" 2>/dev/null || true
fi

echo "→ Установка полного ACL Podcop Sub v666..."
mkdir -p /usr/share/rpcd/acl.d
if wget -qO /tmp/luci-app-sub-sync.acl "$RAW/root/usr/share/rpcd/acl.d/luci-app-sub-sync.json?v=$(date +%s)"; then
    cp -f /tmp/luci-app-sub-sync.acl /usr/share/rpcd/acl.d/luci-app-sub-sync.json
else
    echo "ERROR: ACL из GitHub не скачался"
    exit 1
fi

chmod 644 /usr/share/rpcd/acl.d/luci-app-sub-sync.json 2>/dev/null || true
# SUBSYNC_INSTALL_HELPERS_ACL_V120_END


# SUBSYNC_OLD_WORKING_GRADIENT_INSTALL_V115_BEGIN
echo "→ Установка старого рабочего градиентного перелива Podcop Sub v666 v115..."

cat > /tmp/podcop666-old-gradient-v115.css <<'CSS'

/* SUBSYNC_OLD_WORKING_GRADIENT_V115_BEGIN */
@keyframes ssSubSyncGradientFlowV115 {
    0% {
        background-position: 0% 50%;
        filter: hue-rotate(0deg) brightness(1.15);
    }
    50% {
        background-position: 160% 50%;
        filter: hue-rotate(120deg) brightness(1.35);
    }
    100% {
        background-position: 320% 50%;
        filter: hue-rotate(360deg) brightness(1.15);
    }
}

.ss-subsync-shine-v115,
.ss-podcop-sub-v666-shine-v115,
a.ss-subsync-shine-v115,
a.ss-podcop-sub-v666-shine-v115 {
    display: inline-block !important;
    font-weight: 900 !important;
    letter-spacing: .35px !important;
    text-decoration: none !important;

    background-image: linear-gradient(90deg,#00d5ff,#ffffff,#ffd84d,#ff4fd8,#7c4dff,#00d5ff) !important;
    background-size: 320% 100% !important;
    background-position: 0% 50% !important;

    -webkit-background-clip: text !important;
    background-clip: text !important;
    -webkit-text-fill-color: transparent !important;
    color: transparent !important;

    animation-name: ssSubSyncGradientFlowV115 !important;
    animation-duration: 1.15s !important;
    animation-timing-function: linear !important;
    animation-iteration-count: infinite !important;

    will-change: background-position, filter !important;
    text-shadow: 0 0 10px rgba(0,213,255,.55), 0 0 22px rgba(255,79,216,.45) !important;
}
/* SUBSYNC_OLD_WORKING_GRADIENT_V115_END */
CSS

for css in /www/luci-static/*/cascade.css; do
    [ -f "$css" ] || continue

    sed -i '/SUBSYNC_OLD_WORKING_GRADIENT_V115_BEGIN/,/SUBSYNC_OLD_WORKING_GRADIENT_V115_END/d' "$css"
    sed -i '/SUBSYNC_PODCOP_SUB_V666_SHINE_V122_BEGIN/,/SUBSYNC_PODCOP_SUB_V666_SHINE_V122_END/d' "$css"
    sed -i '/SUBSYNC_PODCOP_SUB_V666_GRADIENT_V124_BEGIN/,/SUBSYNC_PODCOP_SUB_V666_GRADIENT_V124_END/d' "$css"

    cat /tmp/podcop666-old-gradient-v115.css >> "$css"
done

rm -f /tmp/podcop666-old-gradient-v115.css
# SUBSYNC_OLD_WORKING_GRADIENT_INSTALL_V115_END

# SUBSYNC_PODCOP_XHTTP_INSTALL_V123_BEGIN
echo "→ Установка xHTTP patch Podkop для Podcop Sub v666..."

if wget -qO /usr/bin/podcop-sub-v666-xhttp-patch "$RAW/root/usr/bin/podcop-sub-v666-xhttp-patch?v=$(date +%s)"; then
    chmod 755 /usr/bin/podcop-sub-v666-xhttp-patch
    sh -n /usr/bin/podcop-sub-v666-xhttp-patch
    /usr/bin/podcop-sub-v666-xhttp-patch apply
else
    echo "ERROR: xHTTP patch helper не скачался"
    exit 1
fi
# SUBSYNC_PODCOP_XHTTP_INSTALL_V123_END

echo "→ Очистка LuCI кэша..."
rm -rf /tmp/luci-modulecache/* /tmp/luci-indexcache* /tmp/luci-sessions/* 2>/dev/null || true
touch /usr/lib/opkg/status 2>/dev/null || touch /lib/apk/db/installed 2>/dev/null || true

echo "→ Перезапуск LuCI..."
/etc/init.d/rpcd restart 2>/dev/null || true
/etc/init.d/uhttpd restart 2>/dev/null || true

echo ""
echo "========================================="
echo "  Podcop Sub v666 встроен в Podkop"
echo "========================================="
echo ""
echo "  Открывать:"
echo "  Services → Podkop"
echo ""
echo "  Бэкап:"
echo "  $BACKUP"
echo ""
echo "  Откат:"
echo "  tar -xzf $BACKUP -C /"
echo ""
echo "  Обнови страницу: Ctrl+F5"
echo ""


# SUBSYNC_DONATERS_PUBLIC_INSTALL_V134B_BEGIN
echo "[Podcop Sub v666] Installing public Donaters list..."

DON_REPO="${SUBSYNC_REPO:-kzolotarev95/luci-app-sub-sync666}"
DON_BRANCH="${SUBSYNC_BRANCH:-main}"
DON_RAW="https://raw.githubusercontent.com/${DON_REPO}/${DON_BRANCH}"
DON_TS="$(date +%s)"

mkdir -p /etc/sub-sync /usr/bin

wget -qO /usr/bin/sub-sync-donaters "${DON_RAW}/root/usr/bin/sub-sync-donaters?v=${DON_TS}" || {
    echo "[Podcop Sub v666] ERROR: failed to download /usr/bin/sub-sync-donaters"
    exit 1
}

chmod 755 /usr/bin/sub-sync-donaters
sh -n /usr/bin/sub-sync-donaters || exit 1

wget -qO /tmp/podcop-sub-v666-donaters.tsv "${DON_RAW}/root/etc/sub-sync/donaters.tsv?v=${DON_TS}" || {
    echo "[Podcop Sub v666] ERROR: failed to download donaters.tsv"
    exit 1
}

cp -f /tmp/podcop-sub-v666-donaters.tsv /etc/sub-sync/donaters.tsv
chmod 644 /etc/sub-sync/donaters.tsv
rm -f /tmp/podcop-sub-v666-donaters.tsv 2>/dev/null || true

wget -qO /tmp/podcop-sub-v666-donaters-style-v134.css "${DON_RAW}/root/etc/sub-sync/donaters-style-v134.css?v=${DON_TS}" || {
    echo "[Podcop Sub v666] ERROR: failed to download donaters-style-v134.css"
    exit 1
}

for css in /www/luci-static/*/cascade.css /www/luci-static/cascade.css; do
    [ -f "$css" ] || continue

    tmp="/tmp/podcop-sub-v666-cascade-donaters-$$.css"

    awk '
        /SUBSYNC_DONATERS_STYLE_V134_BEGIN/ { skip=1; next }
        /SUBSYNC_DONATERS_STYLE_V134_END/ { skip=0; next }
        skip != 1 { print }
    ' "$css" > "$tmp"

    cat /tmp/podcop-sub-v666-donaters-style-v134.css >> "$tmp"
    mv "$tmp" "$css"
done

rm -f /tmp/podcop-sub-v666-donaters-style-v134.css 2>/dev/null || true

ACL="/usr/share/rpcd/acl.d/luci-app-sub-sync.json"
if command -v jq >/dev/null 2>&1 && [ -s "$ACL" ]; then
    tmp="/tmp/luci-app-sub-sync-acl-donaters-$$.json"
    jq '
      (.["luci-app-sub-sync"] //= {}) |
      (.["luci-app-sub-sync"].read //= {}) |
      (.["luci-app-sub-sync"].read.file //= {}) |
      (.["luci-app-sub-sync"].write //= {}) |
      (.["luci-app-sub-sync"].write.file //= {}) |
      .["luci-app-sub-sync"].read.file["/usr/bin/sub-sync-donaters"] = ["exec"] |
      .["luci-app-sub-sync"].write.file["/usr/bin/sub-sync-donaters"] = ["exec"]
    ' "$ACL" > "$tmp" && mv "$tmp" "$ACL"
fi

rm -rf /tmp/luci-modulecache/* /tmp/luci-indexcache* /tmp/luci-sessions/* 2>/dev/null || true

echo "[Podcop Sub v666] Public Donaters list installed"
# SUBSYNC_DONATERS_PUBLIC_INSTALL_V134B_END


# SUBSYNC_REAL_BACKEND_V138_BEGIN
echo "=== Podcop Sub v666 real backend v138 ==="

SUBSYNC_REPO="${SUBSYNC_REPO:-kzolotarev95/luci-app-sub-sync666}"
SUBSYNC_BRANCH="${SUBSYNC_BRANCH:-main}"
SUBSYNC_RAW="https://raw.githubusercontent.com/${SUBSYNC_REPO}/${SUBSYNC_BRANCH}"

wget -qO /usr/bin/sub-sync.real "${SUBSYNC_RAW}/root/usr/bin/sub-sync.real?v=$(date +%s)"
sed -i 's/\r$//' /usr/bin/sub-sync.real
chmod 755 /usr/bin/sub-sync.real

sh -n /usr/bin/sub-sync.real
grep -q "cmd_add_sub" /usr/bin/sub-sync.real
grep -q "cmd_singbox_info" /usr/bin/sub-sync.real

echo "Real backend v138 installed: /usr/bin/sub-sync.real"
# SUBSYNC_REAL_BACKEND_V138_END

# SUBSYNC_MIXED_URLTEST_INSTALL_V165B_BEGIN
# Install mixed URLTest helpers: VLESS/SS/Trojan/HY2/Hysteria2 -> Podkop URL Test.
SUBSYNC_REPO="${SUBSYNC_REPO:-kzolotarev95/luci-app-sub-sync666}"
SUBSYNC_BRANCH="${SUBSYNC_BRANCH:-main}"
SUBSYNC_RAW="https://raw.githubusercontent.com/${SUBSYNC_REPO}/${SUBSYNC_BRANCH}"
SUBSYNC_CACHEBUST="$(date +%s 2>/dev/null || echo now)"

subsync_install_bin_v165b() {
  _name="$1"
  _url="$SUBSYNC_RAW/usr/bin/$_name?v=$SUBSYNC_CACHEBUST"
  _tmp="/tmp/$_name.v165b.$$"

  echo "[Sub Sync] installing $_name"
  if wget -qO "$_tmp" "$_url"; then
    cp -f "$_tmp" "/usr/bin/$_name"
    chmod 755 "/usr/bin/$_name"
    rm -f "$_tmp"
  else
    rm -f "$_tmp"
    echo "[Sub Sync] WARN: failed to download $_url"
    return 1
  fi
}

for _subsync_bin in \
  sub-sync.real \
  sub-sync.v164manualbase \
  sub-sync \
  sub-sync-autoadd \
  sub-sync-manual-link \
  sub-sync-urltest \
  sub-sync-hy2-urltest \
  sub-sync-xhttp-guard \
  podcop-sub-v666-xhttp-patch
do
  subsync_install_bin_v165b "$_subsync_bin" || true
done

if [ -f /usr/share/rpcd/acl.d/luci-app-sub-sync.json ] && command -v jq >/dev/null 2>&1; then
  _acl="/usr/share/rpcd/acl.d/luci-app-sub-sync.json"
  _tmp="/tmp/luci-app-sub-sync.acl.v165b.$$"
  jq '
    .["luci-app-sub-sync"] = (.["luci-app-sub-sync"] // {}) |
    .["luci-app-sub-sync"].read = (.["luci-app-sub-sync"].read // {}) |
    .["luci-app-sub-sync"].write = (.["luci-app-sub-sync"].write // {}) |
    .["luci-app-sub-sync"].read.file = (.["luci-app-sub-sync"].read.file // {}) |
    .["luci-app-sub-sync"].write.file = (.["luci-app-sub-sync"].write.file // {}) |
    .["luci-app-sub-sync"].read.file["/usr/bin/sub-sync-urltest"] = ["exec"] |
    .["luci-app-sub-sync"].write.file["/usr/bin/sub-sync-urltest"] = ["exec"] |
    .["luci-app-sub-sync"].read.file["/usr/bin/sub-sync-hy2-urltest"] = ["exec"] |
    .["luci-app-sub-sync"].write.file["/usr/bin/sub-sync-hy2-urltest"] = ["exec"] |
    .["luci-app-sub-sync"].read.file["/usr/bin/sub-sync-manual-link"] = ["exec"] |
    .["luci-app-sub-sync"].write.file["/usr/bin/sub-sync-manual-link"] = ["exec"]
  ' "$_acl" > "$_tmp" && jq empty "$_tmp" && cp -f "$_tmp" "$_acl"
  rm -f "$_tmp"
fi

[ -x /usr/bin/sub-sync-xhttp-guard ] && /usr/bin/sub-sync-xhttp-guard || true
[ -x /usr/bin/sub-sync-manual-link ] && /usr/bin/sub-sync-manual-link merge >/dev/null 2>&1 || true

rm -rf /tmp/luci-modulecache/* /tmp/luci-indexcache* /tmp/luci-sessions/* 2>/dev/null || true
/etc/init.d/rpcd restart || true
/etc/init.d/uhttpd restart || true

echo "[Sub Sync] Mixed URLTest v165b installed"
# SUBSYNC_MIXED_URLTEST_INSTALL_V165B_END



# SUBSYNC_PUBLIC_UI_FORCE_INSTALL_V166C_BEGIN
SUBSYNC_REPO="${SUBSYNC_REPO:-kzolotarev95/luci-app-sub-sync666}"
SUBSYNC_BRANCH="${SUBSYNC_BRANCH:-main}"
SUBSYNC_RAW="https://raw.githubusercontent.com/${SUBSYNC_REPO}/${SUBSYNC_BRANCH}"
SUBSYNC_CACHEBUST="$(date +%s 2>/dev/null || echo now)"

subsync_install_helper_v166c() {
  _name="$1"
  _tmp="/tmp/$_name.v166c.$$"
  if wget -qO "$_tmp" "$SUBSYNC_RAW/usr/bin/$_name?v=$SUBSYNC_CACHEBUST"; then
    cp -f "$_tmp" "/usr/bin/$_name"
    chmod 755 "/usr/bin/$_name"
  else
    echo "[Sub Sync] WARN: failed to download $_name"
  fi
  rm -f "$_tmp"
}

for _h in sub-sync-public-ui-patch sub-sync-singbox-check sub-sync-singbox-log; do
  subsync_install_helper_v166c "$_h"
done

if [ -f /usr/share/rpcd/acl.d/luci-app-sub-sync.json ] && command -v jq >/dev/null 2>&1; then
  _acl="/usr/share/rpcd/acl.d/luci-app-sub-sync.json"
  _tmp="/tmp/luci-app-sub-sync.acl.v166c.$$"
  jq '
    .["luci-app-sub-sync"] = (.["luci-app-sub-sync"] // {}) |
    .["luci-app-sub-sync"].read = (.["luci-app-sub-sync"].read // {}) |
    .["luci-app-sub-sync"].write = (.["luci-app-sub-sync"].write // {}) |
    .["luci-app-sub-sync"].read.file = (.["luci-app-sub-sync"].read.file // {}) |
    .["luci-app-sub-sync"].write.file = (.["luci-app-sub-sync"].write.file // {}) |
    .["luci-app-sub-sync"].read.file["/usr/bin/sub-sync-public-ui-patch"] = ["exec"] |
    .["luci-app-sub-sync"].write.file["/usr/bin/sub-sync-public-ui-patch"] = ["exec"] |
    .["luci-app-sub-sync"].read.file["/usr/bin/sub-sync-singbox-check"] = ["exec"] |
    .["luci-app-sub-sync"].write.file["/usr/bin/sub-sync-singbox-check"] = ["exec"] |
    .["luci-app-sub-sync"].read.file["/usr/bin/sub-sync-singbox-log"] = ["exec"] |
    .["luci-app-sub-sync"].write.file["/usr/bin/sub-sync-singbox-log"] = ["exec"]
  ' "$_acl" > "$_tmp" && jq empty "$_tmp" && cp -f "$_tmp" "$_acl"
  rm -f "$_tmp"
fi

[ -x /usr/bin/sub-sync-public-ui-patch ] && /usr/bin/sub-sync-public-ui-patch || true
[ -x /usr/bin/sub-sync-singbox-check ] && /usr/bin/sub-sync-singbox-check >/dev/null 2>&1 || true

echo "[Sub Sync] Public UI force patch no-python v166c installed"
# SUBSYNC_PUBLIC_UI_FORCE_INSTALL_V166C_END

# SUBSYNC_MANUAL_LINK_IMPORT_INSTALL_V167_BEGIN
SUBSYNC_REPO="${SUBSYNC_REPO:-kzolotarev95/luci-app-sub-sync666}"
SUBSYNC_BRANCH="${SUBSYNC_BRANCH:-main}"
SUBSYNC_RAW="https://raw.githubusercontent.com/${SUBSYNC_REPO}/${SUBSYNC_BRANCH}"
SUBSYNC_CACHEBUST="$(date +%s 2>/dev/null || echo now)"

subsync_install_manual_import_v167() {
  _tmp="/tmp/sub-sync-manual-import.v167.$$"
  if wget -qO "$_tmp" "$SUBSYNC_RAW/usr/bin/sub-sync-manual-import?v=$SUBSYNC_CACHEBUST"; then
    cp -f "$_tmp" /usr/bin/sub-sync-manual-import
    chmod 755 /usr/bin/sub-sync-manual-import
    echo "[Sub Sync] Manual link import v167 installed"
  else
    echo "[Sub Sync] WARN: failed to download sub-sync-manual-import"
  fi
  rm -f "$_tmp"
}

subsync_install_manual_import_v167

if [ -f /usr/share/rpcd/acl.d/luci-app-sub-sync.json ] && command -v jq >/dev/null 2>&1; then
  _acl="/usr/share/rpcd/acl.d/luci-app-sub-sync.json"
  _tmp="/tmp/luci-app-sub-sync.acl.v167.$$"
  jq '
    .["luci-app-sub-sync"] = (.["luci-app-sub-sync"] // {}) |
    .["luci-app-sub-sync"].read = (.["luci-app-sub-sync"].read // {}) |
    .["luci-app-sub-sync"].write = (.["luci-app-sub-sync"].write // {}) |
    .["luci-app-sub-sync"].read.file = (.["luci-app-sub-sync"].read.file // {}) |
    .["luci-app-sub-sync"].write.file = (.["luci-app-sub-sync"].write.file // {}) |
    .["luci-app-sub-sync"].read.file["/usr/bin/sub-sync-manual-import"] = ["exec"] |
    .["luci-app-sub-sync"].write.file["/usr/bin/sub-sync-manual-import"] = ["exec"]
  ' "$_acl" > "$_tmp" && jq empty "$_tmp" && cp -f "$_tmp" "$_acl"
  rm -f "$_tmp"
fi

if [ -n "${SUBSYNC_MANUAL_LINK:-}" ] && [ -x /usr/bin/sub-sync-manual-import ]; then
  /usr/bin/sub-sync-manual-import "$SUBSYNC_MANUAL_LINK" "${SUBSYNC_MANUAL_NAME:-Manual server}" || true
fi

rm -rf /tmp/luci-modulecache/* /tmp/luci-indexcache* /tmp/luci-sessions/* 2>/dev/null || true
/etc/init.d/rpcd restart || true
/etc/init.d/uhttpd restart || true

echo "[Sub Sync] Manual link import support v167 ready"
# SUBSYNC_MANUAL_LINK_IMPORT_INSTALL_V167_END

# SUBSYNC_PUBLIC_INSTALL_V193_BEGIN
SUBSYNC_GH_REPO="${SUBSYNC_REPO:-kzolotarev95/luci-app-sub-sync666}"
SUBSYNC_GH_BRANCH="${SUBSYNC_BRANCH:-main}"
SUBSYNC_RAW_BASE="https://raw.githubusercontent.com/${SUBSYNC_GH_REPO}/${SUBSYNC_GH_BRANCH}"

subsync_v193_install_file() {
  src="$1"
  dst="$2"
  mkdir -p "$(dirname "$dst")"
  wget -qO "$dst" "${SUBSYNC_RAW_BASE}/${src}?v=$(date +%s)" || return 0
  chmod 755 "$dst" 2>/dev/null || true
}

subsync_v193_install_file "htdocs/luci-static/resources/view/sub_sync/sub_sync.js" "/www/luci-static/resources/view/sub_sync/sub_sync.js"
subsync_v193_install_file "usr/share/rpcd/acl.d/luci-app-sub-sync.json" "/usr/share/rpcd/acl.d/luci-app-sub-sync.json"

for f in \
  sub-sync \
  sub-sync.real \
  sub-sync-autoadd \
  sub-sync-urltest \
  sub-sync-manual-import \
  sub-sync-happ-json-hy2-import \
  sub-sync-hy2-manager \
  sub-sync-section \
  sub-sync-subs-info \
  sub-sync-system-info \
  sub-sync-singbox-log \
  podcop-sub-v666-xhttp-patch
do
  subsync_v193_install_file "usr/bin/$f" "/usr/bin/$f"
done

[ -x /usr/bin/podcop-sub-v666-xhttp-patch ] && /usr/bin/podcop-sub-v666-xhttp-patch install >/dev/null 2>&1 || true

rm -rf /tmp/luci-modulecache/* /tmp/luci-indexcache* /tmp/luci-sessions/* 2>/dev/null || true
/etc/init.d/rpcd restart >/dev/null 2>&1 || true
/etc/init.d/uhttpd restart >/dev/null 2>&1 || true
# SUBSYNC_PUBLIC_INSTALL_V193_END
