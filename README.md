<p align="center">
  <b>Podcop Sub v666</b><br>
  Подписки • Мониторинг • xHTTP • HY2 • URL Test • LuCI UI • ProtoByZKS95 Theme
</p>

<p align="center">
  <img alt="OpenWrt" src="https://img.shields.io/badge/OpenWrt-24.10.x-blue?style=for-the-badge">
  <img alt="LuCI" src="https://img.shields.io/badge/LuCI-supported-brightgreen?style=for-the-badge">
  <img alt="Podkop" src="https://img.shields.io/badge/Podkop-integrated-orange?style=for-the-badge">
  <img alt="Build" src="https://img.shields.io/badge/build-v275-purple?style=for-the-badge">
</p>

---


<img width="855" height="686" alt="chrome_kkTqBjO4jb" src="https://github.com/user-attachments/assets/d290fac8-9ad7-41c2-9a49-fde4dc1d9aeb" />


---

## ✅ Возможности

- 🔗 Добавление и обработка подписок
- 🧪 URL Test / проверка серверов
- 🚀 Поддержка xHTTP для Podkop
- ⚡ Поддержка HY2 / Hysteria2
- 🧩 Интеграция прямо в `Services → Podkop`
- 🎨 Автоустановка темы `ProtoByZKS95 / proton2025`
- 🛡 ACL fallback, чтобы LuCI-доступ не ломался
- 🔁 Retry installer/uninstaller для нестабильного GitHub-соединения
- 🧹 Полное удаление без мусора
- 🧼 Удаление темы, ACL, cron, helpers, `/etc/sub-sync`, LuCI cache
- 📊 Системные виджеты и статус-блоки
- 🧠 Guard для восстановления важных патчей
- 🚫 Без сохранения приватных подписок в GitHub

---

## 🚀 Быстрая установка

> Рекомендуемый способ установки — через retry-скрипт.  
> Он сначала скачивает файл, проверяет маркеры и синтаксис, и только потом запускает установку.

```sh
wget -O /tmp/install-podcop-sub-v666.sh "https://raw.githubusercontent.com/kzolotarev95/luci-app-sub-sync666/main/install-retry.sh?v=$(date +%s)" && sh /tmp/install-podcop-sub-v666.sh
```

После установки:

1. Выйдите из LuCI.
2. Зайдите обратно.
3. Сделайте `Ctrl + F5`.
4. Откройте:

```text
Services → Podkop
```

---

## 🧹 Полное удаление

> Удаление также лучше запускать через retry-скрипт.  
> Он скачивает проверенный uninstall и полностью чистит файлы модуля.

```sh
wget -O /tmp/uninstall-podcop-sub-v666.sh "https://raw.githubusercontent.com/kzolotarev95/luci-app-sub-sync666/main/uninstall-retry.sh?v=$(date +%s)" && sh /tmp/uninstall-podcop-sub-v666.sh
```

После удаления очищаются:

- LuCI JS-файлы модуля
- ACL
- menu files
- helpers
- guard
- cron
- `/etc/sub-sync`
- theme `proton2025`
- временные файлы
- public backups темы
- LuCI cache

---

<details>
<summary>📦 Что устанавливается</summary>

Основные файлы:

```text
/www/luci-static/resources/view/sub_sync/sub_sync.js
/www/luci-static/resources/view/sub_sync/sub_sync_v221.js
/usr/share/rpcd/acl.d/luci-app-sub-sync.json
/usr/bin/sub-sync
/usr/bin/sub-sync.real
/usr/bin/sub-sync-autoadd
/usr/bin/sub-sync-subs-info
/usr/bin/sub-sync-urltest
/usr/bin/podcop-sub-v666-xhttp-patch
/usr/bin/podcop-sub-v666-guard
/etc/init.d/podcop-sub-v666-guard
/etc/sub-sync/
```

Интеграция в LuCI:

```text
/usr/share/luci/menu.d/luci-app-podkop.json
```

Тема:

```text
/www/luci-static/proton2025
```

</details>

---

<details>
<summary>🔁 Почему используется retry installer</summary>

На некоторых роутерах GitHub Raw иногда может отвечать ошибками:

```text
Failed to send request: Operation not permitted
SSL error: SSL - The connection indicated an EOF
Connection timed out
HTTP error 404
```

Поэтому обычный способ:

```sh
wget -O- URL | sh
```

может оборваться на середине.

Retry installer делает безопаснее:

1. Скачивает файл в `/tmp`.
2. Проверяет маркер версии.
3. Проверяет синтаксис через `sh -n`.
4. Только потом запускает файл.
5. При ошибке повторяет попытку.

</details>

---

<details>
<summary>🧪 Проверка после установки</summary>

Выполните:

```sh
echo "--- module files ---"
ls -l /www/luci-static/resources/view/sub_sync/sub_sync.js
ls -l /www/luci-static/resources/view/sub_sync/sub_sync_v221.js

echo "--- ACL ---"
ls -l /usr/share/rpcd/acl.d/luci-app-sub-sync.json

echo "--- menu refs ---"
grep -RsnE 'sub_sync|Подписки|Мониторинг' /usr/share/luci/menu.d/*.json 2>/dev/null || true

echo "--- theme ---"
uci get luci.main.mediaurlbase 2>/dev/null || true
ls -ld /www/luci-static/proton2025 2>/dev/null || true

echo "--- guard ---"
grep -nE 'PODCOP_SUB_V666_PERSISTENT_GUARD|removed duplicate standalone|restoring Подписки' /usr/bin/podcop-sub-v666-guard 2>/dev/null || true

echo "--- hidden update button ---"
grep -Rsn 'SUBSYNC_HIDE_UPDATE_CHECK_BUTTON_V269B' /www/luci-static/resources/view/sub_sync/sub_sync*.js 2>/dev/null | head
```

