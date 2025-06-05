import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ExternalLink } from 'lucide-react';

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
          <Link 
            to="/sefer/midrash-haaliyah"
            className="bg-white/80 rounded-lg shadow-md overflow-hidden block hover:shadow-lg hover:bg-white/90 transition-all duration-200 cursor-pointer"
          >
            <div className="h-48 bg-biblical-navy/20 flex items-center justify-center">
              <img 
                src="/images/moshe_aharon_hur_img.png" 
                alt="משה אהרון וחור" 
                className="h-full w-full object-cover"
              />
            </div>
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4 text-biblical-burgundy text-center font-hebrew">
                מדרש העלייה
              </h2>
              <p className="text-biblical-brown mb-4">
                A midrash written in Hebrew in the style of classic aggadic works, ספר העלייה explores the life, character, and legacy of Moshe Rabbeinu and his brother Aharon via their three ascents in the dessert. It weaves original חידושים together with a myriad of teachings found throughout ספרי חז״ל.
              </p>
            </div>
          </Link>
          
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
