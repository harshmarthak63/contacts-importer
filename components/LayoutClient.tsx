'use client';

import Sidebar from './Sidebar';
import Header from './Header';
import MainContent from './MainContent';

export default function LayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <Sidebar />
      <MainContent>
        {children}
      </MainContent>
    </>
  );
}
