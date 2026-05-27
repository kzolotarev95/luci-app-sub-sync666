#!/bin/sh

echo ""
echo "========================================="
echo "  Podkop Sub Sync — Удаление"
echo "========================================="
echo ""

echo "→ Создание бэкапа перед удалением..."
BACKUP="/root/luci-app-sub-sync-before-uninstall-$(date +%Y%m%d-%H%M%S).tar.gz"
tar -czf "$BACKUP" -C / \
  usr/share/luci/menu.d/luci-app-podkop.json \
  usr/share/luci/menu.d/luci-app-podkop.json.bak.subsync \
  usr/share/luci/menu.d/luci-app-sub-sync.json \
  usr/share/rpcd/acl.d/luci-app-sub-sync.json \
  www/luci-static/resources/view/podkop \
  www/luci-static/resources/view/sub_sync \
  usr/bin/sub-sync \
  etc/sub-sync \
  2>/dev/null || true
echo "  ✓ Бэкап: $BACKUP"

echo "→ Удаление cron-задачи..."
sed -i '/\/usr\/bin\/sub-sync/d' /etc/crontabs/root 2>/dev/null || true
/etc/init.d/cron restart 2>/dev/null || true

echo "→ Восстановление чистого меню Podkop..."
cat > /usr/share/luci/menu.d/luci-app-podkop.json <<'MENUEOF'
{
    "admin/services/podkop": {
        "title": "Podkop",
        "order": 42,
        "action": {
            "type": "view",
            "path": "podkop/main"
        },
        "depends": {
            "acl": [ "luci-app-podkop" ],
            "uci": { "podkop": true }
        }
    }
}
MENUEOF
chmod 644 /usr/share/luci/menu.d/luci-app-podkop.json

echo "→ Удаление menu/ACL Sub Sync..."
rm -f /usr/share/luci/menu.d/luci-app-sub-sync.json
rm -f /usr/share/rpcd/acl.d/luci-app-sub-sync.json

echo "→ Удаление файлов Sub Sync..."
rm -f /usr/bin/sub-sync
rm -rf /www/luci-static/resources/view/sub_sync
rm -f /www/luci-static/resources/view/podkop/sub_sync.js
rm -f /www/luci-static/resources/view/podkop/*subsync*.js
rm -f /www/luci-static/resources/view/podkop/*sub_sync*.js

echo "→ Удаление Podkop JS-файлов со старыми ссылками на Sub Sync..."
STALE="$(grep -Rsl 'sub_sync_v184\|view.sub_sync\|sub_sync/sub_sync\|podkop_subsync\|main_subsync' /www/luci-static/resources/view/podkop 2>/dev/null || true)"
if [ -n "$STALE" ]; then
  echo "$STALE" | while read f; do
    [ -n "$f" ] || continue
    echo "  remove: $f"
    rm -f "$f"
  done
else
  echo "  ✓ Старые Podkop JS-ссылки не найдены"
fi

echo "→ Удаление runtime-файлов..."
rm -f /tmp/sub-sync-status
rm -f /tmp/sub-sync-response
rm -f /tmp/sub-sync-decoded
rm -rf /etc/sub-sync

echo "→ Очистка LuCI кэша и сессий..."
rm -rf /tmp/luci-modulecache/* /tmp/luci-indexcache* 2>/dev/null || true
rm -rf /tmp/luci-sessions/* 2>/dev/null || true
touch /usr/lib/opkg/status 2>/dev/null || touch /lib/apk/db/installed 2>/dev/null || true

echo "→ Перезапуск сервисов..."
/etc/init.d/rpcd restart 2>/dev/null || true
/etc/init.d/uhttpd restart 2>/dev/null || true

echo "→ Финальная проверка старых ссылок Sub Sync..."
LEFT="$(grep -Rsl 'sub_sync_v184\|view.sub_sync\|sub_sync/sub_sync\|podkop_subsync\|main_subsync' \
  /usr/share/luci/menu.d \
  /www/luci-static/resources/view/podkop \
  2>/dev/null || true)"

if [ -n "$LEFT" ]; then
  echo "  ⚠ Остались ссылки:"
  echo "$LEFT"
else
  echo "  ✓ Старые ссылки Sub Sync не найдены"
fi

echo ""
echo "========================================="
echo "  Podkop Sub Sync удалён"
echo "========================================="
echo ""
echo "  Бэкап перед удалением:"
echo "  $BACKUP"
echo ""
echo "  Откат:"
echo "  tar -xzf $BACKUP -C /"
echo ""
echo "  Обновите страницу в браузере: Ctrl+F5"
echo ""