Нормальный результат:

```text
sub_sync.js есть
sub_sync_v221.js есть
ACL есть
menu refs показывает luci-app-podkop.json
/luci-static/proton2025
PODCOP_SUB_V666_PERSISTENT_GUARD есть
SUBSYNC_HIDE_UPDATE_CHECK_BUTTON_V269B есть
```

</details>

---

<details>
<summary>📋 Логи для диагностики</summary>

```sh
logread | grep -Ei 'sub-sync|subsync|theme|protobyzks95|proton2025|podcop-sub-v666-guard|podkop|rpcd|uhttpd|luci|SyntaxError|TypeError|ReferenceError|Access denied|Доступ запрещ|fatal|configuration invalid|Unknown transport|403|Operation not permitted|Connection timed out|download failed|Segmentation fault|duplicate standalone|ACL missing|ACL fallback' | tail -n 300
```

Критичные ошибки:

```text
SyntaxError
TypeError
ReferenceError
Access denied
Доступ запрещ
fatal
configuration invalid
Unknown transport
ACL missing
```

Некритичные сетевые ошибки, если retry потом сработал:

```text
Failed to send request: Operation not permitted
Connection timed out
SSL EOF
```

</details>

---

<details>
<summary>🧼 Что делает uninstall</summary>

Uninstall v275 выполняет полную чистку:

```text
Удаляет модульные LuCI JS-файлы
Удаляет ACL
Удаляет menu-файлы модуля
Удаляет helper scripts
Удаляет guard
Удаляет cron guard
Удаляет /etc/sub-sync
Удаляет тему proton2025
Возвращает LuCI на bootstrap
Удаляет временные файлы
Удаляет public backups темы
Очищает LuCI cache
```

Проверка после удаления:

```sh
ls -ld /www/luci-static/resources/view/sub_sync 2>/dev/null || echo "OK: no sub_sync dir"
ls -l /usr/share/rpcd/acl.d/luci-app-sub-sync.json 2>/dev/null || echo "OK: no ACL"
ls -l /usr/share/luci/menu.d/luci-app-sub-sync.json 2>/dev/null || echo "OK: no duplicate menu"
ls -ld /etc/sub-sync 2>/dev/null || echo "OK: no /etc/sub-sync"
ls -ld /www/luci-static/proton2025 2>/dev/null || echo "OK: no proton2025 theme"
grep -n 'podcop-sub-v666-guard' /etc/crontabs/root 2>/dev/null || echo "OK: no guard cron"
```

</details>

---

<details>
<summary>🧩 xHTTP / Podkop patch</summary>

Модуль добавляет поддержку xHTTP в Podkop через helper:

```text
/usr/bin/podcop-sub-v666-xhttp-patch
```

Проверка:

```sh
grep -RsnE 'xhttp|sing_box_cm_set_xhttp_transport' \
  /usr/lib/podkop/sing_box_config_facade.sh \
  /usr/lib/podkop/sing_box_config_manager.sh 2>/dev/null || true
```

При удалении модуль пытается восстановить файлы Podkop обратно.

</details>

---

<details>
<summary>🎨 Тема ProtoByZKS95 / proton2025</summary>

При установке модуль ставит тему:

```text
ProtoByZKS95 / proton2025
```

Активная тема проверяется так:

```sh
uci get luci.main.mediaurlbase
```

Ожидаемый результат:

```text
/luci-static/proton2025
```

После uninstall тема удаляется, а LuCI возвращается на:

```text
/luci-static/bootstrap
```

</details>

---

<details>
<summary>🔐 Приватность</summary>

В публичном GitHub-репозитории нет приватных подписок, приватных серверов, ключей или пользовательских конфигов.

Публично хранятся только:

- код модуля
- LuCI UI
- helper scripts
- public donor state
- installer/uninstaller
- retry scripts

Личные подписки и серверы создаются локально на роутере пользователя.

</details>

---

<details>
<summary>🛠 Ручные команды для опытных пользователей</summary>

Установка напрямую, без retry:

```sh
wget -O- "https://raw.githubusercontent.com/kzolotarev95/luci-app-sub-sync666/main/install.sh?v=$(date +%s)" | sh
```

Удаление напрямую, без retry:

```sh
wget -O /tmp/subsync-uninstall.sh "https://raw.githubusercontent.com/kzolotarev95/luci-app-sub-sync666/main/uninstall.sh?v=$(date +%s)"
sh /tmp/subsync-uninstall.sh
```

Но для обычных пользователей рекомендуется использовать retry-команды.

</details>

---

## 🧭 После установки

Открыть в LuCI:

```text
Services → Podkop
```

Если страница не появилась:

```sh
rm -rf /tmp/luci-modulecache /tmp/luci-modulecache/* /tmp/luci-indexcache /tmp/luci-indexcache* /tmp/luci-sessions /tmp/luci-sessions/* 2>/dev/null || true
/etc/init.d/rpcd restart
/etc/init.d/uhttpd restart
```

Затем:

```text
Logout/Login LuCI + Ctrl + F5
```

---

## ⚠️ Важно

- Не ставьте несколько разных версий подряд без uninstall.
- После установки обязательно перелогиньтесь в LuCI.
- При временных ошибках GitHub используйте retry installer.
- Public install/uninstall не делает большие backup-архивы, чтобы не забивать flash-память роутера.

---

## ❤️ Поддержка проекта

Если модуль оказался полезен — Подержать Донатом  Сбербанк :  4817760258323256



