import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Book, BookOpen, Search, Info, Clock } from 'lucide-react';
import { Shiur } from '@/types/shiurim';
import { formatTitle } from '@/utils/dataUtils';
import { generateWebsiteStructuredData, generateMetaDescription, generateKeywords } from '@/utils/seoUtils';
import SEOHead from '@/components/seo/SEOHead';
import shiurimData from '@/data/shiurim_data.json';

const HomePage: React.FC = () => {
  const [featuredShiurim, setFeaturedShiurim] = useState<Shiur[]>([]);

  useEffect(() => {
    // Filter Ein Yaakov shiurim and randomly select 3
    const allShiurim = shiurimData as unknown as Shiur[];
    const einYaakovShiurim = allShiurim.filter(shiur => shiur.category === 'ein_yaakov');
    
    // Randomly select 3 shiurim
    const shuffled = einYaakovShiurim.sort(() => 0.5 - Math.random());
    setFeaturedShiurim(shuffled.slice(0, 3));
  }, []);

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
      {/* Hero section */}
      <section className="py-16 bg-parchment-texture bg-cover bg-center">
        <div className="content-container text-center">
          {/* Work in Progress Notice */}
          <div className="max-w-2xl mx-auto mb-8 animate-fade-in">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 shadow-sm">
              <p className="text-amber-800 font-medium">
                ⚠️ Please be aware: This website is still a work in progress
              </p>
            </div>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-biblical-burgundy animate-fade-in">
            Welcome to Midrash Aggadah
          </h1>
          <p className="text-lg md:text-xl max-w-3xl mx-auto mb-8 text-biblical-brown animate-fade-in">
            A website that brings ancient Jewish wisdom and storytelling to life through an accessible collection of lectures and source texts.
          </p>
          
          {/* Content Statistics */}
          <div className="max-w-2xl mx-auto mb-8 animate-fade-in">
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 shadow-lg border border-biblical-gold/20">
              <p className="text-lg font-medium text-biblical-burgundy mb-2">
                📚 Explore Our Extensive Collection
              </p>
              <p className="text-biblical-brown">
                <span className="font-semibold text-biblical-navy">Thousands of pages</span> of written source sheets, <span className="font-semibold text-biblical-navy">hundreds of hours</span> of audio shiurim
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/search" className="px-6 py-3 bg-biblical-navy text-white rounded-md hover:bg-opacity-90 transition-colors shadow-md">
              Search Shiurim
            </Link>
            <Link to="/catalog" className="px-6 py-3 bg-biblical-burgundy text-white rounded-md hover:bg-opacity-90 transition-colors shadow-md">
              Browse Catalog
            </Link>
          </div>
        </div>
      </section>

      {/* Feature tiles */}
      <section className="py-12 bg-parchment-light">
        <div className="content-container">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Catalog Tile */}
            <Link to="/catalog" className="shiur-card flex flex-col items-center text-center p-6">
              <div className="mb-4 p-3 bg-biblical-burgundy/10 rounded-full">
                <Book size={36} className="text-biblical-burgundy" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Browse Catalog</h3>
              <p className="text-biblical-brown/80">
                Explore our structured collection of shiurim organized by category, sub-category, and sefer.
              </p>
            </Link>

            {/* Search Tile */}
            <Link to="/search" className="shiur-card flex flex-col items-center text-center p-6">
              <div className="mb-4 p-3 bg-biblical-burgundy/10 rounded-full">
                <Search size={36} className="text-biblical-burgundy" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Search Shiurim</h3>
              <p className="text-biblical-brown/80">
                Find specific topics or keywords across our entire collection of lectures and source texts.
              </p>
            </Link>

            {/* Sefarim Tile */}
            <Link to="/sefarim" className="shiur-card flex flex-col items-center text-center p-6">
              <div className="mb-4 p-3 bg-biblical-burgundy/10 rounded-full">
                <BookOpen size={36} className="text-biblical-burgundy" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Browse Sefarim</h3>
              <p className="text-biblical-brown/80">
                Access complete sefarim with our unique collection of midrashic texts and commentaries.
              </p>
            </Link>

            {/* About Tile */}
            <Link to="/about" className="shiur-card flex flex-col items-center text-center p-6">
              <div className="mb-4 p-3 bg-biblical-burgundy/10 rounded-full">
                <Info size={36} className="text-biblical-burgundy" />
              </div>
              <h3 className="text-xl font-semibold mb-2">About</h3>
              <p className="text-biblical-brown/80">
                Learn more about the mission and people behind the Midrash Aggadah project.
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* Sample shiurim section */}
      <section className="py-12">
        <div className="content-container">
          <h2 className="text-2xl md:text-3xl font-semibold mb-8 text-center text-biblical-burgundy">
            Sample Shiurim
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-10">
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
    </div>
  );
};

export default HomePage;
