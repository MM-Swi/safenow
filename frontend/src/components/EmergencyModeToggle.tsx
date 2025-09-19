'use client';

import { Button } from '@/components/ui/Button';
import { AlertTriangle, BookOpen } from 'lucide-react';

interface EmergencyModeToggleProps {
  isEmergencyMode: boolean;
  onToggle: (isEmergency: boolean) => void;
}

export function EmergencyModeToggle({ isEmergencyMode, onToggle }: EmergencyModeToggleProps) {
  return (
    <div className="fixed top-6 right-6 z-50">
      <div className="relative">
        {/* Glow effect */}
        <div className={`absolute inset-0 rounded-2xl blur-lg opacity-60 ${
          isEmergencyMode 
            ? 'bg-gradient-to-r from-red-500 to-orange-500 animate-pulse' 
            : 'bg-gradient-to-r from-blue-500 to-purple-500'
        }`} />
        
        <Button
          onClick={() => onToggle(!isEmergencyMode)}
          className={`relative overflow-hidden border-0 font-bold py-4 px-6 rounded-2xl shadow-2xl transition-all duration-500 hover:scale-105 ${
            isEmergencyMode
              ? 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white'
              : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
          }`}
        >
          {/* Animated background */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
          
          <div className="relative flex items-center gap-3">
            {isEmergencyMode ? (
              <>
                <div className="p-1 bg-white/20 rounded-lg">
                  <BookOpen className="w-5 h-5" />
                </div>
                <span className="text-lg">Tryb normalny</span>
              </>
            ) : (
              <>
                <div className="p-1 bg-white/20 rounded-lg">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <span className="text-lg">Tryb awaryjny</span>
              </>
            )}
          </div>
        </Button>
      </div>
    </div>
  );
}
