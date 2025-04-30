
import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Headphones, Book, ArrowUp } from 'lucide-react';
import BackToTopButton from '@/components/common/BackToTopButton';
import { Category, Shiur } from '@/types/shiurim';
import { organizeShiurimByHierarchy } from '@/utils/dataUtils';
import shiurimData from '@/data/shiurim_data.json';

const CatalogPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const tocRefs = useRef<Record<string, HTMLHeadingElement | null>>({});

  useEffect(() => {
    // Convert the imported JSON to the required type
    const shiurim = shiurimData as unknown as Shiur[];
    const organizedData = organizeShiurimByHierarchy(shiurim);
    setCategories(organizedData);
  }, []);

  const scrollToSefer = (seferId: string) => {
    const element = tocRefs.current[seferId];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="content-container">
        <h1 className="text-3xl md:text-4xl font-bold mb-6 text-center text-biblical-burgundy">
          Shiurim Catalog
        </h1>

        {/* Table of Contents */}
        <div className="mb-12 bg-white/80 rounded-lg p-6 shadow-md">
          <h2 className="text-2xl font-semibold mb-6 text-biblical-burgundy text-center">
            Table of Contents
          </h2>
          
          <div className="flex flex-wrap justify-center gap-8">
            {categories.map(category => (
              <div key={category.name} className="mb-8">
                <h3 className="text-xl font-semibold mb-4 text-biblical-burgundy text-center">
                  {category.name}
                </h3>
                
                <div className="flex flex-wrap justify-center gap-6 mb-4">
                  {category.subCategories.map(subCategory => (
                    <div key={subCategory.name} className="mb-6">
                      <h4 className="font-medium text-lg mb-3 text-biblical-navy text-center">
                        {subCategory.name}
                      </h4>
                      
                      <ul className="space-y-2">
                        {subCategory.sefarim.map(sefer => (
                          <li key={sefer.name}>
                            <button 
                              onClick={() => scrollToSefer(`${category.name}-${subCategory.name}-${sefer.name}`)}
                              className="text-biblical-brown hover:text-biblical-burgundy hover:underline"
                            >
                              {sefer.name}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Shiurim Tables */}
        <div className="space-y-12">
          {categories.map(category => (
            <div key={category.name} className="space-y-10">
              {category.subCategories.map(subCategory => (
                <div key={subCategory.name} className="space-y-8">
                  {subCategory.sefarim.map(sefer => (
                    <div key={sefer.name} className="mb-12">
                      <h3 
                        ref={el => tocRefs.current[`${category.name}-${subCategory.name}-${sefer.name}`] = el}
                        className="text-2xl font-semibold mb-4 text-center text-biblical-burgundy"
                      >
                        {sefer.name}
                      </h3>
                      {sefer.hebrewName && (
                        <h4 className="text-xl mb-6 text-center font-hebrew text-biblical-navy">
                          {sefer.hebrewName}
                        </h4>
                      )}
                      
                      <div className="overflow-x-auto">
                        <table className="catalog-table">
                          <thead>
                            <tr>
                              <th className="w-16">#</th>
                              <th>English Title</th>
                              <th>Hebrew Title</th>
                              <th className="w-20">Source</th>
                              <th className="w-20">Audio</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sefer.shiurim.map((shiur, index) => (
                              <tr key={shiur.id}>
                                <td>{index + 1}</td>
                                <td>
                                  <Link 
                                    to={`/shiur/${shiur.id}`}
                                    className="text-biblical-navy hover:text-biblical-burgundy hover:underline"
                                  >
                                    {shiur.english_title}
                                  </Link>
                                </td>
                                <td className="font-hebrew">{shiur.hebrew_title}</td>
                                <td className="text-center">
                                  <a 
                                    href={shiur.source_sheet_link} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    aria-label={`View source sheet for ${shiur.english_title}`}
                                  >
                                    <Book className="mx-auto text-biblical-navy hover:text-biblical-burgundy" size={20} />
                                  </a>
                                </td>
                                <td className="text-center">
                                  <Link 
                                    to={`/shiur/${shiur.id}`}
                                    aria-label={`Listen to ${shiur.english_title}`}
                                  >
                                    <Headphones className="mx-auto text-biblical-navy hover:text-biblical-burgundy" size={20} />
                                  </Link>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <BackToTopButton />
    </div>
  );
};

export default CatalogPage;
