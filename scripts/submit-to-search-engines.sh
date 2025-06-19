#!/bin/bash

# SEO Submission Automation Script
# Run this script to submit your updated sitemap to search engines

echo "🚀 Starting SEO submission process for Midrash Aggadah..."
echo "⭐ PRIORITY: Darosh Darash Moshe - Featured Sefer!"

BASE_URL="https://midrashaggadah.com"
SITEMAP_URL="${BASE_URL}/sitemap.xml"
NEW_PAGE_URL="${BASE_URL}/sefer/darosh-darash-moshe"

echo "📍 Website: $BASE_URL"
echo "🗺️  Sitemap: $SITEMAP_URL"
echo "⭐ FEATURED PAGE: $NEW_PAGE_URL (Priority 0.95 - Highest content priority!)"
echo ""

# Function to check if URL is accessible
check_url() {
    local url=$1
    local name=$2
    echo "🔍 Checking $name..."
    
    if curl -s --head "$url" | head -n 1 | grep -q "200 OK"; then
        echo "✅ $name is accessible"
        return 0
    else
        echo "❌ $name is not accessible"
        return 1
    fi
}

# Check if sitemap and new page are accessible
echo "🔧 Pre-flight checks:"
check_url "$SITEMAP_URL" "Sitemap"
check_url "$NEW_PAGE_URL" "New Page"
echo ""

# Submit to Google
echo "🔍 Submitting to Google..."
GOOGLE_PING="https://www.google.com/ping?sitemap=${SITEMAP_URL}"
echo "📤 Ping URL: $GOOGLE_PING"
if curl -s "$GOOGLE_PING" > /dev/null; then
    echo "✅ Successfully submitted to Google"
else
    echo "❌ Failed to submit to Google"
fi
echo ""

# Submit to Bing
echo "🔍 Submitting to Bing..."
BING_PING="https://www.bing.com/ping?sitemap=${SITEMAP_URL}"
echo "📤 Ping URL: $BING_PING"
if curl -s "$BING_PING" > /dev/null; then
    echo "✅ Successfully submitted to Bing"
else
    echo "❌ Failed to submit to Bing"
fi
echo ""

# Open useful URLs in browser (macOS)
echo "🌐 Opening SEO tools in browser..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    echo "🍎 Detected macOS - opening tools..."
    
    # Google Search Console
    open "https://search.google.com/search-console"
    
    # Rich Results Test
    open "https://search.google.com/test/rich-results?url=${NEW_PAGE_URL}"
    
    # Mobile-Friendly Test
    open "https://search.google.com/test/mobile-friendly?url=${NEW_PAGE_URL}"
    
    # PageSpeed Insights
    open "https://pagespeed.web.dev/?url=${NEW_PAGE_URL}"
    
    echo "✅ Opened SEO tools in browser"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    echo "🐧 Detected Linux - use these URLs:"
    echo "   Google Search Console: https://search.google.com/search-console"
    echo "   Rich Results Test: https://search.google.com/test/rich-results?url=${NEW_PAGE_URL}"
    echo "   Mobile-Friendly Test: https://search.google.com/test/mobile-friendly?url=${NEW_PAGE_URL}"
    echo "   PageSpeed Insights: https://pagespeed.web.dev/?url=${NEW_PAGE_URL}"
else
    echo "🖥️  Use these URLs to test your SEO:"
    echo "   Google Search Console: https://search.google.com/search-console"
    echo "   Rich Results Test: https://search.google.com/test/rich-results?url=${NEW_PAGE_URL}"
    echo "   Mobile-Friendly Test: https://search.google.com/test/mobile-friendly?url=${NEW_PAGE_URL}"
    echo "   PageSpeed Insights: https://pagespeed.web.dev/?url=${NEW_PAGE_URL}"
fi

echo ""
echo "📋 Manual Steps Still Required:"
echo "1. 🔍 Google Search Console:"
echo "   - Submit sitemap: $SITEMAP_URL"
echo "   - Request indexing for: $NEW_PAGE_URL"
echo ""
echo "2. 🔍 Bing Webmaster Tools:"
echo "   - Visit: https://www.bing.com/webmasters"
echo "   - Submit sitemap and request indexing"
echo ""
echo "3. 📱 Social Media Testing:"
echo "   - Facebook: https://developers.facebook.com/tools/debug/"
echo "   - Twitter: https://cards-dev.twitter.com/validator"
echo "   - LinkedIn: https://www.linkedin.com/post-inspector/"
echo ""
echo "✨ SEO submission process completed!"
echo "⏰ Expected indexing timeline: 3-7 days"
echo "📊 Monitor progress in Google Search Console" 