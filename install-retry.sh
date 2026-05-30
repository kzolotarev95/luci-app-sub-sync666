#!/bin/sh
# SUBSYNC_RETRY_INSTALL_V276
set -u

OUT="/tmp/subsync-install-v276.sh"
BASE="https://raw.githubusercontent.com/kzolotarev95/luci-app-sub-sync666/main"

echo "========================================="
echo " Podcop Sub v666 retry installer v276"
echo "========================================="

ok=0
i=1
while [ "$i" -le 30 ]; do
  echo "--- install download try $i from $BASE ---"
  rm -f "$OUT"

  if wget -O "$OUT" "$BASE/install.sh?v=$(date +%s)-$i"; then
    if grep -q 'SUBSYNC_PUBLIC_BUILD_V276' "$OUT" &&
       grep -q 'SUBSYNC_INSTALL_VERSION_FILES_V276_BEGIN' "$OUT" &&
       sh -n "$OUT"; then
      echo "OK: install.sh v276 downloaded and verified"
      ok=1
      break
    fi
    echo "WARN: downloaded install.sh is not verified v276"
  else
    echo "WARN: install.sh download failed"
  fi

  i=$((i + 1))
  sleep 5
done

if [ "$ok" != "1" ]; then
  echo "ERROR: cannot download verified Podcop Sub v666 installer v276 now"
  echo "Try again later or check router internet/GitHub access."
  exit 1
fi

sh "$OUT"
