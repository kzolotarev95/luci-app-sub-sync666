#!/bin/sh
# SUBSYNC_RETRY_INSTALL_V275
set -u

OUT="/tmp/subsync-install-v275.sh"
BASE1="https://raw.githubusercontent.com/kzolotarev95/luci-app-sub-sync666/d230755"
BASE2="https://raw.githubusercontent.com/kzolotarev95/luci-app-sub-sync666/main"

echo "========================================="
echo " Podcop Sub v666 retry installer v275"
echo "========================================="

ok=0
for BASE in "$BASE1" "$BASE2"; do
  i=1
  while [ "$i" -le 20 ]; do
    echo "--- install download try $i from $BASE ---"
    rm -f "$OUT"

    if wget -O "$OUT" "$BASE/install.sh?v=$(date +%s)-$i"; then
      if grep -q 'SUBSYNC_PUBLIC_BUILD_V275' "$OUT" &&
         grep -q 'SUBSYNC_ACL_LOCAL_FALLBACK_V274' "$OUT" &&
         sh -n "$OUT"; then
        echo "OK: install.sh downloaded and verified"
        ok=1
        break
      fi
      echo "WARN: downloaded install.sh is not verified v275"
    else
      echo "WARN: install.sh download failed"
    fi

    i=$((i + 1))
    sleep 5
  done

  [ "$ok" = "1" ] && break
done

if [ "$ok" != "1" ]; then
  echo "ERROR: cannot download verified Podcop Sub v666 installer now"
  echo "Try again later or check router internet/GitHub access."
  exit 1
fi

sh "$OUT"
