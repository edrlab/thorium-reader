#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
PROJECT_DIR="$(cd -- "$SCRIPT_DIR/.." && pwd -P)"
RESOURCES_DIR="$PROJECT_DIR/resources"
ICNS_CANVAS_SIZE=1024
ICNS_ARTWORK_SIZE=824

usage() {
    cat <<'EOF'
Usage:
  scripts/update-icons.sh [--resources-dir <dir>] <source-icon>

Regenerates every application icon under resources/ from one large source image.
The source should be square and transparent if needed. A 2048x2048 PNG is
recommended. ImageMagick is configured to downscale only, never upscale.
The macOS ICNS is generated from a 1024x1024 transparent canvas with the icon
artwork constrained to 824x824, following Apple's recommended icon grid.

Requires:
  - ImageMagick available as "magick", or as "convert" + "identify"
  - png2icns + icns2png for ICNS generation and verification
    (Debian package: icnsutils)

Examples:
  scripts/update-icons.sh ./brand/icon-2048.png
  npm run icons:update -- ./brand/icon-2048.png
EOF
}

fail() {
    echo "error: $*" >&2
    exit 1
}

info() {
    echo "==> $*"
}

warn() {
    echo "warning: $*" >&2
}

file_size() {
    wc -c < "$1" | tr -d '[:space:]'
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        -h|--help)
            usage
            exit 0
            ;;
        --resources-dir)
            [[ $# -ge 2 ]] || fail "--resources-dir requires a value"
            RESOURCES_DIR="$2"
            shift 2
            ;;
        --*)
            fail "unknown option: $1"
            ;;
        *)
            [[ -z "${SOURCE_PATH:-}" ]] || fail "only one source icon can be provided"
            SOURCE_PATH="$1"
            shift
            ;;
    esac
done

[[ -n "${SOURCE_PATH:-}" ]] || {
    usage
    exit 1
}

if command -v magick >/dev/null 2>&1; then
    IM_CONVERT=(magick)
    IM_IDENTIFY=(magick identify)
elif command -v convert >/dev/null 2>&1 && command -v identify >/dev/null 2>&1; then
    IM_CONVERT=(convert)
    IM_IDENTIFY=(identify)
else
    fail "ImageMagick is required: command 'magick' or commands 'convert' + 'identify' were not found"
fi
command -v icns2png >/dev/null 2>&1 || fail "icns2png is required for ICNS verification; install Debian package 'icnsutils'"
command -v png2icns >/dev/null 2>&1 || fail "png2icns is required for ICNS generation; install Debian package 'icnsutils'"

[[ -f "$SOURCE_PATH" ]] || fail "source icon not found: $SOURCE_PATH"
SOURCE_DIR="$(cd -- "$(dirname -- "$SOURCE_PATH")" && pwd -P)"
SOURCE_PATH="$SOURCE_DIR/$(basename -- "$SOURCE_PATH")"

mkdir -p "$RESOURCES_DIR"
RESOURCES_DIR="$(cd -- "$RESOURCES_DIR" && pwd -P)"

SOURCE_DIMENSIONS="$("${IM_IDENTIFY[@]}" -format "%w %h\n" "$SOURCE_PATH")"
read -r SOURCE_WIDTH SOURCE_HEIGHT <<<"$SOURCE_DIMENSIONS"

[[ "$SOURCE_WIDTH" =~ ^[0-9]+$ && "$SOURCE_HEIGHT" =~ ^[0-9]+$ ]] || fail "could not read source dimensions"
(( SOURCE_WIDTH == SOURCE_HEIGHT )) || fail "source icon must be square, got ${SOURCE_WIDTH}x${SOURCE_HEIGHT}"
(( SOURCE_WIDTH % 2 == 0 )) || fail "source icon size must be even, got ${SOURCE_WIDTH}x${SOURCE_HEIGHT}"

if (( SOURCE_WIDTH < 1080 )); then
    warn "source icon is smaller than 1080x1080; larger targets will keep the source centered without upscaling"
fi

is_power_of_two() {
    local value="$1"
    (( value > 0 && (value & (value - 1)) == 0 ))
}

