import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { SkipToContent } from '@/components/common/SkipToContent';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      <SkipToContent />
      <Header />
      <main id="main-content" className="flex-1 pb-20" role="main" aria-label="Main content">
        {children}
      </main>
      <BottomNav />
    </div>
  );
};
