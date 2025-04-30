
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, X, Headphones, Book, Filter, ArrowDown, ArrowUp } from 'lucide-react';
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
  const [sortField, setSortField] = useState<'title' | 'year'>('title');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showFilters, setShowFilters] = useState(false);

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
    let results = searchShiurim(shiurim, query, filters);
    
    // Apply sorting
    results = [...results].sort((a, b) => {
      if (sortField === 'title') {
        return sortDirection === 'asc' 
          ? a.english_title.localeCompare(b.english_title)
          : b.english_title.localeCompare(a.english_title);
      } else if (sortField === 'year') {
        return sortDirection === 'asc' 
          ? a.english_year.localeCompare(b.english_year)
          : b.english_year.localeCompare(a.english_year);
      }
      return 0;
    });
    
    setSearchResults(results);
  }, [shiurim, query, filters, sortField, sortDirection]);

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

  const toggleSort = (field: 'title' | 'year') => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const toggleFilters = () => {
    setShowFilters(prev => !prev);
  };

  return (
    <div className="min-h-screen py-8">
      <div className="content-container">
        <h1 className="text-3xl md:text-4xl font-bold mb-6 text-center text-biblical-burgundy">
          Search Shiurim
        </h1>
        
        {/* Search form */}
        <div className="max-w-3xl mx-auto mb-8">
          <form onSubmit={handleSearch} className="flex items-center gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-biblical-brown/60" size={20} />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={`Search through ${shiurim.length} shiurim`}
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

          {/* Sort options */}
          {searchResults.length > 0 && (
            <div className="flex items-center gap-4 text-sm mb-4">
              <span className="text-biblical-brown/70">Sort by:</span>
              <button 
                onClick={() => toggleSort('title')}
                className={`flex items-center ${sortField === 'title' ? 'font-medium text-biblical-burgundy' : 'text-biblical-brown'}`}
              >
                Title
                {sortField === 'title' && (
                  sortDirection === 'asc' ? 
                    <ArrowUp size={16} className="ml-1" /> : 
                    <ArrowDown size={16} className="ml-1" />
                )}
              </button>
              <button 
                onClick={() => toggleSort('year')}
                className={`flex items-center ${sortField === 'year' ? 'font-medium text-biblical-burgundy' : 'text-biblical-brown'}`}
              >
                Year
                {sortField === 'year' && (
                  sortDirection === 'asc' ? 
                    <ArrowUp size={16} className="ml-1" /> : 
                    <ArrowDown size={16} className="ml-1" />
                )}
              </button>
            </div>
          )}
        </div>
        
        {/* Search results */}
        <div className="max-w-3xl mx-auto">
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
                  className="p-4 bg-white/80 rounded-lg shadow-md hover:shadow-lg transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <Link 
                        to={`/shiur/${shiur.id}`}
                        className="text-lg font-medium text-biblical-navy hover:text-biblical-burgundy"
                      >
                        {shiur.english_title}
                      </Link>
                      {shiur.hebrew_title && (
                        <p className="font-hebrew text-biblical-brown mt-1">
                          {shiur.hebrew_title}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <a 
                        href={shiur.source_sheet_link} 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-parchment rounded-full hover:bg-parchment-dark transition-colors"
                        aria-label="View source sheet"
                      >
                        <Book size={18} className="text-biblical-brown" />
                      </a>
                      <Link 
                        to={`/shiur/${shiur.id}`}
                        className="p-2 bg-parchment rounded-full hover:bg-parchment-dark transition-colors"
                        aria-label="Listen to shiur"
                      >
                        <Headphones size={18} className="text-biblical-brown" />
                      </Link>
                    </div>
                  </div>
                  
                  <div className="mt-2 flex flex-wrap gap-2 text-sm">
                    <span className="px-2 py-1 bg-biblical-brown/10 rounded text-biblical-brown">
                      {formatTitle(shiur.category)}
                    </span>
                    <span className="px-2 py-1 bg-biblical-brown/10 rounded text-biblical-brown">
                      {formatTitle(shiur.sub_category)}
                    </span>
                    <span className="px-2 py-1 bg-biblical-brown/10 rounded text-biblical-brown">
                      {formatTitle(shiur.english_sefer)}
                    </span>
                    {shiur.english_year && (
                      <span className="px-2 py-1 bg-biblical-brown/10 rounded text-biblical-brown">
                        {shiur.english_year}
                      </span>
                    )}
                  </div>
                  
                  {shiur.tags && shiur.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {shiur.tags.map(tag => (
                        <span 
                          key={tag} 
                          className="px-2 py-0.5 bg-biblical-navy/10 rounded-full text-xs text-biblical-navy"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
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