if ! is_power_of_two "$SOURCE_WIDTH"; then
    warn "source icon is not a power-of-two size (${SOURCE_WIDTH}x${SOURCE_HEIGHT}); continuing"
fi

info "Source: $SOURCE_PATH (${SOURCE_WIDTH}x${SOURCE_HEIGHT})"
info "Resources: $RESOURCES_DIR"

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

NORMALIZED_SOURCE="$TMP_DIR/source.png"
"${IM_CONVERT[@]}" "$SOURCE_PATH" -alpha on -background none -strip "$NORMALIZED_SOURCE"

ICNS_SOURCE="$TMP_DIR/icns-source.png"
"${IM_CONVERT[@]}" "$NORMALIZED_SOURCE" \
    -alpha on \
    -background none \
    -resize "${ICNS_ARTWORK_SIZE}x${ICNS_ARTWORK_SIZE}>" \
    -gravity center \
    -extent "${ICNS_CANVAS_SIZE}x${ICNS_CANVAS_SIZE}" \
    -strip \
    "PNG32:$ICNS_SOURCE"

render_png() {
    local width="$1"
    local height="$2"
    local output="$3"

    mkdir -p "$(dirname -- "$output")"
    "${IM_CONVERT[@]}" "$NORMALIZED_SOURCE" \
        -alpha on \
        -background none \
        -resize "${width}x${height}>" \
        -gravity center \
        -extent "${width}x${height}" \
        -strip \
        "$output"

    case "$output" in
        "$RESOURCES_DIR"/*)
            echo "  $(realpath --relative-to="$RESOURCES_DIR" "$output") (${width}x${height}, $(file_size "$output") bytes)"
            ;;
    esac
}

render_square_png() {
    local size="$1"
    local output="$2"
    render_png "$size" "$size" "$output"
}

render_square_png32() {
    local size="$1"
    local output="$2"

    mkdir -p "$(dirname -- "$output")"
    "${IM_CONVERT[@]}" "$ICNS_SOURCE" \
        -alpha on \
        -background none \
        -resize "${size}x${size}>" \
        -gravity center \
        -extent "${size}x${size}" \
        -strip \
        "PNG32:$output"
}

PNG_TARGETS=(
    "1024|1024|icon.png"
    "512|512|appx/BadgeLogo.png"
    "512|512|appx/SplashScreen.png"
    "150|150|appx/Square150x150Logo.png"
    "44|44|appx/Square44x44Logo.png"
    "512|512|appx/StoreLogo.png"
    "310|150|appx/Wide310x150Logo.png"
    "1024|1024|icons/1024x1024.png"
    "256|256|icons/256x256.png"
    "512|512|icons/512x512.png"
    "1024|1024|ms-store/1024x1024.png"
    "1080|1080|ms-store/1080x1080.png"
    "150|150|ms-store/150x150.png"
    "300|300|ms-store/300x300.png"
    "71|71|ms-store/71x71.png"
)

info "Generating PNG icons in $RESOURCES_DIR"
for target in "${PNG_TARGETS[@]}"; do
    IFS="|" read -r width height relative_path <<<"$target"
    render_png "$width" "$height" "$RESOURCES_DIR/$relative_path"
done

info "Generating icon.ico"
ICO_DIR="$TMP_DIR/ico"
mkdir -p "$ICO_DIR"
ICO_INPUTS=()
for size in 256 128 64 48 32 16; do
    icon_png="$ICO_DIR/${size}x${size}.png"
    render_square_png "$size" "$icon_png"
    ICO_INPUTS+=("$icon_png")
done
"${IM_CONVERT[@]}" "${ICO_INPUTS[@]}" "$RESOURCES_DIR/icon.ico"
echo "  icon.ico ($(file_size "$RESOURCES_DIR/icon.ico") bytes)"

info "Generating icon.icns (${ICNS_ARTWORK_SIZE}x${ICNS_ARTWORK_SIZE} artwork on ${ICNS_CANVAS_SIZE}x${ICNS_CANVAS_SIZE} canvas)"
ICNS_DIR="$TMP_DIR/icns"
mkdir -p "$ICNS_DIR"

ICNS_ENTRIES=(
    "icon_16x16.png|16"
    "icon_32x32.png|32"
    "icon_48x48.png|48"
    "icon_128x128.png|128"
    "icon_256x256.png|256"
    "icon_512x512.png|512"
    "icon_1024x1024.png|1024"
)

ICNS_INPUTS=()
for entry in "${ICNS_ENTRIES[@]}"; do
    IFS="|" read -r iconset_name size <<<"$entry"
    icon_png="$ICNS_DIR/$iconset_name"
    render_square_png32 "$size" "$icon_png"

    bytes="$(file_size "$icon_png")"
    echo "  $iconset_name (${size}x${size}, ${bytes} bytes)"
    ICNS_INPUTS+=("$icon_png")
done

png2icns "$RESOURCES_DIR/icon.icns" "${ICNS_INPUTS[@]}"
echo "  icon.icns ($(file_size "$RESOURCES_DIR/icon.icns") bytes)"

verify_png() {
    local width="$1"
    local height="$2"
    local relative_path="$3"
    local file="$RESOURCES_DIR/$relative_path"
    local actual_dimensions
    local actual_width
    local actual_height

    [[ -s "$file" ]] || fail "verification failed: missing or empty $relative_path"

    actual_dimensions="$("${IM_IDENTIFY[@]}" -format "%w %h\n" "$file")"
    read -r actual_width actual_height <<<"$actual_dimensions"

    if (( actual_width != width || actual_height != height )); then
        fail "verification failed: $relative_path is ${actual_width}x${actual_height}, expected ${width}x${height}"
    fi

    echo "  ok $relative_path (${actual_width}x${actual_height}, $(file_size "$file") bytes)"
}

info "Verifying PNG outputs"
for target in "${PNG_TARGETS[@]}"; do
    IFS="|" read -r width height relative_path <<<"$target"
    verify_png "$width" "$height" "$relative_path"
done

info "Verifying icon.ico"
[[ -s "$RESOURCES_DIR/icon.ico" ]] || fail "verification failed: missing or empty icon.ico"
ICO_SIZES="$("${IM_IDENTIFY[@]}" -format "%wx%h\n" "$RESOURCES_DIR/icon.ico")"
for size in 256 128 64 48 32 16; do
    echo "$ICO_SIZES" | grep -q "^${size}x${size}$" || fail "verification failed: icon.ico does not contain a ${size}x${size} image"
done
echo "$ICO_SIZES" | sed 's/^/  frame /'

info "Verifying icon.icns with icns2png"
[[ -s "$RESOURCES_DIR/icon.icns" ]] || fail "verification failed: missing or empty icon.icns"
ICNS_VERIFY_DIR="$TMP_DIR/icns-verify"
mkdir -p "$ICNS_VERIFY_DIR"
(
    cd "$ICNS_VERIFY_DIR"
    icns2png -x "$RESOURCES_DIR/icon.icns" > "$ICNS_VERIFY_DIR/icns2png.log" 2>&1
)
[[ ! -s "$ICNS_VERIFY_DIR/icns2png.log" ]] || sed 's/^/  icns2png: /' "$ICNS_VERIFY_DIR/icns2png.log" >&2

ICNS_EXTRACTED_COUNT="$(find "$ICNS_VERIFY_DIR" -maxdepth 1 -type f -name "*.png" | wc -l | tr -d '[:space:]')"
(( ICNS_EXTRACTED_COUNT >= 7 )) || fail "verification failed: icns2png extracted only $ICNS_EXTRACTED_COUNT PNG files"
ICNS_EXTRACTED_SIZES="$("${IM_IDENTIFY[@]}" -format "%wx%h\n" "$ICNS_VERIFY_DIR"/*.png | sort -u)"
for size in 16 32 48 128 256 512 1024; do
    echo "$ICNS_EXTRACTED_SIZES" | grep -q "^${size}x${size}$" || fail "verification failed: icon.icns does not contain a ${size}x${size} image"
done
find "$ICNS_VERIFY_DIR" -maxdepth 1 -type f -name "*.png" -print0 \
    | sort -z \
    | xargs -0 "${IM_IDENTIFY[@]}" -format "  icns2png extracted %f %wx%h\n"

info "Done"
