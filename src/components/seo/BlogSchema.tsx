import React from 'react';
import { Helmet } from 'react-helmet-async';

interface BlogPostSchema {
  title: string;
  description: string;
  url: string;
  datePublished: string;
  dateModified?: string;
  authorName: string;
  image?: string;
  keywords: string[];
}

const BlogSchema: React.FC<BlogPostSchema> = ({
  title,
  description,
  url,
  datePublished,
  dateModified,
  authorName,
  image = "https://midrashaggadah.com/favicon.ico",
  keywords
}) => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": title,
    "description": description,
    "url": url,
    "datePublished": datePublished,
    "dateModified": dateModified || datePublished,
    "author": {
      "@type": "Person",
      "name": authorName
    },
    "publisher": {
      "@type": "EducationalOrganization",
      "name": "Midrash Aggadah",
      "url": "https://midrashaggadah.com"
    },
    "image": image,
    "keywords": keywords.join(', '),
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": url
    }
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
};

export default BlogSchema; 