import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, X, Headphones, Book, Filter, Clock } from 'lucide-react';
import BackToTopButton from '@/components/common/BackToTopButton';
import shiurimData from '@/data/shiurim_data.json';
import { Shiur, SearchFilters } from '@/types/shiurim';
import { 
  searchShiurim, 
  getUniqueCategories, 
  getUniqueSubCategories, 
  getUniqueSefarim,
  countShiurimInFilter,
  formatTitle
} from '@/utils/dataUtils';

const SearchPage: React.FC = () => {
  const [shiurim, setShiurim] = useState<Shiur[]>([]);
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({
    categories: [],
    subCategories: [],
    sefarim: []
  });
  const [searchResults, setSearchResults] = useState<Shiur[]>([]);
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
    setShiurim(shiurimData as unknown as Shiur[]);
  }, []);

  useEffect(() => {
    // Search and apply filters
    const results = searchShiurim(shiurim, query, filters);
    setSearchResults(results);
  }, [shiurim, query, filters]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is already handled by the useEffect
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

  return (
    <div className="min-h-screen py-8">
      <div className="content-container">
        <h1 className="text-3xl md:text-4xl font-bold mb-6 text-center text-biblical-burgundy hidden md:block">
          Search Shiurim
        </h1>
        
        {/* Search form */}
        <div className="max-w-5xl mx-auto mb-8">
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
          </form>

          {/* Filters */}
          {showFilters && (
            <div className="bg-white/90 rounded-md shadow-md p-4 mb-6 animate-fade-in">
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
        
        {/* Search results */}
        <div className="max-w-5xl mx-auto">
          {searchResults.length === 0 ? (
            <div className="text-center py-8 bg-white/80 rounded-lg shadow-md">
              <p className="text-xl text-biblical-brown">No results found</p>
              <p className="text-biblical-brown/70 mt-2">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-biblical-brown/70 mb-2">
                Found {searchResults.length} {searchResults.length === 1 ? 'shiur' : 'shiurim'}
              </p>
              
              {searchResults.map(shiur => (
                <div 
                  key={shiur.id} 
                  className="bg-white/90 rounded-lg shadow-sm p-4 flex items-center justify-between hover:shadow-md transition-shadow"
                >
                  <div className="flex-1 mr-4 flex flex-col gap-1">
                    <Link to={`/shiur/${shiur.id}`} className="text-biblical-burgundy hover:underline">
                      <h3 className="text-lg font-medium leading-tight">
                        {shiur.english_title}
                      </h3>
                    </Link>
                    {shiur.hebrew_title && (
                      <p className="text-biblical-burgundy font-hebrew">
                        {shiur.hebrew_title}
                      </p>
                    )}
                    <p className="text-sm text-biblical-brown">
                      {formatTitle(shiur.category)} / {formatTitle(shiur.sub_category)} / {formatTitle(shiur.english_sefer)}
                    </p>
                    <p className="text-xs text-biblical-brown/60">
                      Year: {shiur.english_year} ({shiur.hebrew_year}) / <Clock size={14} className="inline mr-1 text-biblical-brown/70" />{(shiur as any).length || '--:--'}
                    </p>
                    
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <BackToTopButton />
    </div>
  );
};

export default SearchPage;
