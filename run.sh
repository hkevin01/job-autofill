#!/bin/bash

# Job AutoFill Extension - Local Chrome Installation Script
# This script builds and installs the extension to local Chrome for development/testing

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"
EXTENSION_DIR="$PROJECT_ROOT/extension"
DIST_DIR="$EXTENSION_DIR/dist"

print_status "Job AutoFill Extension - Local Chrome Installation"
print_status "Project root: $PROJECT_ROOT"

# Check if we're in the right directory
if [ ! -f "$PROJECT_ROOT/package.json" ]; then
    print_error "package.json not found. Please run this script from the project root directory."
    exit 1
fi

if [ ! -d "$EXTENSION_DIR" ]; then
    print_error "Extension directory not found at $EXTENSION_DIR"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

print_status "Node.js version: $(node --version)"
print_status "npm version: $(npm --version)"

# Install dependencies if node_modules doesn't exist
if [ ! -d "$PROJECT_ROOT/node_modules" ] || [ ! -d "$EXTENSION_DIR/node_modules" ]; then
    print_status "Installing dependencies..."

    # Install root dependencies
    cd "$PROJECT_ROOT"
    npm install

    # Install extension dependencies
    cd "$EXTENSION_DIR"
    npm install

    print_success "Dependencies installed successfully"
else
    print_status "Dependencies already installed"
fi

# Clean previous build
print_status "Cleaning previous build..."
if [ -d "$DIST_DIR" ]; then
    rm -rf "$DIST_DIR"
    print_status "Removed previous dist directory"
fi

# Build the extension
print_status "Building extension..."
cd "$EXTENSION_DIR"

if npm run build; then
    print_success "Extension built successfully"
else
    print_error "Failed to build extension"
    exit 1
fi

# Verify build output
if [ ! -d "$DIST_DIR" ]; then
    print_error "Build failed - dist directory not created"
    exit 1
fi

if [ ! -f "$DIST_DIR/manifest.json" ]; then
    print_error "Build failed - manifest.json not found in dist"
    exit 1
fi

print_success "Build verification passed"

# Display build info
print_status "Build Information:"
echo "  - Extension directory: $EXTENSION_DIR"
echo "  - Build output: $DIST_DIR"
echo "  - Manifest version: $(cat "$DIST_DIR/manifest.json" | grep '"manifest_version"' | grep -o '[0-9]*')"
echo "  - Extension version: $(cat "$DIST_DIR/manifest.json" | grep '"version"' | cut -d'"' -f4)"

# Check if Chrome is available
CHROME_BINARY=""
if command -v google-chrome &> /dev/null; then
    CHROME_BINARY="google-chrome"
elif command -v google-chrome-stable &> /dev/null; then
    CHROME_BINARY="google-chrome-stable"
elif command -v chromium &> /dev/null; then
    CHROME_BINARY="chromium"
elif command -v chromium-browser &> /dev/null; then
    CHROME_BINARY="chromium-browser"
else
    print_warning "Chrome/Chromium not found in PATH"
fi

print_status "Chrome Installation Options:"
echo ""
echo "🔧 DEVELOPER MODE INSTALLATION:"
echo "   1. Open Chrome and go to chrome://extensions/"
echo "   2. Enable 'Developer mode' (toggle in top right)"
echo "   3. Click 'Load unpacked'"
echo "   4. Select this directory: $DIST_DIR"
echo ""

# Option to open Chrome automatically
if [ -n "$CHROME_BINARY" ]; then
    print_status "Found Chrome binary: $CHROME_BINARY"
    echo "🚀 AUTOMATIC INSTALLATION:"
    read -p "   Would you like to open Chrome with developer mode? (y/N): " -n 1 -r
    echo

    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Opening Chrome with extension..."

        # Create a temporary user data directory for testing
        TEMP_PROFILE="/tmp/chrome-extension-test-$(date +%s)"
        mkdir -p "$TEMP_PROFILE"

        print_status "Using temporary Chrome profile: $TEMP_PROFILE"
        print_warning "This will open Chrome with a clean profile for testing"

        # Launch Chrome with the extension
        "$CHROME_BINARY" \
            --user-data-dir="$TEMP_PROFILE" \
            --load-extension="$DIST_DIR" \
            --enable-extensions \
            --disable-web-security \
            --disable-features=VizDisplayCompositor \
            --new-window \
            "chrome://extensions/" &

        print_success "Chrome launched with extension loaded!"
        print_status "Extension should now appear in chrome://extensions/"

        # Wait a moment then open a test page
        sleep 3
        "$CHROME_BINARY" \
            --user-data-dir="$TEMP_PROFILE" \
            --new-tab \
            "https://jobs.lever.co/" &

        print_status "Opened test page: https://jobs.lever.co/"
    fi
fi

echo ""
print_status "🎯 TESTING THE EXTENSION:"
echo "   1. Navigate to any job application page"
echo "   2. Look for the extension icon in the toolbar"
echo "   3. Click the icon to open the popup"
echo "   4. Check browser console for debug output"
echo ""

print_status "📋 DEBUGGING TIPS:"
echo "   - Open Developer Tools (F12)"
echo "   - Check Console for extension logs"
echo "   - Use chrome://extensions/ to reload the extension"
echo "   - View Background Page for service worker logs"
echo ""

print_status "🔄 TO REBUILD AND RELOAD:"
echo "   1. Make your changes to the source code"
echo "   2. Run this script again: ./run.sh"
echo "   3. Or run manually: cd extension && npm run build"
echo "   4. Click 'Reload' on chrome://extensions/"
echo ""

# Display useful development URLs
print_status "📚 USEFUL DEVELOPMENT URLS:"
echo "   - Extension management: chrome://extensions/"
echo "   - Extension shortcuts: chrome://extensions/shortcuts"
echo "   - Chrome DevTools: F12 or Ctrl+Shift+I"
echo "   - Background page console: chrome://extensions/ → Details → Background page"
echo ""

print_success "🎉 Extension installation complete!"
print_status "Happy coding! 🚀"

# Show file structure for reference
print_status "📁 Built Extension Structure:"
if command -v tree &> /dev/null; then
    tree "$DIST_DIR" -L 2
else
    find "$DIST_DIR" -type f | head -20 | sort
fi
