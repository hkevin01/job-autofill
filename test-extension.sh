#!/bin/bash

# Quick test script for Job AutoFill extension
# Opens test pages and provides testing guidance

echo "🧪 Job AutoFill Extension Test Suite"
echo "=================================="

# Check if Chrome is running with our extension
CHROME_PID=$(pgrep -f "chrome.*load-extension")
if [ -n "$CHROME_PID" ]; then
    echo "✅ Chrome is running with extension (PID: $CHROME_PID)"
else
    echo "❌ Chrome with extension not detected. Run ./run.sh first."
    exit 1
fi

echo ""
echo "🎯 Testing Instructions:"
echo "1. Chrome should already be open with the extension"
echo "2. Navigate to one of these job sites:"
echo "   - https://jobs.lever.co/"
echo "   - https://greenhouse.io/"
echo "   - https://linkedin.com/jobs/"
echo "   - https://indeed.com/"
echo ""
echo "3. Open Developer Tools (F12)"
echo "4. Check Console for extension logs:"
echo "   - 'Job AutoFill Enhanced Form Detector loaded'"
echo "   - '🔍 Scanning for job application forms...'"
echo ""
echo "5. Click the extension icon in toolbar"
echo "6. Test these console commands:"
echo "   window.__JOB_AUTOFILL_FORM_DETECTOR__"
echo "   window.__JOB_AUTOFILL_DETECTED__"
echo ""

# Option to open test pages automatically
read -p "🚀 Open test job pages automatically? (y/N): " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🌐 Opening test pages..."

    # Find the Chrome profile directory used by our extension
    TEMP_PROFILE=$(ps aux | grep "chrome.*user-data-dir" | grep -o "user-data-dir=[^ ]*" | head -1 | cut -d= -f2)

    if [ -n "$TEMP_PROFILE" ]; then
        # Open test pages in the same Chrome instance
        google-chrome --user-data-dir="$TEMP_PROFILE" --new-tab "https://jobs.lever.co/" 2>/dev/null &
        sleep 2
        google-chrome --user-data-dir="$TEMP_PROFILE" --new-tab "https://greenhouse.io/" 2>/dev/null &
        sleep 2
        google-chrome --user-data-dir="$TEMP_PROFILE" --new-tab "https://linkedin.com/jobs/" 2>/dev/null &

        echo "✅ Opened test pages in existing Chrome session"
    else
        echo "❌ Could not find Chrome profile. Open pages manually."
    fi
fi

echo ""
echo "🔍 Extension Debug Commands:"
echo "Copy these into the browser console on any job page:"
echo ""
echo "// Check form detector status"
echo "console.log('Form Detector:', window.__JOB_AUTOFILL_FORM_DETECTOR__);"
echo ""
echo "// Check detected forms"
echo "console.log('Detected Forms:', window.__JOB_AUTOFILL_DETECTED__);"
echo ""
echo "// Manually scan for forms"
echo "if (window.__JOB_AUTOFILL_FORM_DETECTOR__) {"
echo "    window.__JOB_AUTOFILL_FORM_DETECTOR__.rescan();"
echo "    console.log('Manual scan triggered');"
echo "}"
echo ""
echo "// Enable field highlighting"
echo "if (window.__JOB_AUTOFILL_FORM_DETECTOR__) {"
echo "    window.__JOB_AUTOFILL_FORM_DETECTOR__.setOptions({highlightFields: true});"
echo "    console.log('Field highlighting enabled');"
echo "}"
echo ""

echo "📋 Expected Results:"
echo "- Extension icon appears in toolbar"
echo "- Console shows form detection logs"
echo "- Popup opens when clicking extension icon"
echo "- Debug objects available in console"
echo "- Form fields detected on job application pages"
echo ""

echo "🎉 Happy testing! The extension should automatically detect job application forms."
echo "📝 Report any issues or unexpected behavior."
