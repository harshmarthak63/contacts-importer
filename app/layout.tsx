import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import AppInitializer from '@/components/AppInitializer';
import LayoutClient from '@/components/LayoutClient';
import ReduxProvider from '@/components/ReduxProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Contact Importer',
  description: 'Smart contact import system with field mapping',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ReduxProvider>
          <AppInitializer />
          <LayoutClient>
            {children}
          </LayoutClient>
        </ReduxProvider>
      </body>
    </html>
  );
}
