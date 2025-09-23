'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface SliderProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number[];
  onValueChange: (value: number[]) => void;
  max?: number;
  min?: number;
  step?: number;
  disabled?: boolean;
}

export function Slider({
  value,
  onValueChange,
  max = 100,
  min = 0,
  step = 1,
  disabled = false,
  className,
  ...props
}: SliderProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const sliderRef = React.useRef<HTMLDivElement>(null);

  const currentValue = value[0] || min;
  const percentage = ((currentValue - min) / (max - min)) * 100;

  const handleMouseDown = (event: React.MouseEvent) => {
    if (disabled) return;
    setIsDragging(true);
    updateValue(event);
  };

  const updateValue = React.useCallback((event: MouseEvent | React.MouseEvent) => {
    if (!sliderRef.current) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const clientX = event.clientX;
    const percentage = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const rawValue = min + percentage * (max - min);
    const steppedValue = Math.round(rawValue / step) * step;
    const clampedValue = Math.max(min, Math.min(max, steppedValue));

    onValueChange([clampedValue]);
  }, [min, max, step, onValueChange]);

  const handleMouseMove = React.useCallback(
    (event: MouseEvent) => {
      if (!isDragging || disabled) return;
      updateValue(event);
    },
    [isDragging, disabled, updateValue]
  );

  const handleMouseUp = React.useCallback(() => {
    setIsDragging(false);
  }, []);


  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div
      ref={sliderRef}
      className={cn(
        'relative flex w-full touch-none select-none items-center cursor-pointer',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      onMouseDown={handleMouseDown}
      {...props}
    >
      {/* Track */}
      <div className="relative h-2 w-full grow overflow-hidden rounded-full bg-gray-200">
        {/* Progress */}
        <div
          className="absolute h-full bg-blue-600 transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      {/* Thumb */}
      <div
        className={cn(
          'absolute block h-5 w-5 rounded-full border-2 border-blue-600 bg-white shadow-lg transition-all',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
          isDragging && 'scale-110',
          disabled && 'border-gray-400'
        )}
        style={{ left: `calc(${percentage}% - 10px)` }}
        tabIndex={disabled ? -1 : 0}
        role="slider"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={currentValue}
        onKeyDown={(e) => {
          if (disabled) return;
          
          let newValue = currentValue;
          switch (e.key) {
            case 'ArrowRight':
            case 'ArrowUp':
              newValue = Math.min(max, currentValue + step);
              break;
            case 'ArrowLeft':
            case 'ArrowDown':
              newValue = Math.max(min, currentValue - step);
              break;
            case 'Home':
              newValue = min;
              break;
            case 'End':
              newValue = max;
              break;
            default:
              return;
          }
          
          e.preventDefault();
          onValueChange([newValue]);
        }}
      />
    </div>
  );
}
