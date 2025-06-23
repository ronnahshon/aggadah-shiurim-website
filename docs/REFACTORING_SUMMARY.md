## Refactoring Summary

### Files Moved to docs/ folder:
- IMAGE_OPTIMIZATION.md
- prd.md
- prompt.txt

### Files Moved to scripts/ folder:
- calculate_total_time.py (updated path reference)

### Files Kept at Root (Required by tools):
- All configuration files (package.json, vite.config.ts, tailwind.config.ts, etc.)
- index.html (required by Vite)
- README.md (for GitHub)

### Path Updates Made:
- Updated calculate_total_time.py to use '../src/data/shiurim_data.json' instead of 'src/data/shiurim_data.json'

### Verification:
- ✅ Python script works correctly
- ✅ Build process works correctly
- ✅ All functionality preserved
