'use client';

import { Menu } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { toggle } from '@/lib/store/slices/sidebarSlice';

export default function Header() {
  const dispatch = useAppDispatch();
  const handleToggle = () => dispatch(toggle());

  return (
    <nav 
      className="bg-white border-b border-gray-200 shadow-sm fixed top-0 left-0 right-0 h-16 z-40"
    >
      <div className="px-4 sm:px-6 h-full flex items-center gap-2 sm:gap-4">
        <button
          onClick={handleToggle}
          className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-200 ease-in-out hover:scale-105 active:scale-95 focus:outline-none focus:ring-0 focus:border-0 focus-visible:outline-none focus-visible:ring-0"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5 text-gray-700 transition-opacity duration-200 hover:opacity-80" />
        </button>
        <h1 className="text-xs sm:text-sm font-bold text-primary-600 truncate">
          <span className="hidden sm:inline">Users and Contacts Management System</span>
          <span className="sm:hidden">Management System</span>
        </h1>
      </div>
    </nav>
  );
}

