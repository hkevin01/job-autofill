#!/bin/bash

# Quick rebuild script for development
# Usage: ./dev.sh [--watch]

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

print_info() {
    echo -e "${BLUE}[DEV]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EXTENSION_DIR="$SCRIPT_DIR/extension"

cd "$EXTENSION_DIR"

if [[ "$1" == "--watch" ]]; then
    print_info "Starting development build with watch mode..."
    print_info "Press Ctrl+C to stop watching"
    npm run dev
else
    print_info "Building extension for development..."
    npm run build
    print_success "Extension built! Check extension/dist/"
    print_info "💡 Tip: Use './dev.sh --watch' for auto-rebuild on changes"
    print_info "🔄 Reload extension in Chrome: chrome://extensions/ → Reload button"
fi
