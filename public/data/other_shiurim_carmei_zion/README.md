# Additional Podcast Series Directory

This directory contains JSON files that define additional podcast series under the **Carmei Zion** brand.

## How It Works

1. **Each JSON file = One podcast series**  
   Every `.json` file (except files starting with `_`) becomes a separate podcast feed.

2. **Podcast-only**  
   These series only appear in the podcast feeds, NOT on the website.

3. **Feed location**  
   Each series generates a feed at:  
   `https://www.midrashaggadah.com/podcast/carmei-zion/series/<series-id>.xml`

## JSON File Structure

```json
{
  "series_metadata": {
    "id": "unique-series-id",           // Used in feed URL and GUIDs
    "title": "Series Title | כותרת",    // Podcast title
    "description": "Description...",     // At least 50 chars for validators
    "language": "he",                    // "he" for Hebrew, "en" for English
    "author": "Speaker Name",            // Shows as podcast author
    "email": "contact@example.com",      // Required for iTunes
    "cover_image": "https://...",        // 1400x1400 - 3000x3000 recommended
    "category": "Religion & Spirituality",
    "subcategory": "Judaism"
  },
  "season_order": [
    "Topic 1",    // Season 1
    "Topic 2"     // Season 2, etc.
  ],
  "episodes": [
    {
      "id": "episode-unique-id",
      "hebrew_title": "כותרת עברית",
      "english_title": "English Title",
      "hebrew_sefer": "Topic 1",         // Maps to season
      "shiur_num": 1,                    // Episode number within season
      "length": "45:30",                 // Duration (HH:MM:SS or MM:SS)
      "english_year": 2024,              // Year for pub date
      "audio_url": "https://...",        // Direct audio URL (or use S3)
      "source_sheet_link": "https://..." // Optional
    }
  ]
}
```

## Audio URLs

Episodes can specify `audio_url` directly, or if omitted, the system derives:
```
https://midrash-aggadah.s3.eu-north-1.amazonaws.com/<episode-id>.mp3
```

## Adding a New Series

1. Copy `_template.json` to a new file, e.g., `halachah-series.json`
2. Fill in the `series_metadata` with your series info
3. Add episodes to the `episodes` array
4. Run `npm run podcast:generate` to generate the podcast feed
5. Deploy the site

## Regenerating Feeds

```bash
npm run podcast:generate
```

This will regenerate all podcast feeds including additional series.

