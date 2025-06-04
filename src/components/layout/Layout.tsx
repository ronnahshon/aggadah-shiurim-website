import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { useSidebar } from './SidebarProvider';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isOpen } = useSidebar();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div 
        className={cn(
          'flex-1 transition-all duration-300',
          // On mobile, use full width (no margin), on desktop maintain sidebar margins
          isMobile ? 'ml-0' : (isOpen ? 'ml-64' : 'ml-16')
        )}
      >
        <main className="min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
