'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, Contact, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { toggle } from '@/lib/store/slices/sidebarSlice';

export default function Sidebar() {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector((state) => state.sidebar.isOpen);
  const handleToggle = () => dispatch(toggle());

  const navItems = [
    {
      name: 'Users',
      href: '/users',
      icon: Users,
    },
    {
      name: 'Contacts',
      href: '/contacts',
      icon: Contact,
    },
    {
      name: 'Contact Fields',
      href: '/fields',
      icon: Settings,
    },
  ];

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden transition-opacity duration-300"
          onClick={handleToggle}
          aria-hidden="true"
        />
      )}
      <aside
        className={cn(
          'w-[230px] bg-white border-r border-gray-200 h-screen fixed left-0 top-0 pt-16 z-30 transition-all duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href === '/users' && pathname === '/');
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ease-in-out',
                  'hover:bg-gray-50 active:scale-95',
                  isActive
                    ? 'bg-primary-50 text-primary-600 font-medium shadow-sm'
                    : 'text-gray-700 hover:text-gray-900'
                )}
              >
                <Icon className={cn(
                  'h-4 w-4 transition-transform duration-200',
                  isActive && 'scale-110'
                )} />
                <span className="text-xs transition-all duration-200">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
