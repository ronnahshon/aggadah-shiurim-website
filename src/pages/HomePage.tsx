import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Book, Search, X, Filter, Clock } from 'lucide-react';
import { Shiur, SearchFilters } from '@/types/shiurim';
import { formatTitle, searchShiurim, getUniqueCategories, getUniqueSubCategories, getUniqueSefarim, countShiurimInFilter } from '@/utils/dataUtils';
import { generateWebsiteStructuredData, generateMetaDescription, generateKeywords } from '@/utils/seoUtils';
import SEOHead from '@/components/seo/SEOHead';
import shiurimData from '@/data/shiurim_data.json';

// Helper functions for Hebrew and English dates
const getHebrewMonths = () => [
  'תשרי', 'חשון', 'כסלו', 'טבת', 'שבט', 'אדר', 'ניסן', 'אייר', 'סיון', 'תמוז', 'אב', 'אלול'
];

const getEnglishMonths = () => [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Convert number to Hebrew letters
const numberToHebrew = (num: number): string => {
  const hebrewNumerals = [
    '', 'א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ז׳', 'ח׳', 'ט׳', 'י׳',
    'יא׳', 'יב׳', 'יג׳', 'יד׳', 'טו׳', 'טז׳', 'יז׳', 'יח׳', 'יט׳', 'כ׳',
    'כא׳', 'כב׳', 'כג׳', 'כד׳', 'כה׳', 'כו׳', 'כז׳', 'כח׳', 'כט׳', 'ל׳', 'לא׳'
  ];
  
  return hebrewNumerals[num] || `${num}׳`;
};

const getCurrentHebrewDate = (): string => {
  const now = new Date();
  // More accurate Hebrew calendar conversion
  // Hebrew year starts in Tishrei (September/October)
  const gregorianYear = now.getFullYear();
  const month = now.getMonth(); // 0-11
  
  // Approximate Hebrew year calculation
  let hebrewYear;
  if (month >= 8) { // September or later
    hebrewYear = gregorianYear + 3761;
  } else {
    hebrewYear = gregorianYear + 3760;
  }
  
  // Hebrew months start from Tishrei (around September)
  // Map Gregorian months to Hebrew months (approximate)
  const hebrewMonthMap = [
    'טבת',    // January -> Tevet
    'שבט',    // February -> Shevat  
    'אדר',    // March -> Adar
    'ניסן',   // April -> Nissan
    'אייר',   // May -> Iyar
    'סיון',   // June -> Sivan
    'תמוז',   // July -> Tammuz
    'אב',     // August -> Av
    'אלול',   // September -> Elul
    'תשרי',   // October -> Tishrei
    'חשון',   // November -> Cheshvan
    'כסלו'    // December -> Kislev
  ];
  
  const hebrewMonth = hebrewMonthMap[month];
  const day = now.getDate();
  const hebrewDay = numberToHebrew(day);
  
  return `${hebrewDay} ${hebrewMonth} ${hebrewYear}`;
};

const getCurrentEnglishDate = (): string => {
  const now = new Date();
  const month = getEnglishMonths()[now.getMonth()];
  const day = now.getDate();
  const year = now.getFullYear();
  return `${month} ${day}, ${year}`;
};

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [featuredShiurim, setFeaturedShiurim] = useState<Shiur[]>([]);
  const [shiurim, setShiurim] = useState<Shiur[]>([]);
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({
    categories: [],
    subCategories: [],
    sefarim: []
  });
  const [showFilters, setShowFilters] = useState(true);

  // Get unique filter options
  const categories = getUniqueCategories(shiurim);
  const subCategories = getUniqueSubCategories(
    shiurim, 
    filters.categories.length > 0 ? filters.categories : []
  );
  const sefarim = getUniqueSefarim(
    shiurim, 
    filters.categories.length > 0 ? filters.categories : [],
    filters.subCategories.length > 0 ? filters.subCategories : []
  );

  useEffect(() => {
    // Load shiurim data
    const allShiurim = shiurimData as unknown as Shiur[];
    setShiurim(allShiurim);

    // Filter Ein Yaakov shiurim and randomly select 3
    const einYaakovShiurim = allShiurim.filter(shiur => shiur.category === 'ein_yaakov');
    
    // Randomly select 3 shiurim
    const shuffled = einYaakovShiurim.sort(() => 0.5 - Math.random());
    setFeaturedShiurim(shuffled.slice(0, 3));
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Redirect to search page with query and filters
    const searchParams = new URLSearchParams();
    if (query) searchParams.set('q', query);
    if (filters.categories.length > 0) searchParams.set('categories', filters.categories.join(','));
    if (filters.subCategories.length > 0) searchParams.set('subCategories', filters.subCategories.join(','));
    if (filters.sefarim.length > 0) searchParams.set('sefarim', filters.sefarim.join(','));
    
    navigate(`/search?${searchParams.toString()}`);
  };

  const handleFilterChange = (type: keyof SearchFilters, value: string) => {
    setFilters(prev => {
      const current = [...prev[type]];
      const index = current.indexOf(value);
      
      if (index >= 0) {
        // Remove from filter
        current.splice(index, 1);
      } else {
        // Add to filter
        current.push(value);
      }
      
      return {
        ...prev,
        [type]: current
      };
    });
  };

  const handleReset = () => {
    setQuery('');
    setFilters({
      categories: [],
      subCategories: [],
      sefarim: []
    });
  };

  const toggleFilters = () => {
    setShowFilters(prev => !prev);
  };

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://midrashaggadah.com';
  const structuredData = generateWebsiteStructuredData(baseUrl);

  return (
    <div className="min-h-screen">
      <SEOHead
        title="Midrash Aggadah"
        description={generateMetaDescription('home')}
        keywords={generateKeywords('home')}
        structuredData={structuredData}
        ogType="website"
      />
      
      {/* Header with dates */}
      <div className="bg-parchment-light py-3">
        <div className="content-container">
          <div className="flex justify-end text-sm text-biblical-brown">
            <div className="flex gap-4">
              <span className="font-hebrew" style={{ fontFamily: '"Times New Roman", serif', fontWeight: 'normal' }}>{getCurrentHebrewDate()}</span>
              <span>|</span>
              <span>{getCurrentEnglishDate()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main header at very top */}
      <section className="py-12 bg-parchment-texture bg-cover bg-center">
        <div className="content-container">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-biblical-burgundy animate-fade-in">
              Welcome to Midrash Aggadah
            </h1>
            <p className="text-lg md:text-xl max-w-4xl mx-auto mb-6 text-biblical-brown animate-fade-in">
              A website dedicated to spreading the timeless wisdom and profound teachings of חז״ל.
            </p>
            <p className="text-lg max-w-3xl mx-auto mb-12 text-biblical-brown animate-fade-in">
              Listen to hundreds of free audio shiurim on Ein Yaakov (Talmud), Tanach and other Midrashim.
            </p>
          </div>

          {/* Search section */}
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSearch} className="flex items-center gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-biblical-brown/60" size={20} />
                <input
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder={`Search through ${shiurim.length} shiurim ...`}
                  className="w-full pl-10 pr-4 py-3 border border-parchment-dark rounded-md bg-white/90 placeholder-biblical-brown/60 focus:outline-none focus:ring-2 focus:ring-biblical-burgundy"
                />
              </div>
              
              <button 
                type="button" 
                onClick={toggleFilters}
                className="p-3 bg-biblical-navy text-white rounded-md hover:bg-biblical-navy/90"
                aria-label="Toggle filters"
              >
                <Filter size={20} />
              </button>
              
              <button 
                type="button" 
                onClick={handleReset}
                className="p-3 bg-parchment-dark text-biblical-brown rounded-md hover:bg-parchment-dark/80"
                aria-label="Reset search"
              >
                <X size={20} />
              </button>

              <button 
                type="submit"
                className="px-6 py-3 bg-biblical-burgundy text-white rounded-md hover:bg-biblical-burgundy/90 font-medium"
              >
                Search
              </button>
            </form>

            {/* Filters */}
            {showFilters && (
              <div className="bg-white/90 rounded-md shadow-md p-4 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Categories filter */}
                  <div>
                    <h3 className="text-sm font-medium mb-2 text-biblical-navy">Categories</h3>
                    <div className="space-y-1 max-h-48 overflow-y-auto pr-2">
                      {categories.map(category => (
                        <label key={category} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={filters.categories.includes(category)}
                            onChange={() => handleFilterChange('categories', category)}
                            className="mr-2 rounded text-biblical-burgundy focus:ring-biblical-burgundy"
                          />
                          <span className="flex-1">{category}</span>
                          <span className="text-xs text-biblical-brown/60">
                            ({countShiurimInFilter(shiurim, 'category', category)})
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  {/* Sub-categories filter */}
                  <div>
                    <h3 className="text-sm font-medium mb-2 text-biblical-navy">Sub-Categories</h3>
                    <div className="space-y-1 max-h-48 overflow-y-auto pr-2">
                      {subCategories.map(subCategory => (
                        <label key={subCategory} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={filters.subCategories.includes(subCategory)}
                            onChange={() => handleFilterChange('subCategories', subCategory)}
                            className="mr-2 rounded text-biblical-burgundy focus:ring-biblical-burgundy"
                          />
                          <span className="flex-1">{subCategory}</span>
                          <span className="text-xs text-biblical-brown/60">
                            ({countShiurimInFilter(shiurim, 'sub_category', subCategory)})
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  {/* Sefarim filter */}
                  <div>
                    <h3 className="text-sm font-medium mb-2 text-biblical-navy">Sefarim</h3>
                    <div className="space-y-1 max-h-48 overflow-y-auto pr-2">
                      {sefarim.map(sefer => (
                        <label key={sefer} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={filters.sefarim.includes(sefer)}
                            onChange={() => handleFilterChange('sefarim', sefer)}
                            className="mr-2 rounded text-biblical-burgundy focus:ring-biblical-burgundy"
                          />
                          <span className="flex-1">{sefer}</span>
                          <span className="text-xs text-biblical-brown/60">
                            ({countShiurimInFilter(shiurim, 'english_sefer', sefer)})
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Sample shiurim section */}
      <section className="py-16 bg-white">
        <div className="content-container">
          <h2 className="text-2xl md:text-3xl font-semibold mb-12 text-center text-biblical-burgundy">
            Browse Sample Shiurim
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {featuredShiurim.map(shiur => (
              <div key={shiur.id} className="group bg-white/90 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-biblical-gold/20 hover:border-biblical-gold/40">
                <div className="flex flex-col h-full">
                  {/* Main content area */}
                  <div className="flex-grow mb-4">
                    <Link 
                      to={`/shiur/${shiur.id}`} 
                      className="block text-biblical-burgundy hover:text-biblical-burgundy/80 transition-colors duration-200"
                    >
                      <h3 className="text-xl font-semibold leading-tight mb-3 group-hover:text-biblical-burgundy/90">
                        {shiur.english_title}
                      </h3>
                    </Link>
                    
                    {shiur.hebrew_title && (
                      <p className="text-biblical-burgundy/80 font-hebrew mb-3 text-lg leading-relaxed">
                        {shiur.hebrew_title}
                      </p>
                    )}
                    
                    {/* Category breadcrumb */}
                    <div className="mb-3 p-2 bg-parchment/30 rounded-lg">
                      <p className="text-sm text-biblical-brown font-medium">
                        {formatTitle(shiur.category)} → {formatTitle(shiur.sub_category)} → {formatTitle(shiur.english_sefer)}
                      </p>
                    </div>
                    
                    {/* Metadata */}
                    <div className="flex items-center justify-between text-xs text-biblical-brown/70 mb-4">
                      <span className="bg-biblical-navy/10 px-2 py-1 rounded-full">
                        {shiur.english_year} ({shiur.hebrew_year})
                      </span>
                      <div className="flex items-center">
                        <Clock size={12} className="mr-1" />
                        <span>{(shiur as any).length || '--:--'}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action button */}
                  <div className="mt-auto">
                    <Link 
                      to={`/shiur/${shiur.id}`} 
                      className="inline-flex items-center justify-center w-full px-4 py-3 bg-biblical-navy text-white rounded-lg hover:bg-biblical-navy/90 transition-colors duration-200 font-medium text-sm group-hover:shadow-md"
                    >
                      Listen to Shiur
                      <span className="ml-2 transition-transform duration-200 group-hover:translate-x-1">→</span>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center">
            <Link 
              to="/catalog" 
              className="inline-flex items-center px-8 py-4 bg-biblical-gold/80 hover:bg-biblical-gold text-biblical-brown font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <Book className="mr-2" size={20} />
              View All Shiurim
            </Link>
          </div>
        </div>
      </section>

      {/* Sefarim section */}
      <section className="py-12 bg-parchment-light">
        <div className="content-container">
          <div className="text-center">
            <p className="text-lg max-w-3xl mx-auto text-biblical-brown">
              Explore Sefarim which develop original חידושים on various teachings. In Hebrew and English.
            </p>
          </div>
        </div>
      </section>

      {/* Large image at bottom */}
      <section className="py-12 bg-white">
        <div className="content-container">
          <div className="max-w-4xl mx-auto">
            <img 
              src="/images/moshe_aharon_hur_img.png" 
              alt="Moshe, Aharon, and Hur"
              className="w-full h-auto rounded-lg shadow-lg"
            />
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
