import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

interface BreadcrumbItem {
  name: string;
  url: string;
}

export const BreadcrumbSchema: React.FC = () => {
  const location = useLocation();
  
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [
      { name: 'Home', url: 'https://midrashaggadah.com/' }
    ];
    
    let currentPath = '';
    
    for (let index = 0; index < pathSegments.length; index++) {
      const segment = pathSegments[index];
      currentPath += `/${segment}`;
      
      let name = segment.charAt(0).toUpperCase() + segment.slice(1);
      
      // Handle specific routes
      switch (segment) {
        case 'catalog':
          name = 'Shiurim Catalog';
          break;
        case 'sources':
          name = 'Source Sheets';
          break;
        case 'shiur':
          if (pathSegments[index + 1]) {
            name = 'Shiur';
            // Skip to the next segment which would be the shiur ID
            continue;
          }
          break;
        case 'sefarim':
          name = 'Sefarim Library';
          break;
        case 'sefer':
          if (pathSegments[index + 1] === 'darosh-darash-moshe') {
            name = 'Darosh Darash Moshe';
            // Skip the next segment since we handled it
            index++;
            currentPath += `/${pathSegments[index]}`;
          } else if (pathSegments[index + 1] === 'midrash-haaliyah') {
            name = 'Midrash Haaliyah';
            // Skip the next segment since we handled it
            index++;
            currentPath += `/${pathSegments[index]}`;
          } else {
            name = 'Sefer';
          }
          break;
        default:
          // Clean up segment names
          name = segment.replace(/_/g, ' ').replace(/-/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
      }
      
      breadcrumbs.push({
        name,
        url: `https://midrashaggadah.com${currentPath}`
      });
    }
    
    return breadcrumbs;
  };
  
  const breadcrumbs = generateBreadcrumbs();
  
  if (breadcrumbs.length <= 1) {
    return null; // Don't show breadcrumbs for home page only
  }
  
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((breadcrumb, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": breadcrumb.name,
      "item": breadcrumb.url
    }))
  };
  
  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(breadcrumbSchema)}
      </script>
    </Helmet>
  );
}; 