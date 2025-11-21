'use client';

import { useEffect } from 'react';
import { CheckCircle, X } from 'lucide-react';

interface ToastProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, isVisible, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-5 fade-in-0">
      <div className="bg-green-100 border border-green-300 rounded-lg shadow-lg p-3 flex items-center gap-2 min-w-[280px] max-w-md">
        <CheckCircle className="h-5 w-5 text-green-700 flex-shrink-0" />
        <p className="text-sm font-medium text-green-900 flex-1">{message}</p>
        <button
          onClick={onClose}
          className="text-green-700 hover:text-green-900 transition-colors flex-shrink-0"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

