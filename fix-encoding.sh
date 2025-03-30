#!/bin/bash

echo "🔍 Sprawdzam i konwertuję pliki .ts / .tsx na UTF-8 jeśli potrzeba..."

find . -type f \( -iname "*.ts" -o -iname "*.tsx" \) | while read file; do
  charset=$(file -i "$file" | cut -d'=' -f2)
  if [ "$charset" != "utf-8" ]; then
    echo "🔄 Konwertuję $file z $charset → UTF-8"
    iconv -f "$charset" -t UTF-8 "$file" -o "$file.utf8" && mv "$file.utf8" "$file"
  else
    echo "✅ Pomijam $file (już UTF-8)"
  fi
done

echo "✅ Gotowe!"

