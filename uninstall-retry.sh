#!/bin/sh
# SUBSYNC_RETRY_UNINSTALL_V277
set -u

OUT="/tmp/subsync-uninstall-v277.sh"
BASE="https://raw.githubusercontent.com/kzolotarev95/luci-app-sub-sync666/main"

echo "========================================="
echo " Podcop Sub v666 retry uninstaller v277"
echo "========================================="

ok=0
i=1
while [ "$i" -le 30 ]; do
  echo "--- uninstall download try $i from $BASE ---"
  rm -f "$OUT"

  if wget -O "$OUT" "$BASE/uninstall.sh?v=$(date +%s)-$i"; then
    if grep -q 'SUBSYNC_FULL_PUBLIC_UNINSTALL_V275_BEGIN' "$OUT" &&
       sh -n "$OUT"; then
      echo "OK: uninstall.sh downloaded and verified"
      ok=1
      break
    fi
    echo "WARN: downloaded uninstall.sh is not verified"
  else
    echo "WARN: uninstall.sh download failed"
  fi

  i=$((i + 1))
  sleep 5
done

if [ "$ok" != "1" ]; then
  echo "ERROR: cannot download verified Podcop Sub v666 uninstaller now"
  echo "Try again later or check router internet/GitHub access."
  exit 1
fi

sh "$OUT"
