#!/bin/sh
# Production build. Usage: sh build.sh [--test]
#   --test  run the quick test suite first; a failure stops the build
# Output: build/ (upload this folder) and parachute-squad-<version>.zip (same contents).
set -eu
cd "$(dirname "$0")"

OUT=build
ASSETS=$OUT/assets
ESBUILD=node_modules/.bin/esbuild
VERSION=$(sed -n 's/.*"version": *"\([^"]*\)".*/\1/p' package.json | head -n 1)
ZIP=parachute-squad-$VERSION.zip

hash8() { { sha256sum "$1" 2>/dev/null || shasum -a 256 "$1"; } | cut -c1-8; }
gzsize() { gzip -9c "$1" | wc -c | tr -d ' '; }

# 1. Dependencies
[ -x "$ESBUILD" ] || npm install

# 2. Tests (optional)
if [ "${1:-}" = "--test" ]; then
  npm test -- quick
fi

# 3. Clean
rm -rf "$OUT" "$ZIP"
mkdir -p "$ASSETS"

# 4. JS: join in the order index.html loads them (they share one global scope), then minify.
# No wrapper and no module format, so top-level names stay global exactly as in dev.
SCRIPTS=$(sed -n 's#.*<script src="\(js/[^"]*\)".*#\1#p' index.html)
[ -n "$SCRIPTS" ] || { echo "build: no scripts found in index.html" >&2; exit 1; }
BUNDLE=$OUT/.bundle.js
: > "$BUNDLE"
for f in $SCRIPTS; do
  cat "$f" >> "$BUNDLE"
  printf '\n;\n' >> "$BUNDLE"
done
"$ESBUILD" "$BUNDLE" --minify --target=es2020 --charset=utf8 --legal-comments=none \
  --log-level=warning --outfile="$ASSETS/game.js"
rm "$BUNDLE"

# 5. CSS: minify
"$ESBUILD" style.css --minify --target=es2020 --charset=utf8 --legal-comments=none \
  --log-level=warning --outfile="$ASSETS/style.css"

# Fonts go beside the built CSS, whose url("fonts/...") paths are relative to it
cp -R fonts "$ASSETS/fonts"

# 6. Fingerprint, so a new build is never served from an old cache
JS_NAME=game.$(hash8 "$ASSETS/game.js").js
CSS_NAME=style.$(hash8 "$ASSETS/style.css").css
mv "$ASSETS/game.js" "$ASSETS/$JS_NAME"
mv "$ASSETS/style.css" "$ASSETS/$CSS_NAME"

# 7. HTML: point at the built files, strip comments and indentation.
# Line breaks stay, so spacing between inline elements renders the same.
sed -e '/<script src="js\//d' \
    -e "s#href=\"style.css\"#href=\"assets/$CSS_NAME\"#" \
    -e 's#href="fonts/#href="assets/fonts/#' \
    -e "s#</body>#<script src=\"assets/$JS_NAME\"></script></body>#" \
    -e '/^[[:space:]]*<!--.*-->[[:space:]]*$/d' \
    -e 's/^[[:space:]]*//' \
    -e '/^$/d' \
    index.html > "$OUT/index.html"

# 8. Cloudflare Pages cache rules: fingerprinted files can be cached forever
cat > "$OUT/_headers" <<'HEADERS'
/assets/*
  Cache-Control: public, max-age=31536000, immutable
HEADERS

# 9. Package
if command -v zip >/dev/null; then (cd "$OUT" && zip -qr "../$ZIP" .); fi

# 10. Report
echo "Parachute Squad $VERSION built"
for f in "$OUT/index.html" "$ASSETS/$JS_NAME" "$ASSETS/$CSS_NAME"; do
  printf '  %-34s %7s bytes  %7s gzipped\n' "$f" "$(wc -c < "$f" | tr -d ' ')" "$(gzsize "$f")"
done
if [ -f "$ZIP" ]; then echo "  $ZIP $(wc -c < "$ZIP" | tr -d ' ') bytes"; fi
