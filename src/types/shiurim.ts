
export interface Shiur {
  id: string;
  global_id: string;
  shiur_num: string;
  category: string;
  sub_category: string;
  english_sefer: string;
  hebrew_sefer: string;
  english_title: string;
  hebrew_title: string;
  source_sheet_link: string;
  audio_recording_link: string;
  hebrew_year: string;
  english_year: string;
  tags: string[];
}

export interface Category {
  name: string;
  subCategories: SubCategory[];
}

export interface SubCategory {
  name: string;
  sefarim: Sefer[];
}

export interface Sefer {
  name: string;
  hebrewName: string;
  shiurim: Shiur[];
}

export interface SearchFilters {
  categories: string[];
  subCategories: string[];
  sefarim: string[];
}
