# luci-app-sub-syncv2

Sub Sync integration for Podkop LuCI on OpenWrt.

Sub Sync встраивается прямо в существующую страницу Podkop:

Services → Podkop

Отдельная страница Services → Sub Sync не создаётся.

## Установка

```sh
wget -O- "https://raw.githubusercontent.com/kzolotarev95/luci-app-sub-syncv2/main/install.sh?v=$(date +%s)" | sh
