import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Book, Search, X, Filter, Clock } from 'lucide-react';
import { Shiur, SearchFilters } from '@/types/shiurim';
import { formatTitle, searchShiurim, getUniqueCategories, getUniqueSubCategories, getUniqueSefarim, countShiurimInFilter } from '@/utils/dataUtils';
import { generateWebsiteStructuredData, generateMetaDescription, generateKeywords } from '@/utils/seoUtils';
import SEOHead from '@/components/seo/SEOHead';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [featuredShiurim, setFeaturedShiurim] = useState<Shiur[]>([]);
  const [shiurim, setShiurim] = useState<Shiur[]>([]);
  const [loading, setLoading] = useState(true);
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
    // Load shiurim data from public folder
    const loadShiurimData = async () => {
      try {
        const response = await fetch('/data/shiurim_data.json');
        if (!response.ok) {
          throw new Error('Failed to load shiurim data');
        }
        const data = await response.json();
        const allShiurim = data as Shiur[];
        setShiurim(allShiurim);

        // Filter Ein Yaakov shiurim and randomly select 3
        const einYaakovShiurim = allShiurim.filter(shiur => shiur.category === 'ein_yaakov');
        
        // Randomly select 3 shiurim
        const shuffled = einYaakovShiurim.sort(() => 0.5 - Math.random());
        setFeaturedShiurim(shuffled.slice(0, 3));
      } catch (error) {
        console.error('Error loading shiurim data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadShiurimData();
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

      {/* Main content section */}
      <section className="pt-12 pb-6 bg-parchment-texture bg-cover bg-center">
        <div className="content-container">
          <div className="text-center mb-12">
            <p className="text-lg md:text-xl max-w-4xl mx-auto mb-6 text-biblical-brown animate-fade-in">
              Welcome to Midrash Aggadah, a website dedicated to spreading the timeless wisdom and profound teachings of חז״ל.
            </p>
            <p className="text-lg max-w-3xl mx-auto mb-12 text-biblical-brown animate-fade-in">
              Search below to explore hundreds of free audio shiurim,<br />
              or read through <Link to="/sefarim" className="text-biblical-brown hover:text-black underline font-medium">original Sefarim</Link> all about midrash aggadah.
            </p>
          </div>

          {/* Search section */}
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSearch} className="flex items-center gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-biblical-brown/60" size={20} />
                <input
                  type="text"
                  id="homepage-search-input"
                  name="search"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder={`Search through ${shiurim.length} shiurim ...`}
                  className="w-full pl-10 pr-4 py-3 border border-parchment-dark rounded-md bg-white/90 placeholder-biblical-brown/60 focus:outline-none focus:ring-2 focus:ring-biblical-burgundy"
                />
              </div>
              
              <button 
                type="button" 
                onClick={toggleFilters}
                className="p-3 bg-gray-700 text-white rounded-md hover:bg-gray-700/90"
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
                    <h3 className="text-sm font-medium mb-2 text-black">Categories</h3>
                    <div className="space-y-1 max-h-48 overflow-y-auto pr-2">
                      {categories.map(category => (
                        <label key={category} className="flex items-center">
                          <input
                            type="checkbox"
                            id={`homepage-category-${category.replace(/\s+/g, '-').toLowerCase()}`}
                            name={`category-${category}`}
                            checked={filters.categories.includes(category)}
                            onChange={() => handleFilterChange('categories', category)}
                            className="mr-2 rounded text-biblical-brown focus:ring-biblical-burgundy"
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
                    <h3 className="text-sm font-medium mb-2 text-black">Sub-Categories</h3>
                    <div className="space-y-1 max-h-48 overflow-y-auto pr-2">
                      {subCategories.map(subCategory => (
                        <label key={subCategory} className="flex items-center">
                          <input
                            type="checkbox"
                            id={`homepage-subcategory-${subCategory.replace(/\s+/g, '-').toLowerCase()}`}
                            name={`subcategory-${subCategory}`}
                            checked={filters.subCategories.includes(subCategory)}
                            onChange={() => handleFilterChange('subCategories', subCategory)}
                            className="mr-2 rounded text-biblical-brown focus:ring-biblical-burgundy"
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
                    <h3 className="text-sm font-medium mb-2 text-black">Sefarim</h3>
                    <div className="space-y-1 max-h-48 overflow-y-auto pr-2">
                      {sefarim.map(sefer => (
                        <label key={sefer} className="flex items-center">
                          <input
                            type="checkbox"
                            id={`homepage-sefer-${sefer.replace(/\s+/g, '-').toLowerCase()}`}
                            name={`sefer-${sefer}`}
                            checked={filters.sefarim.includes(sefer)}
                            onChange={() => handleFilterChange('sefarim', sefer)}
                            className="mr-2 rounded text-biblical-brown focus:ring-biblical-burgundy"
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
      <section className="py-1">
        <div className="content-container">
          <div className="text-center mb-12">
            <p className="text-lg max-w-3xl mx-auto text-biblical-brown animate-fade-in">
              Or, start by browsing through some sample shiurim.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {featuredShiurim.map(shiur => (
              <div key={shiur.id} className="group bg-white/90 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-biblical-gold/20 hover:border-biblical-gold/40">
                <div className="flex flex-col h-full">
                  {/* Main content area */}
                  <div className="flex-grow mb-4">
                    <Link 
                      to={`/shiur/${shiur.id}`} 
                      className="block text-biblical-brown hover:text-black transition-colors duration-200"
                    >
                      <h3 className="text-xl font-semibold leading-tight mb-3 group-hover:text-biblical-brown/90 text-biblical-brown">
                        {shiur.english_title}
                      </h3>
                    </Link>
                    
                    {shiur.hebrew_title && (
                      <p className="text-black font-hebrew mb-3 text-lg leading-relaxed">
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
                    <div className="flex items-center justify-between text-xs text-black mb-4">
                      <span className="bg-gray-700/10 px-2 py-1 rounded-full">
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
                      className="inline-flex items-center justify-center w-full px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-700/90 transition-colors duration-200 font-medium text-sm group-hover:shadow-md"
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
            <p className="text-xs text-biblical-brown/60 mt-2">
              Last Updated June 2025
            </p>
          </div>
        </div>
      </section>


    </div>
  );
};

export default HomePage;
