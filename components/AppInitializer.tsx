'use client';

import { useEffect } from 'react';
import { initializeCompany } from '@/lib/firebase/init';

export default function AppInitializer() {
  useEffect(() => {
    initializeCompany();
  }, []);

  return null;
}

