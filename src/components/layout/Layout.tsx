
import React from 'react';
import Sidebar from './Sidebar';
import { useSidebar } from './SidebarProvider';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isOpen } = useSidebar();

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div 
        className={cn(
          'flex-1 transition-all duration-300',
          isOpen ? 'ml-64' : 'ml-16'
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
