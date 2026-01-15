# Metadata Schema Documentation

## Overview

The app now supports two different metadata schemas based on the shiur type:

1. **Ein Yaakov** - Detailed schema with category and sefer information
2. **Other Shiurim** (Daf Yomi, Gemara Iyun, Meyuchadim, Other) - Simplified schema with speaker information

## Ein Yaakov Metadata Schema

When uploading Ein Yaakov shiurim, the following JSON metadata is generated:

```json
{
  "id": "string (required) - filename + timestamp (epoch seconds)",
  "hebrew_title": "string (required) - Hebrew title",
  "english_title": "string (required) - English title",
  "category": "string (required) - always 'ein_yaakov'",
  "sub_category": "string (optional) - subcategory",
  "hebrew_sefer": "string (optional) - Hebrew sefer name",
  "english_sefer": "string (optional) - English sefer name",
  "shiur_num": "number (optional) - shiur number within sefer",
  "global_id": "number (optional) - global unique ID for sorting",
  "source_sheet_link": "string (optional) - URL to source sheet",
  "length": "string (required) - duration in MM:SS or HH:MM:SS format",
  "audio_extension": "string (required) - file extension (e.g., 'm4a', 'mp3')"
}
```

### Required Fields for Ein Yaakov:
- Hebrew Title
- English Title

### Optional Fields for Ein Yaakov:
- Sub Category
- Hebrew Sefer
- English Sefer
- Shiur Number
- Global ID
- Source Sheet Link

## Other Shiurim Metadata Schema

For all other shiur types (Daf Yomi, Gemara Iyun, Meyuchadim, Other), the following JSON metadata is generated:

```json
{
  "id": "string (required) - full S3 key without extension",
  "hebrew_title": "string (required) - Hebrew title",
  "english_title": "string (required) - English title",
  "hebrew_sefer": "string (optional) - Hebrew sefer name",
  "shiur_num": "number (required) - epoch seconds timestamp",
  "speaker": "string (required) - speaker name",
  "length": "string (required) - duration in MM:SS or HH:MM:SS format",
  "audio_extension": "string (required) - file extension (e.g., 'm4a', 'mp3')"
}
```

### Required Fields for Other Shiurim:
- Hebrew Title
- English Title
- Speaker

### Optional Fields for Other Shiurim:
- Hebrew Sefer

### Auto-Generated Fields:
- `id` - Automatically generated from S3 folder path + filename (without extension)
- `shiur_num` - Automatically set to current epoch timestamp in seconds
- `length` - Automatically extracted from audio file duration (format: MM:SS or HH:MM:SS)
- `audio_extension` - Automatically extracted from the audio filename (e.g., "m4a", "mp3")

## Upload Process

When a user uploads a shiur:

1. User selects or records an audio file
2. User fills in the metadata form (fields shown depend on shiur type)
3. User clicks "Upload to S3"
4. App uploads the audio file to the appropriate S3 folder
5. App generates JSON metadata based on the shiur type
6. App uploads the manifest file with the same name as the audio file (but .manifest extension)

## S3 Folder Structure

- `audio/` - Ein Yaakov shiurim
- `carmei_zion_daf_yomi/` - Daf Yomi shiurim
- `carmei_zion_gemara_beiyyun/` - Gemara Iyun shiurim
- `carmei_zion_shiurim_meyuhadim/` - Meyuchadim shiurim
- Custom folders for "Other" type

## Example Uploads

### Ein Yaakov Example

Audio file: `audio/ein_yaakov_bereshit_001.m4a`
Metadata file: `audio/ein_yaakov_bereshit_001.manifest`

```json
{
  "id": "ein_yaakov_bereshit_001_1705234567",
  "hebrew_title": "בראשית - שיעור א",
  "english_title": "Bereishit - Lesson 1",
  "category": "ein_yaakov",
  "sub_category": "Torah",
  "hebrew_sefer": "בראשית",
  "english_sefer": "Bereishit",
  "shiur_num": 1,
  "global_id": 1001,
  "source_sheet_link": "https://example.com/source",
  "length": "45:32",
  "audio_extension": "m4a"
}
```

### Daf Yomi Example

Audio file: `carmei_zion_daf_yomi/berachos_2a.m4a`
Metadata file: `carmei_zion_daf_yomi/berachos_2a.manifest`

```json
{
  "id": "carmei_zion_daf_yomi/berachos_2a",
  "hebrew_title": "ברכות דף ב",
  "english_title": "Berachos 2a",
  "hebrew_sefer": "ברכות",
  "shiur_num": 1705234567,
  "speaker": "Rabbi Cohen",
  "length": "52:18",
  "audio_extension": "m4a"
}
```

## UI Changes

The metadata form now dynamically shows different fields based on the selected shiur type:

- **Ein Yaakov**: Shows all Ein Yaakov specific fields
- **Other Types**: Shows speaker field and simplified metadata

The form validates that required fields are filled before allowing upload.
