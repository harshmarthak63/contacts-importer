'use client';

import { useAppSelector } from '@/lib/store/hooks';
import { cn } from '@/lib/utils';

export default function MainContent({ children }: { children: React.ReactNode }) {
  const isOpen = useAppSelector((state) => state.sidebar.isOpen);

  return (
    <main 
      className={cn(
        "pt-16 h-screen bg-gray-50 transition-all duration-300 ease-in-out overflow-hidden",
        isOpen ? "md:ml-[230px]" : "md:ml-0"
      )}
    >
      <div className="h-full p-4 sm:p-6 transition-opacity duration-300 overflow-y-auto">
        {children}
      </div>
    </main>
  );
}
