import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';

const SefarimPage: React.FC = () => {
  return (
    <div className="min-h-screen py-8">
      <div className="content-container">
        <h1 className="text-3xl md:text-4xl font-bold mb-6 text-center text-biblical-burgundy hidden md:block">
          Sefarim Collection
        </h1>
        
        <p className="max-w-3xl mx-auto text-center mb-12 text-biblical-brown">
          Explore our collection of sefarim (books) related to midrash aggadah, featuring comprehensive compilations of midrashic texts and commentaries.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Midrashim about Moshe Rabbeinu */}
          <div className="bg-white/80 rounded-lg shadow-md overflow-hidden">
            <div className="h-48 bg-biblical-navy/20 flex items-center justify-center">
              <BookOpen size={64} className="text-biblical-navy" />
            </div>
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-2 text-biblical-burgundy">
                Midrashim about Moshe Rabbeinu
              </h2>
              <h3 className="text-lg font-hebrew text-biblical-navy mb-3">
                מדרשים על משה רבינו
              </h3>
              <p className="text-biblical-brown mb-4">
                A comprehensive collection of midrashic texts about Moses, our teacher. This sefer explores the life, character, and legacy of Moses through the lens of midrash aggadah.
              </p>
              <Link 
                to="/sefer/midrashim-about-moshe-rabbeinu" 
                className="inline-block px-4 py-2 bg-biblical-burgundy text-white rounded-md hover:bg-biblical-burgundy/90 transition-colors"
              >
                Read Sefer
              </Link>
            </div>
          </div>
          
          {/* Future sefarim can be added here */}
          <div className="bg-white/80 rounded-lg shadow-md overflow-hidden border border-dashed border-parchment-dark">
            <div className="h-48 bg-parchment flex items-center justify-center">
              <span className="text-biblical-brown/50 text-lg font-medium">Coming Soon</span>
            </div>
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-2 text-biblical-brown/70">
                More sefarim coming soon
              </h2>
              <p className="text-biblical-brown/70">
                Our collection is constantly growing. Check back later for more sefarim on midrash aggadah.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SefarimPage;
