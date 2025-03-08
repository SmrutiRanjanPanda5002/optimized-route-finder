
import React from 'react';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, className }) => {
  return (
    <div className={cn(
      "min-h-screen w-full bg-background flex flex-col",
      className
    )}>
      <header className="glass border-b z-10 sticky top-0">
        <div className="container mx-auto py-4 px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-semibold text-sm">R</span>
            </div>
            <h1 className="text-xl font-semibold">RouteOptimizer</h1>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <a href="#" className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">About</a>
            <a href="#" className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">How it works</a>
            <a href="#" className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">Contact</a>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        {children}
      </main>
      <footer className="border-t py-6">
        <div className="container mx-auto px-4 sm:px-6 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} RouteOptimizer. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
