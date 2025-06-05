import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

export const CanonicalUrl: React.FC = () => {
  const location = useLocation();
  
  // Clean up the URL - remove query params for canonical
  const canonicalUrl = `https://midrashaggadah.com${location.pathname}`;
  
  return (
    <Helmet>
      <link rel="canonical" href={canonicalUrl} />
    </Helmet>
  );
}; 