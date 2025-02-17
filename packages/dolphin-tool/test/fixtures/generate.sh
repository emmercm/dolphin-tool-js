#!/usr/bin/env bash
set -euo pipefail

temp_dir=$(mktemp -d)
iso_file=""
for arg in "$@"; do
  head -c "${arg}" /dev/urandom > "${temp_dir}/${arg}"
  if [[ "${iso_file}" == "" ]]; then
    iso_file="${arg}"
  else
    iso_file="${iso_file}-${arg}"
  fi
done
mkisofs -o "${iso_file}.iso" "${temp_dir}"
rm -rf "${temp_dir}"

"$(dirname "$0")/../../../dolphin-tool-darwin-arm64/dolphin-tool" convert -i "${iso_file}.iso" -o "${iso_file}.gcz" -f gcz -b 131072 -l 5
"$(dirname "$0")/../../../dolphin-tool-darwin-arm64/dolphin-tool" convert -i "${iso_file}.iso" -o "${iso_file}.rvz" -f rvz -c zstd -b 131072 -l 5
"$(dirname "$0")/../../../dolphin-tool-darwin-arm64/dolphin-tool" convert -i "${iso_file}.iso" -o "${iso_file}.wia" -f wia -c lzma -b 2097152 -l 5
