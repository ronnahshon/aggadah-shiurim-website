import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const BackToTopButton: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const location = useLocation();

  const toggleVisibility = () => {
    let shouldShow = false;
    
    // Check window scroll for most pages
    if (window.scrollY > 300) {
      shouldShow = true;
    }
    
    // For Darosh Darash Moshe page, also check container scrolling
    if (location.pathname === '/sefer/darosh-darash-moshe') {
      // Check middle content container
      const middleContainer = document.getElementById('darosh-main-content');
      if (middleContainer && middleContainer.scrollTop > 300) {
        shouldShow = true;
      }
      
      // Check footnotes container
      const footnotesContainer = document.getElementById('darosh-footnotes-content');
      if (footnotesContainer && footnotesContainer.scrollTop > 300) {
        shouldShow = true;
      }
    }
    
    setIsVisible(shouldShow);
  };

  const scrollToTop = () => {
    // Scroll window to top
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
    
    // For Darosh Darash Moshe page, also scroll containers to top
    if (location.pathname === '/sefer/darosh-darash-moshe') {
      // Scroll middle content container to top
      const middleContainer = document.getElementById('darosh-main-content');
      if (middleContainer) {
        middleContainer.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      }
      
      // Scroll footnotes container to top
      const footnotesContainer = document.getElementById('darosh-footnotes-content');
      if (footnotesContainer) {
        footnotesContainer.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      }
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      toggleVisibility();
    };

    // Add window scroll listener
    window.addEventListener('scroll', handleScroll);
    
    // For Darosh Darash Moshe page, also add container scroll listeners
    if (location.pathname === '/sefer/darosh-darash-moshe') {
      // Add a small delay to ensure DOM elements are ready
      const setupContainerListeners = () => {
        const middleContainer = document.getElementById('darosh-main-content');
        const footnotesContainer = document.getElementById('darosh-footnotes-content');
        
        if (middleContainer) {
          middleContainer.addEventListener('scroll', handleScroll);
        }
        
        if (footnotesContainer) {
          footnotesContainer.addEventListener('scroll', handleScroll);
        }
        
        return { middleContainer, footnotesContainer };
      };

      // Try immediately, then with a delay if needed
      let containers = setupContainerListeners();
      
      // If containers aren't found, try again after a short delay
      const timeoutId = setTimeout(() => {
        if (!containers.middleContainer || !containers.footnotesContainer) {
          containers = setupContainerListeners();
        }
      }, 100);
      
      return () => {
        clearTimeout(timeoutId);
        window.removeEventListener('scroll', handleScroll);
        if (containers.middleContainer) {
          containers.middleContainer.removeEventListener('scroll', handleScroll);
        }
        if (containers.footnotesContainer) {
          containers.footnotesContainer.removeEventListener('scroll', handleScroll);
        }
      };
    }
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [location.pathname]);

  return (
    <button
      onClick={scrollToTop}
      className={`back-to-top-btn ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'} transition-opacity duration-300`}
      aria-label="Back to top"
    >
      <ArrowUp size={20} />
    </button>
  );
};

export default BackToTopButton;
