import React from 'react';
import { Link } from 'react-router-dom';
import { Book, BookOpen, Search, Info } from 'lucide-react';

const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen">
      {/* Hero section */}
      <section className="py-16 bg-parchment-texture bg-cover bg-center">
        <div className="content-container text-center">
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
            <Link to="/catalog" className="px-6 py-3 bg-biblical-burgundy text-white rounded-md hover:bg-opacity-90 transition-colors shadow-md">
              Browse Catalog
            </Link>
            <Link to="/search" className="px-6 py-3 bg-biblical-navy text-white rounded-md hover:bg-opacity-90 transition-colors shadow-md">
              Search Shiurim
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

      {/* Recent shiurim section */}
      <section className="py-12">
        <div className="content-container">
          <h2 className="text-2xl md:text-3xl font-semibold mb-6 text-center text-biblical-burgundy">
            Featured Shiurim
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Add a few featured shiurim from the data */}
            <div className="shiur-card">
              <h3 className="text-xl font-semibold mb-2">The Birth of Moshe in Midrash</h3>
              <p className="text-biblical-brown/80 mb-3">From Midrashim About Moshe Rabbeinu</p>
              <Link to="/shiur/midrash_moshe_1" className="text-biblical-navy hover:text-biblical-burgundy font-medium">
                Listen to Shiur &rarr;
              </Link>
            </div>
            
            <div className="shiur-card">
              <h3 className="text-xl font-semibold mb-2">Moshe in Midian</h3>
              <p className="text-biblical-brown/80 mb-3">From Midrashim About Moshe Rabbeinu</p>
              <Link to="/shiur/midrash_moshe_2" className="text-biblical-navy hover:text-biblical-burgundy font-medium">
                Listen to Shiur &rarr;
              </Link>
            </div>
            
            <div className="shiur-card">
              <h3 className="text-xl font-semibold mb-2">Abraham's Discovery of God</h3>
              <p className="text-biblical-brown/80 mb-3">From Midrashim About Avot</p>
              <Link to="/shiur/midrash_avot_1" className="text-biblical-navy hover:text-biblical-burgundy font-medium">
                Listen to Shiur &rarr;
              </Link>
            </div>
          </div>
          
          <div className="text-center">
            <Link to="/catalog" className="inline-block px-6 py-3 bg-biblical-gold/80 hover:bg-biblical-gold text-biblical-brown font-medium rounded-md transition-colors shadow-md">
              View All Shiurim
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
