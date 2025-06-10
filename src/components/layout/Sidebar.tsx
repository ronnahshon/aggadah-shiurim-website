import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSidebar } from './SidebarProvider';
import { cn } from '@/lib/utils';
import { Book, BookOpen, Search, Home, Info, Menu, X } from 'lucide-react';

const Sidebar: React.FC = () => {
  const { isOpen, toggle } = useSidebar();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/catalog':
        return 'Shiurim Catalog';
      case '/search':
        return 'Search Shiurim';
      case '/sefarim':
        return 'Original Sefarim';
      case '/about':
        return 'About Midrash Aggadah';
      case '/':
        return '';
      default:
        return '';
    }
  };

  const navigationLinks = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/catalog', icon: Book, label: 'Shiurim Catalog' },
    { to: '/sefarim', icon: BookOpen, label: 'Original Sefarim' },
    { to: '/about', icon: Info, label: 'About Midrash Aggadah' },
  ];

  // Mobile Navigation (Top Bar)
  if (isMobile) {
    return (
      <>
        {/* Mobile Top Navigation Bar - Sticky */}
        <nav className="fixed top-0 left-0 right-0 bg-parchment border-b border-parchment-dark z-40">
          <div className="flex items-center justify-between px-4 h-14">
            {/* Mobile Menu Button - Left Side */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md hover:bg-parchment-dark transition-colors flex-shrink-0"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            
            {/* Page Title - Center */}
            <h1 className="text-biblical-burgundy font-semibold text-base sm:text-lg text-center flex-1 mx-4 truncate">
              {getPageTitle()}
            </h1>
            
            {/* Empty space for balance - Right Side */}
            <div className="w-10 flex-shrink-0"></div>
          </div>

          {/* Mobile Menu Dropdown */}
          {mobileMenuOpen && (
            <div className="bg-parchment border-t border-parchment-dark">
              <div className="px-4 py-2 space-y-1">
                {navigationLinks.map(({ to, icon: Icon, label }) => (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-3 rounded-md text-biblical-brown hover:bg-biblical-burgundy/10 hover:text-biblical-burgundy transition-all',
                      isActive(to) && 'bg-biblical-burgundy/10 text-biblical-burgundy font-medium'
                    )}
                  >
                    <Icon size={20} />
                    <span>{label}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </nav>

        {/* Mobile Content Spacer */}
        <div className="h-28"></div>
      </>
    );
  }

  // Desktop Sidebar (Original)
  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-full bg-parchment border-r border-parchment-dark transition-all duration-300 z-30',
        isOpen ? 'w-64' : 'w-16'
      )}
    >
      <div className="flex flex-col h-full">
        {/* Header with toggle button */}
        <div className="h-16 flex items-center justify-between p-4 border-b border-parchment-dark">
          {isOpen && <h1 className="text-biblical-burgundy font-semibold">Midrash Aggadah</h1>}
          <button 
            onClick={toggle} 
            className="p-1.5 rounded-md hover:bg-parchment-dark transition-colors"
            aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
          >
            {isOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
        
        {/* Navigation links */}
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-2">
            {navigationLinks.map(({ to, icon: Icon, label }) => (
            <Link 
                key={to}
                to={to}
              className={cn(
                'sidebar-link',
                  isActive(to) && 'active'
              )}
            >
                <Icon size={20} />
                {isOpen && <span>{label}</span>}
            </Link>
            ))}
          </nav>
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-parchment-dark">
          {isOpen && (
            <p className="text-xs text-biblical-brown/70">
              &copy; {new Date().getFullYear()} Midrash Aggadah
            </p>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
