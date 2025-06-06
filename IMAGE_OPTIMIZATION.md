# Image Optimization Guide

## Current Issues
- `moshe_aharon_hur_img.png` is 2MB which severely impacts LCP and Speed Index
- No modern image formats (WebP/AVIF) being used

## Recommended Solutions

### Option 1: Online Tools (Immediate)
1. Use [TinyPNG](https://tinypng.com) or [Squoosh](https://squoosh.app) to compress the image
2. Convert to WebP format for ~70% size reduction
3. Create multiple sizes: 400w, 800w, 1200w for responsive loading

### Option 2: Command Line (Recommended)
```bash
# Install Sharp via npm
npm install sharp-cli --save-dev

# Create optimized versions
npx sharp-cli -i public/images/moshe_aharon_hur_img.png -o public/images/moshe_aharon_hur_img-800.webp -f webp -w 800 -q 80
npx sharp-cli -i public/images/moshe_aharon_hur_img.png -o public/images/moshe_aharon_hur_img-400.webp -f webp -w 400 -q 80

# Create AVIF versions (even smaller)
npx sharp-cli -i public/images/moshe_aharon_hur_img.png -o public/images/moshe_aharon_hur_img-800.avif -f avif -w 800 -q 60
```

### Option 3: Replace with Optimized Picture Element
```html
<picture>
  <source srcset="/images/moshe_aharon_hur_img-800.avif" type="image/avif" width="800" height="600">
  <source srcset="/images/moshe_aharon_hur_img-800.webp" type="image/webp" width="800" height="600">
  <img src="/images/moshe_aharon_hur_img-400.webp" alt="משה אהרון וחור" width="400" height="300" loading="lazy">
</picture>
```

## Expected Performance Impact
- **Current**: 2MB PNG = ~4-6 seconds load time
- **Optimized**: 100-200KB WebP = ~0.5-1 second load time
- **LCP Improvement**: 3-4 seconds faster
- **Speed Index Improvement**: 2-3 seconds faster

## Priority
**CRITICAL** - This single optimization will likely improve your Performance score by 20-30 points. 