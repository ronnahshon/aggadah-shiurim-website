
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSidebar } from './SidebarProvider';
import { cn } from '@/lib/utils';
import { Book, BookOpen, Search, Home, Info, Menu, X } from 'lucide-react';

const Sidebar: React.FC = () => {
  const { isOpen, toggle } = useSidebar();
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

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
            <Link 
              to="/" 
              className={cn(
                'sidebar-link',
                isActive('/') && 'active'
              )}
            >
              <Home size={20} />
              {isOpen && <span>Home</span>}
            </Link>
            
            <Link 
              to="/catalog" 
              className={cn(
                'sidebar-link',
                isActive('/catalog') && 'active'
              )}
            >
              <Book size={20} />
              {isOpen && <span>Catalog</span>}
            </Link>
            
            <Link 
              to="/search" 
              className={cn(
                'sidebar-link',
                isActive('/search') && 'active'
              )}
            >
              <Search size={20} />
              {isOpen && <span>Search</span>}
            </Link>

            <Link 
              to="/sefarim" 
              className={cn(
                'sidebar-link',
                isActive('/sefarim') && 'active'
              )}
            >
              <BookOpen size={20} />
              {isOpen && <span>Sefarim</span>}
            </Link>
            
            <Link 
              to="/about" 
              className={cn(
                'sidebar-link',
                isActive('/about') && 'active'
              )}
            >
              <Info size={20} />
              {isOpen && <span>About</span>}
            </Link>
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
