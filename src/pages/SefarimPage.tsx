import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ExternalLink } from 'lucide-react';
import OptimizedImage from '@/components/ui/OptimizedImage';
import SEOHead from '@/components/seo/SEOHead';

const SefarimPage: React.FC = () => {
  return (
    <div className="min-h-screen py-8 pt-20 md:pt-8 flex items-center">
      <SEOHead
        title="Sefarim - Original Jewish Texts"
        description="Read original midrashic works including Darosh Darash Moshe, Midrash HaAliyah, and Commentary on Ein Yaakov. Free access to comprehensive Jewish learning materials and source texts."
        keywords={['jewish sefarim', 'original texts', 'darosh darash moshe', 'midrash haaliyah', 'ein yaakov commentary', 'free jewish books']}
        ogType="website"
      />
      <div className="content-container">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Darosh Darash Moshe (now on the left) */}
          <Link 
            to="/sefer/darosh-darash-moshe"
            className="bg-white/80 rounded-lg shadow-md overflow-hidden block hover:shadow-lg hover:bg-white/90 transition-all duration-200 cursor-pointer"
          >
            <div className="h-64 bg-gray-700/20 flex items-center justify-center relative">
              <OptimizedImage 
                src="/images/moshe_aharon_hur_img.jpg" 
                alt="Illustration of Moshe Rabbeinu with Aharon and Hur - representing the three ascents described in Darosh Darash Moshe" 
                width={400}
                height={300}
                loading="eager"
                priority={true}
                className="h-full w-full object-contain p-4"
              />
            </div>
            <div className="p-8 pt-10 text-center">
              <div className="space-y-4">
                <h2 className="text-3xl font-bold text-black">
                  Darosh Darash Moshe
                </h2>
                <p className="text-biblical-brown leading-relaxed">
                  A modern midrashic work in English, Darosh Darash Moshe explores the life, character and legacy of Moshe Rabbeinu and his brother Aharon during their three ascents in the desert. It builds upon classical aggadic sources to develop new insights.
                </p>
              </div>
            </div>
          </Link>

          {/* Midrash HaAliyah (now in the middle) */}
          <Link 
            to="/sefer/midrash-haaliyah"
            className="bg-white/80 rounded-lg shadow-md overflow-hidden block hover:shadow-lg hover:bg-white/90 transition-all duration-200 cursor-pointer"
          >
            <div className="h-64 bg-gray-700/20 flex items-center justify-center relative">
              <OptimizedImage 
                src="/images/moshe_aharon_hur_img.jpg" 
                alt="Illustration of Moshe Rabbeinu with Aharon and Hur - representing the three ascents described in Midrash HaAliyah" 
                width={400}
                height={300}
                loading="lazy"
                className="h-full w-full object-contain p-4"
              />
            </div>
            <div className="p-8 pt-10 text-center">
              <div className="space-y-4">
                <h2 className="text-3xl font-bold text-black">
                  Midrash HaAliyah
                </h2>
                <p className="text-biblical-brown leading-relaxed">
                  A midrashic work written in Hebrew, מדרש העלייה is a companion to Darosh Darash Moshe, summarizing the work in the style of classic aggadic ספרים. It combines teachings of חז״ל with original ideas and חידושים.
                </p>
              </div>
            </div>
          </Link>
          
          {/* Commentary on Ein Yaakov - Now Clickable */}
          <Link 
            to="/sefer/ein-yaakov-commentary"
            className="bg-white/80 rounded-lg shadow-md overflow-hidden block hover:shadow-lg hover:bg-white/90 transition-all duration-200 cursor-pointer"
          >
            <div className="h-64 bg-gray-700/20 flex items-center justify-center relative">
              <OptimizedImage 
                src="/images/ein_yaakov.png" 
                alt="Ein Yaakov Commentary" 
                width={400}
                height={300}
                loading="lazy"
                className="h-full w-full object-contain p-4"
              />
            </div>
            <div className="p-8 pt-10 text-center">
              <div className="space-y-4">
                <h2 className="text-3xl font-bold text-black">
                  Commentary on Ein Yaakov
                </h2>
                <p className="text-biblical-brown leading-relaxed">
                  חידושים on the aggadic sections of Seder Nezikin, Seder Kodashim, and Seder Toharot. Written in the style of classic commentaries on the Talmud in a mixture of Hebrew and Aramaic. Based on insights from hundreds of shiurim.
                </p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SefarimPage;
