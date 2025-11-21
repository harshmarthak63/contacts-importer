'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StepperProps {
  currentStep: number;
  steps: Array<{ number: number; label: string; description: string }>;
}

export default function Stepper({ currentStep, steps }: StepperProps) {
  return (
    <div className="flex items-center justify-center gap-6 mb-4">
      {steps.map((step, index) => {
        const isCompleted = step.number < currentStep;
        const isActive = step.number === currentStep;
        const isPending = step.number > currentStep;

        return (
          <div key={step.number} className="flex items-center gap-3">
            <div
              className={cn(
                'flex items-center justify-center w-8 h-8 rounded-full border-2 font-semibold text-sm transition-colors flex-shrink-0',
                isCompleted && 'bg-green-500 border-green-500 text-white',
                isActive && 'bg-primary-600 border-primary-600 text-white',
                isPending && 'bg-gray-100 border-gray-300 text-gray-500'
              )}
            >
              {isCompleted ? (
                <Check className="h-4 w-4" />
              ) : (
                step.number
              )}
            </div>
            <div className="flex flex-col">
              <div
                className={cn(
                  'text-sm font-medium',
                  isActive && 'text-primary-600',
                  isPending && 'text-gray-500',
                  isCompleted && 'text-gray-700'
                )}
              >
                {step.label}
              </div>
              <div className="text-xs text-gray-500">{step.description}</div>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'w-12 h-0.5 transition-colors',
                  isCompleted ? 'bg-green-500' : 'bg-gray-200'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
