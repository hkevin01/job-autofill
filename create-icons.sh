#!/bin/bash

# Icon generator for Job AutoFill extension
# Creates icons in multiple sizes from SVG

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ICON_DIR="$SCRIPT_DIR/extension/src/assets/icons"

# Colors for the Job AutoFill icon
PRIMARY_COLOR="#4CAF50"    # Green for job/growth
SECONDARY_COLOR="#2196F3"  # Blue for tech/AI
ACCENT_COLOR="#FFC107"     # Amber for highlighting

# Create base SVG icon
create_base_svg() {
    cat > "${ICON_DIR}/icon.svg" << 'EOF'
<svg width="128" height="128" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
  <!-- Background circle -->
  <circle cx="64" cy="64" r="60" fill="#4CAF50" stroke="#2E7D32" stroke-width="2"/>

  <!-- Document/form representation -->
  <rect x="32" y="24" width="64" height="80" rx="4" fill="white" stroke="#E0E0E0" stroke-width="1"/>

  <!-- Form lines (representing form fields) -->
  <line x1="40" y1="36" x2="88" y2="36" stroke="#4CAF50" stroke-width="2" stroke-linecap="round"/>
  <line x1="40" y1="48" x2="88" y2="48" stroke="#4CAF50" stroke-width="2" stroke-linecap="round"/>
  <line x1="40" y1="60" x2="72" y2="60" stroke="#4CAF50" stroke-width="2" stroke-linecap="round"/>
  <line x1="40" y1="72" x2="88" y2="72" stroke="#4CAF50" stroke-width="2" stroke-linecap="round"/>
  <line x1="40" y1="84" x2="80" y2="84" stroke="#4CAF50" stroke-width="2" stroke-linecap="round"/>

  <!-- AI/Auto symbol (stylized "A" with automation arrows) -->
  <g transform="translate(72, 58)">
    <!-- Letter A for "Auto" -->
    <path d="M 0 16 L 8 0 L 16 16 M 4 10 L 12 10" stroke="#2196F3" stroke-width="2" fill="none" stroke-linecap="round"/>

    <!-- Automation arrows around the A -->
    <path d="M -4 8 Q -8 4 -4 0" stroke="#FFC107" stroke-width="1.5" fill="none" marker-end="url(#arrowhead)"/>
    <path d="M 20 0 Q 24 4 20 8" stroke="#FFC107" stroke-width="1.5" fill="none" marker-end="url(#arrowhead)"/>
  </g>

  <!-- Arrow marker definition -->
  <defs>
    <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto">
      <polygon points="0 0, 6 2, 0 4" fill="#FFC107"/>
    </marker>
  </defs>

  <!-- Small success checkmark -->
  <g transform="translate(80, 88)">
    <circle cx="8" cy="8" r="8" fill="#4CAF50"/>
    <path d="M 4 8 L 7 11 L 12 5" stroke="white" stroke-width="2" fill="none" stroke-linecap="round"/>
  </g>
</svg>
EOF
}

# Check if ImageMagick is available
if command -v convert &> /dev/null; then
    echo "🎨 Creating Job AutoFill extension icons..."

    # Create the base SVG
    create_base_svg
    echo "✅ Created base SVG icon"

    # Generate PNG icons in different sizes
    convert "${ICON_DIR}/icon.svg" -resize 16x16 "${ICON_DIR}/icon16.png"
    convert "${ICON_DIR}/icon.svg" -resize 32x32 "${ICON_DIR}/icon32.png"
    convert "${ICON_DIR}/icon.svg" -resize 48x48 "${ICON_DIR}/icon48.png"
    convert "${ICON_DIR}/icon.svg" -resize 128x128 "${ICON_DIR}/icon128.png"

    echo "✅ Generated PNG icons: 16x16, 32x32, 48x48, 128x128"

elif command -v inkscape &> /dev/null; then
    echo "🎨 Creating Job AutoFill extension icons with Inkscape..."

    # Create the base SVG
    create_base_svg
    echo "✅ Created base SVG icon"

    # Generate PNG icons using Inkscape
    inkscape "${ICON_DIR}/icon.svg" --export-filename="${ICON_DIR}/icon16.png" --export-width=16 --export-height=16
    inkscape "${ICON_DIR}/icon.svg" --export-filename="${ICON_DIR}/icon32.png" --export-width=32 --export-height=32
    inkscape "${ICON_DIR}/icon.svg" --export-filename="${ICON_DIR}/icon48.png" --export-width=48 --export-height=48
    inkscape "${ICON_DIR}/icon.svg" --export-filename="${ICON_DIR}/icon128.png" --export-width=128 --export-height=128

    echo "✅ Generated PNG icons: 16x16, 32x32, 48x48, 128x128"

else
    echo "⚠️  Neither ImageMagick nor Inkscape found. Creating SVG only..."
    create_base_svg
    echo "ℹ️  To generate PNG icons, install ImageMagick: sudo apt install imagemagick"
    echo "ℹ️  Or install Inkscape: sudo apt install inkscape"
fi

echo "📁 Icons created in: ${ICON_DIR}"
ls -la "${ICON_DIR}"
