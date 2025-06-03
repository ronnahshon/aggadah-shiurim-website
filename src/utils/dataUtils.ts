import { Category, Sefer, Shiur, SubCategory } from "@/types/shiurim";
import { getAudioUrl } from "@/utils/s3Utils";

// Cache for audio durations to avoid refetching
const audioDurationCache: Record<string, string> = {};

// Utility to get audio duration
export const getAudioDuration = async (shiurId: string): Promise<string> => {
  // If we have the duration in cache, return it
  if (audioDurationCache[shiurId]) {
    return audioDurationCache[shiurId];
  }

  // Create a new audio element to fetch the metadata
  const audio = new Audio();
  const audioUrl = getAudioUrl(`${shiurId}.mp3`);
  
  try {
    // Return a promise that resolves when the audio metadata is loaded
    const duration = await new Promise<string>((resolve, reject) => {
      audio.src = audioUrl;
      
      // Set up event listeners
      audio.addEventListener('loadedmetadata', () => {
        const minutes = Math.floor(audio.duration / 60);
        const seconds = Math.floor(audio.duration % 60);
        const formattedDuration = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        // Store in cache
        audioDurationCache[shiurId] = formattedDuration;
        resolve(formattedDuration);
      });
      
      audio.addEventListener('error', () => {
        reject(new Error('Failed to load audio metadata'));
      });
    });
    
    return duration;
  } catch (error) {
    console.error('Error fetching audio duration:', error);
    return '0:00'; // Default duration on error
  }
};

export const formatTitle = (text: string): string => {
  return text
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export const organizeShiurimByHierarchy = (shiurim: Shiur[]): Category[] => {
  const categoriesMap = new Map<string, Category>();

  shiurim.forEach(shiur => {
    const categoryName = shiur.category;
    const subCategoryName = shiur.sub_category;
    const seferName = shiur.english_sefer;
    const seferHebrewName = shiur.hebrew_sefer;

    // Create or get category
    if (!categoriesMap.has(categoryName)) {
      const formattedCategoryName = formatTitle(categoryName);
      const displayCategoryName = formattedCategoryName === 'Ein Yaakov' ? 'Ein Yaakov (Talmud)' : formattedCategoryName;
      
      categoriesMap.set(categoryName, {
        name: displayCategoryName,
        subCategories: []
      });
    }
    const category = categoriesMap.get(categoryName)!;
    
    // Find or create sub-category
    let subCategory = category.subCategories.find(sc => sc.name === formatTitle(subCategoryName));
    if (!subCategory) {
      subCategory = {
        name: formatTitle(subCategoryName),
        sefarim: []
      };
      category.subCategories.push(subCategory);
    }
    
    // Find or create sefer
    let sefer = subCategory.sefarim.find(s => s.name === formatTitle(seferName));
    if (!sefer) {
      sefer = {
        name: formatTitle(seferName),
        hebrewName: seferHebrewName,
        shiurim: []
      };
      subCategory.sefarim.push(sefer);
    }
    
    // Add shiur to sefer
    sefer.shiurim.push(shiur);
  });

  return Array.from(categoriesMap.values());
};

export const searchShiurim = (
  shiurim: Shiur[], 
  query: string,
  filters: {
    categories: string[];
    subCategories: string[];
    sefarim: string[];
  }
): Shiur[] => {
  const lowerCaseQuery = query.toLowerCase();
  
  return shiurim.filter(shiur => {
    // Map display categories back to data categories for filtering
    const categoryMatches = filters.categories.length === 0 || filters.categories.some(filterCategory => {
      const dataCategory = filterCategory === 'Ein Yaakov (Talmud)' ? 'Ein Yaakov' : filterCategory;
      return dataCategory === formatTitle(shiur.category);
    });
    
    // Apply filters first
    if (
      !categoryMatches ||
      (filters.subCategories.length > 0 && !filters.subCategories.includes(formatTitle(shiur.sub_category))) ||
      (filters.sefarim.length > 0 && !filters.sefarim.includes(formatTitle(shiur.english_sefer)))
    ) {
      return false;
    }
    
    // If no query, return all filtered results
    if (!query) return true;
    
    // Search in various fields
    return (
      shiur.english_title.toLowerCase().includes(lowerCaseQuery) ||
      shiur.hebrew_title.toLowerCase().includes(lowerCaseQuery) ||
      shiur.category.toLowerCase().includes(lowerCaseQuery) ||
      shiur.sub_category.toLowerCase().includes(lowerCaseQuery) ||
      shiur.english_sefer.toLowerCase().includes(lowerCaseQuery) ||
      shiur.hebrew_sefer.toLowerCase().includes(lowerCaseQuery) ||
      (shiur.tags && shiur.tags.some(tag => tag.toLowerCase().includes(lowerCaseQuery)))
    );
  });
};

export const getUniqueCategories = (shiurim: Shiur[]): string[] => {
  const categories = new Set<string>();
  shiurim.forEach(shiur => categories.add(formatTitle(shiur.category)));
  
  // Define the specific order for categories
  const categoryOrder = ['Ein Yaakov (Talmud)', 'Tanach', 'Midrash'];
  const uniqueCategories = Array.from(categories).map(category => {
    // Add "(Talmud)" to "Ein Yaakov"
    return category === 'Ein Yaakov' ? 'Ein Yaakov (Talmud)' : category;
  });
  
  // Sort according to the specified order, with any additional categories at the end
  return uniqueCategories.sort((a, b) => {
    const indexA = categoryOrder.indexOf(a);
    const indexB = categoryOrder.indexOf(b);
    
    // If both are in the order array, sort by their position
    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB;
    }
    // If only one is in the order array, it comes first
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    // If neither is in the order array, sort alphabetically
    return a.localeCompare(b);
  });
};

