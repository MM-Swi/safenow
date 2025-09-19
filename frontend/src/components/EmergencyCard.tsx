'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmergencyData } from '@/types/emergency';
import { AlertTriangle, Navigation } from 'lucide-react';

interface EmergencyCardProps {
  emergency: EmergencyData;
  onFindShelter?: () => void;
}

export function EmergencyCard({ emergency, onFindShelter }: EmergencyCardProps) {
  const priorityStyles = {
    critical: {
      gradient: 'from-red-600 to-pink-600',
      glow: 'from-red-500/30 to-pink-500/30',
      text: 'text-red-100'
    },
    high: {
      gradient: 'from-orange-600 to-red-600', 
      glow: 'from-orange-500/30 to-red-500/30',
      text: 'text-orange-100'
    },
    medium: {
      gradient: 'from-yellow-600 to-orange-600',
      glow: 'from-yellow-500/30 to-orange-500/30', 
      text: 'text-yellow-100'
    }
  };

  const style = priorityStyles[emergency.priority];

  return (
    <div className="relative">
      {/* Animated glow effect */}
      <div className={`absolute -inset-1 bg-gradient-to-r ${style.glow} rounded-2xl blur-lg animate-pulse`} />
      
      <Card className={`relative w-full border-0 bg-gradient-to-br ${style.gradient} shadow-2xl overflow-hidden`}>
        {/* Background pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-black/40" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_70%)]" />
        
        <div className="relative z-10">
          <CardHeader className="pb-6">
            <CardTitle className="flex items-center gap-4 text-2xl font-black text-white">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl text-3xl">
                {emergency.icon}
              </div>
              <div>
                {emergency.title}
                <div className={`text-xs font-medium uppercase tracking-wider mt-1 ${style.text}`}>
                  Priorytet: {emergency.priority === 'critical' ? 'Krytyczny' : emergency.priority === 'high' ? 'Wysoki' : 'Średni'}
                </div>
              </div>
            </CardTitle>
            <CardDescription className="text-lg font-semibold text-white/90 mt-2">
              {emergency.description}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Instructions with modern styling */}
            <div className="p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-white/20 rounded-xl">
                  <AlertTriangle className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">Instrukcje postępowania</h3>
              </div>
              
              <div className="space-y-4">
                {emergency.instructions.map((instruction, index) => (
                  <div key={index} className="flex items-start gap-4 p-4 bg-white/10 rounded-xl border border-white/10">
                    <div className="flex-shrink-0 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                      <span className="font-bold text-white text-sm">{index + 1}</span>
                    </div>
                    <p className="text-white font-medium leading-relaxed">{instruction}</p>
                  </div>
                ))}
              </div>
            </div>

            {emergency.shouldEvacuate && (
              <Button 
                onClick={onFindShelter}
                className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 text-white font-bold py-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-xl group-hover:bg-white/30 transition-colors duration-300">
                    <Navigation className="w-6 h-6" />
                  </div>
                  <span className="text-lg">Znajdź najbliższe schronienie</span>
                </div>
              </Button>
            )}
          </CardContent>
        </div>
      </Card>
    </div>
  );
}
