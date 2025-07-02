#!/bin/bash

# SEO Submission Automation Script
# Run this script to submit your updated sitemap to search engines

echo "🚀 Starting SEO submission process for Midrash Aggadah..."
echo "⭐ PRIORITY: Darosh Darash Moshe - Featured Sefer!"
echo "📖 NEW: Ein Yaakov Commentary - Recent Addition!"
echo "🟣 YAHOO: Now optimized for Yahoo Search Engine!"

BASE_URL="https://midrashaggadah.com"
SITEMAP_URL="${BASE_URL}/sitemap.xml"
DAROSH_DARASH_URL="${BASE_URL}/sefer/darosh-darash-moshe"
EIN_YAAKOV_URL="${BASE_URL}/sefer/ein-yaakov-commentary"

echo "📍 Website: $BASE_URL"
echo "🗺️  Sitemap: $SITEMAP_URL"
echo "⭐ FEATURED PAGE: $DAROSH_DARASH_URL (Priority 0.95 - Highest content priority!)"
echo "📖 NEW PAGE: $EIN_YAAKOV_URL (Priority 0.8 - Important sefer page!)"
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

# Check if sitemap and pages are accessible
echo "🔧 Pre-flight checks:"
check_url "$SITEMAP_URL" "Sitemap"
check_url "$DAROSH_DARASH_URL" "Darosh Darash Moshe Page"
check_url "$EIN_YAAKOV_URL" "Ein Yaakov Commentary Page"
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

# Submit to Yahoo (powered by Bing, but has separate interface)
echo "🟣 Submitting to Yahoo..."
echo "ℹ️  Note: Yahoo Search is powered by Bing since 2009"
echo "📤 Yahoo uses Bing's index, so Bing submission covers Yahoo"
echo "✅ Yahoo optimization included via Bing submission"
echo ""

# Open useful URLs in browser (macOS)
echo "🌐 Opening SEO tools in browser..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    echo "🍎 Detected macOS - opening tools..."
    
    # Google Search Console
    open "https://search.google.com/search-console"
    
    # Rich Results Test for both pages
    open "https://search.google.com/test/rich-results?url=${DAROSH_DARASH_URL}"
    open "https://search.google.com/test/rich-results?url=${EIN_YAAKOV_URL}"
    
    # Mobile-Friendly Test for both pages
    open "https://search.google.com/test/mobile-friendly?url=${DAROSH_DARASH_URL}"
    open "https://search.google.com/test/mobile-friendly?url=${EIN_YAAKOV_URL}"
    
    # PageSpeed Insights for both pages
    open "https://pagespeed.web.dev/?url=${DAROSH_DARASH_URL}"
    open "https://pagespeed.web.dev/?url=${EIN_YAAKOV_URL}"
    
    echo "✅ Opened SEO tools in browser"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    echo "🐧 Detected Linux - use these URLs:"
    echo "   Google Search Console: https://search.google.com/search-console"
    echo "   Rich Results Test (Darosh Darash): https://search.google.com/test/rich-results?url=${DAROSH_DARASH_URL}"
    echo "   Rich Results Test (Ein Yaakov): https://search.google.com/test/rich-results?url=${EIN_YAAKOV_URL}"
    echo "   Mobile-Friendly Test (Darosh Darash): https://search.google.com/test/mobile-friendly?url=${DAROSH_DARASH_URL}"
    echo "   Mobile-Friendly Test (Ein Yaakov): https://search.google.com/test/mobile-friendly?url=${EIN_YAAKOV_URL}"
    echo "   PageSpeed Insights (Darosh Darash): https://pagespeed.web.dev/?url=${DAROSH_DARASH_URL}"
    echo "   PageSpeed Insights (Ein Yaakov): https://pagespeed.web.dev/?url=${EIN_YAAKOV_URL}"
else
    echo "🖥️  Use these URLs to test your SEO:"
    echo "   Google Search Console: https://search.google.com/search-console"
    echo "   Rich Results Test (Darosh Darash): https://search.google.com/test/rich-results?url=${DAROSH_DARASH_URL}"
    echo "   Rich Results Test (Ein Yaakov): https://search.google.com/test/rich-results?url=${EIN_YAAKOV_URL}"
    echo "   Mobile-Friendly Test (Darosh Darash): https://search.google.com/test/mobile-friendly?url=${DAROSH_DARASH_URL}"
    echo "   Mobile-Friendly Test (Ein Yaakov): https://search.google.com/test/mobile-friendly?url=${EIN_YAAKOV_URL}"
    echo "   PageSpeed Insights (Darosh Darash): https://pagespeed.web.dev/?url=${DAROSH_DARASH_URL}"
    echo "   PageSpeed Insights (Ein Yaakov): https://pagespeed.web.dev/?url=${EIN_YAAKOV_URL}"
fi

echo ""
echo "📋 Manual Steps Still Required:"
echo "1. 🔍 Google Search Console:"
echo "   - Submit sitemap: $SITEMAP_URL"
echo "   - Request indexing for: $DAROSH_DARASH_URL"
echo "   - Request indexing for: $EIN_YAAKOV_URL"
echo ""
echo "2. 🔍 Bing Webmaster Tools:"
echo "   - Visit: https://www.bing.com/webmasters"
echo "   - Submit sitemap and request indexing"
echo "   - This covers Yahoo Search (powered by Bing)"
echo ""
echo "3. 🟣 Yahoo-Specific Optimization:"
echo "   - Yahoo Local: Submit business to local.yahoo.com"
echo "   - Yahoo Finance: Ensure business info is accurate if applicable"
echo "   - Yahoo News: Submit press releases if relevant"
echo ""
echo "3. 📱 Social Media Testing:"
echo "   - Facebook: https://developers.facebook.com/tools/debug/"
echo "   - Twitter: https://cards-dev.twitter.com/validator"
echo "   - LinkedIn: https://www.linkedin.com/post-inspector/"
echo ""
echo "✨ SEO submission process completed!"
echo "⏰ Expected indexing timeline: 3-7 days"
echo "📊 Monitor progress in:"
echo "   - Google Search Console for Google rankings"
echo "   - Bing Webmaster Tools for Bing and Yahoo rankings"
echo "   - Yahoo Local for local business visibility"
echo ""
echo "🎯 Triple Search Engine Coverage: Google + Bing + Yahoo ✅" 