export const getUniqueSubCategories = (shiurim: Shiur[], selectedCategories: string[] = []): string[] => {
  const subCategories = new Set<string>();
  
  shiurim.forEach(shiur => {
    const formattedCategory = formatTitle(shiur.category);
    if (selectedCategories.length === 0 || selectedCategories.includes(formattedCategory)) {
      subCategories.add(formatTitle(shiur.sub_category));
    }
  });
  
  // Define the specific order for sub-categories
  const subCategoryOrder = ['Seder Nashim', 'Seder Nezikin', 'Seder Kodashim', 'Seder Toharot', 'Torah', 'Tanna Devei Eliyahu'];
  const uniqueSubCategories = Array.from(subCategories);
  
  // Sort according to the specified order, with any additional sub-categories at the end
  return uniqueSubCategories.sort((a, b) => {
    const indexA = subCategoryOrder.indexOf(a);
    const indexB = subCategoryOrder.indexOf(b);
    
    // If both are in the order array, sort by their position
    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB;
    }
    // If only one is in the order array, it comes first
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    // If neither is in the order array, sort alphabetically
    return a.localeCompare(b);
  });
};

export const getUniqueSefarim = (
  shiurim: Shiur[], 
  selectedCategories: string[] = [], 
  selectedSubCategories: string[] = []
): string[] => {
  const sefarim = new Set<string>();
  
  shiurim.forEach(shiur => {
    const formattedCategory = formatTitle(shiur.category);
    const formattedSubCategory = formatTitle(shiur.sub_category);
    
    if (
      (selectedCategories.length === 0 || selectedCategories.includes(formattedCategory)) &&
      (selectedSubCategories.length === 0 || selectedSubCategories.includes(formattedSubCategory))
    ) {
      sefarim.add(formatTitle(shiur.english_sefer));
    }
  });
  
  // Define the order based on first appearance in shiurim_data.json
  const seferOrder = [
    'Yevamot', 'Bava Kamma', 'Bava Metzia', 'Makkot', 'Shevuot', 'Avodah Zarah', 
    'Horayot', 'Zevahim', 'Menahot', 'Hullin', 'Bechorot', 'Arachin', 'Temurah', 
    'Keritot', 'Meilah', 'Niddah', 'Bereshit', 'Shemot', 'Vayikra', 'Bamidbar', 
    'Devarim', 'Tanna Devei Eliyahu Rabbah'
  ];
  
  const uniqueSefarim = Array.from(sefarim);
  
  // Sort according to the order they first appear in shiurim_data.json
  return uniqueSefarim.sort((a, b) => {
    const indexA = seferOrder.indexOf(a);
    const indexB = seferOrder.indexOf(b);
    
    // If both are in the order array, sort by their position
    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB;
    }
    // If only one is in the order array, it comes first
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    // If neither is in the order array, sort alphabetically
    return a.localeCompare(b);
  });
};

export const countShiurimInFilter = (
  shiurim: Shiur[],
  filterType: 'category' | 'sub_category' | 'english_sefer', 
  filterValue: string
): number => {
  // Map display categories back to data categories for counting
  if (filterType === 'category' && filterValue === 'Ein Yaakov (Talmud)') {
    return shiurim.filter(shiur => formatTitle(shiur.category) === 'Ein Yaakov').length;
  }
  
  return shiurim.filter(shiur => formatTitle(shiur[filterType]) === filterValue).length;
};
