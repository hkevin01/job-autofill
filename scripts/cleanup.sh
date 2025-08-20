#!/bin/bash

# Job AutoFill - Project cleanup script
# This script removes the old webcam-test.html file from root after moving it to src/tools/

echo "🧹 Cleaning up old files after project restructuring..."

# Remove old webcam-test.html from root (moved to src/tools/)
if [ -f "webcam-test.html" ]; then
    echo "  ✅ Removing old webcam-test.html from root (moved to src/tools/)"
    rm webcam-test.html
else
    echo "  ℹ️  No old webcam-test.html found in root"
fi

# Clean up any empty directories that might have been created
echo "  🗂️  Cleaning up empty directories..."
find . -type d -empty -not -path "./.git/*" -not -path "./node_modules/*" -delete 2>/dev/null || true

echo "✨ Cleanup complete!"
