import React from 'react';
import { Mail } from 'lucide-react';
import SEOHead from '@/components/seo/SEOHead';
import { generateFAQStructuredData, generateEnhancedMetaDescription, generateContextualKeywords } from '@/utils/additionalSeoUtils';

const AboutPage: React.FC = () => {
  const faqStructuredData = generateFAQStructuredData();
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://midrashaggadah.com';
  
  return (
    <div className="min-h-screen py-8 pt-20 md:pt-8">
      <SEOHead
        title="About Midrash Aggadah"
        description={generateEnhancedMetaDescription('about')}
        keywords={generateContextualKeywords('about')}
        structuredData={faqStructuredData}
        canonicalUrl={`${baseUrl}/about`}
        ogType="website"
      />
      <div className="content-container">
        <div className="max-w-3xl mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold mb-6 text-center text-biblical-brown">
            About Midrash Aggadah
          </h1>
          
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-semibold mb-4 text-biblical-brown">
              Our Mission
            </h2>
            
            <p className="text-biblical-brown mb-4 leading-relaxed">
              Midrash aggadah was given much prominence and importance in the period of the Tannaim and Amoraim as an indispensable supplement to halachah and other areas of Torah study. חז״ל understood that aside from expounding the laws in all their minutiae which govern the mitzvot and how a Jew is meant to behave, there is also a need for teachings that embody the rest of day-to-day life. Aggadot were woven into the Talmudim as an integral, inseparable part of Torah SheBeAl Peh (the Oral Law), and many Sefarim were written with additional aggadot even into the period of the Rishonim. Yet in recent centuries, knowledge - and arguably, appreciation - for the aggadic part of our mesorah has declined. There are not nearly as many commentaries or works written which deal in a deep, comprehensive way with aggadot the way that a myriad of Sefarim have been written about halachic topics. And yet, midrash aggadah has much to offer Torah-observant Jews who seek a rich, vibrant Judaism, something that is needed especially in today's world.
            </p>
            
            <p className="text-biblical-brown mb-4 leading-relaxed">
              This website therefore aims to provide accessible shiurim and Sefarim on various concepts and ideas that are explored in חז״ל with the goal of helping to address this need. In the spirit of the Torah being something which should be accessible to everyone, all sources on this website are free to use and share (and should be shared in order to increase הרבצת התורה).
            </p>
            
            <h2 className="text-2xl font-semibold mt-8 mb-4 text-biblical-brown">
              What is Midrash Aggadah?
            </h2>
            
            <p className="text-biblical-brown mb-4 leading-relaxed">
              Midrash Aggadah refers to the non-legal exegetical texts in rablinic literature. While Midrash Halakha focuses on Jewish law, Midrash Aggadah explores ethical principles, theological concepts, and narrative expansions of biblical stories. These texts often fill in gaps in biblical narratives, explore character motivations, and draw moral lessons from the text.
            </p>
            
            <p className="text-biblical-brown mb-4 leading-relaxed">
              Aggadic midrashim can be found throughout rabbinic literature, including the Talmud, dedicated midrashic collections like Midrash Rabbah, and medieval compilations. These texts have profoundly influenced Jewish thought, art, literature, and spirituality throughout the centuries.
            </p>
            
            <p className="text-biblical-brown mb-4 leading-relaxed">
              This website has shiurim on Ein Yaakov, a work by Rabbi Yaakov Ibn Habib that compiled all the aggadic (i.e. non-halachic) sections of the Talmud, on the weekly parsha, and on other midrashic works (i.e. Tanna Devei Eliyahu). It also contains original, standalone Sefarim written in English and Rabbinic Hebrew.
            </p>
            
            <h2 className="text-2xl font-semibold mt-8 mb-4 text-biblical-brown">
              About the Author
            </h2>
            
            <p className="text-biblical-brown mb-4 leading-relaxed">
              Ron Nahshon grew up in New Jersey and studied Torah and Talmud at Yeshivat Har Etzion. He has a Bachelor of Arts Degree from Yeshiva University in New York and a Masters Degree in Tanach and Parshanut from Machon Herzog in Gush Etzion, and he has Rabbinical Sofrut certification (Semicha) from Va'ad Mishmeret Stam and Machon Eliya in Jerusalem. He currently lives in Kiryat Gat, Israel with his wife Sara and four children. 
            </p>
            
            <h2 className="text-2xl font-semibold mt-8 mb-4 text-biblical-brown">
              Contact Information
            </h2>
            
            <div className="flex items-center justify-center mt-4">
              <Mail size={20} className="text-biblical-brown mr-2" />
              <a 
                href="mailto:ronnahshon@gmail.com" 
                className="text-biblical-brown hover:text-biblical-brown/80 underline"
              >
                ronnahshon@gmail.com
              </a>
            </div>
          </div>
          
          {/* Work in progress banner */}
          <div className="bg-biblical-gold/20 border-l-4 border-biblical-gold rounded-lg p-4 mt-8">
            <p className="text-biblical-brown font-medium text-center">
              Note: This website is still a work in progress, thanks for your patience!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
