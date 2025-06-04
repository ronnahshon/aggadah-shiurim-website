import React from 'react';
import { Mail } from 'lucide-react';

const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen py-8">
      <div className="content-container">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold mb-6 text-center text-biblical-burgundy hidden md:block">
            About Midrash Aggadah
          </h1>
          
          <div className="bg-white/90 rounded-lg p-8 shadow-md mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-biblical-navy">
              Our Mission
            </h2>
            
            <p className="text-biblical-brown mb-4">
              Midrash Aggadah is dedicated to making the rich tradition of midrashic storytelling and rabbinic wisdom accessible to English-speaking audiences. Our goal is to provide high-quality shiurim (lectures) and source texts that illuminate the depth and beauty of aggadic literature in Jewish tradition.
            </p>
            
            <p className="text-biblical-brown mb-4">
              Through our catalog of shiurim, we hope to create a bridge between ancient wisdom and contemporary understanding, allowing students of all backgrounds to engage with these timeless texts.
            </p>
            
            <h2 className="text-2xl font-semibold mt-8 mb-4 text-biblical-navy">
              What is Midrash Aggadah?
            </h2>
            
            <p className="text-biblical-brown mb-4">
              Midrash Aggadah refers to the non-legal exegetical texts in rabbinic literature. While Midrash Halakha focuses on Jewish law, Midrash Aggadah explores ethical principles, theological concepts, and narrative expansions of biblical stories. These texts often fill in gaps in biblical narratives, explore character motivations, and draw moral lessons from the text.
            </p>
            
            <p className="text-biblical-brown mb-4">
              Aggadic midrashim can be found throughout rabbinic literature, including the Talmud, dedicated midrashic collections like Midrash Rabbah, and medieval compilations. These texts have profoundly influenced Jewish thought, art, literature, and spirituality throughout the centuries.
            </p>
            
            <h2 className="text-2xl font-semibold mt-8 mb-4 text-biblical-navy">
              About the Author
            </h2>
            
            <p className="text-biblical-brown mb-4">
              The Midrash Aggadah website is the result of years of scholarship and teaching in the field of rabbinic literature and Jewish studies. The author has dedicated their academic and professional life to making these ancient texts accessible to contemporary audiences while maintaining their depth and authenticity.
            </p>
            
            <h2 className="text-2xl font-semibold mt-8 mb-4 text-biblical-navy">
              Contact Information
            </h2>
            
            <div className="flex items-center mt-4">
              <Mail size={20} className="text-biblical-navy mr-2" />
              <a 
                href="mailto:midrashaggadah@gmail.com" 
                className="text-biblical-navy hover:text-biblical-burgundy"
              >
                midrashaggadah@gmail.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
