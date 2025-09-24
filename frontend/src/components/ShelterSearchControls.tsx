'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Slider } from './ui/Slider';
import { Settings, Shield } from 'lucide-react';

interface ShelterSearchControlsProps {
  currentRadius: number;
  onRadiusChange: (radius: number) => void;
  shelterCount: number;
  isLoading?: boolean;
}

export function ShelterSearchControls({
  currentRadius,
  onRadiusChange,
  shelterCount,
  isLoading = false,
}: ShelterSearchControlsProps) {
  const [tempRadius, setTempRadius] = useState(currentRadius);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleApplyRadius = () => {
    onRadiusChange(tempRadius);
    setIsExpanded(false);
  };

  const handleReset = () => {
    setTempRadius(500); // Default maximum radius
    onRadiusChange(500);
    setIsExpanded(false);
  };

  const getRadiusDescription = (radius: number) => {
    if (radius <= 25) return 'Lokalne schrony';
    if (radius <= 75) return 'Regionalne schrony';
    if (radius <= 150) return 'Schrony w szerokiej okolicy';
    if (radius <= 300) return 'Schrony międzyregionalne';
    return 'Maksymalny zasięg krajowy';
  };

  const getEmergencyScenario = (radius: number) => {
    if (radius <= 25) return 'Lokalne zagrożenia';
    if (radius <= 75) return 'Ewakuacja regionalna';
    if (radius <= 150) return 'Katastrofa naturalna';
    if (radius <= 300) return 'Kryzys międzyregionalny';
    return 'Sytuacja kryzysowa krajowa';
  };

  return (
    <Card className="border-blue-200 bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-50 shadow-xl rounded-2xl overflow-hidden">
      <CardHeader className="pb-6 px-6 pt-6">
        <CardTitle className="flex items-center gap-3 text-blue-900 text-xl font-bold mb-4">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg">
            <Shield className="w-6 h-6 text-white" />
          </div>
          🏠 Zasięg wyszukiwania schronów
        </CardTitle>

        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-bold text-blue-900 bg-gradient-to-r from-blue-200 to-cyan-200 px-4 py-2.5 rounded-xl shadow-sm border border-blue-300">
            🏠 {currentRadius}km • <span className="text-blue-700">{shelterCount} schronów</span>
            {isLoading && <span className="ml-2 animate-spin">⟳</span>}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="border-2 border-blue-400 text-blue-800 hover:bg-blue-200 hover:border-blue-500 font-semibold ml-3 px-4 py-2 rounded-xl shadow-sm transition-all duration-200"
          >
            <Settings className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Ustawienia</span>
          </Button>
        </div>

        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-blue-200">
          <div className="text-base font-semibold text-blue-900 mb-1">{getRadiusDescription(currentRadius)}</div>
          <div className="text-sm text-blue-700 font-medium">{getEmergencyScenario(currentRadius)}</div>
        </div>
      </CardHeader>

      {/* Expanded Controls */}
      {isExpanded && (
        <CardContent className="pt-0 px-6 pb-6 space-y-6">
          {/* Slider Section */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-5 border border-blue-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <label className="text-base font-semibold text-blue-900">
                Zasięg wyszukiwania
              </label>
              <span className="text-lg font-bold text-blue-700 bg-blue-100 px-3 py-1 rounded-lg">
                {tempRadius}km
              </span>
            </div>

            <Slider
              value={[tempRadius]}
              onValueChange={(value: number[]) => setTempRadius(value[0])}
              max={500}
              min={5}
              step={5}
              className="mb-4"
            />

            <div className="flex justify-between text-sm font-medium text-blue-600">
              <span>5km</span>
              <span>100km</span>
              <span>250km</span>
              <span>500km</span>
            </div>
          </div>

          {/* Current Selection Info */}
          <div className="bg-gradient-to-r from-blue-100 to-cyan-100 rounded-xl p-4 border border-blue-300">
            <div className="text-base font-bold text-blue-900 mb-2">
              {getRadiusDescription(tempRadius)}
            </div>
            <div className="text-sm text-blue-700 font-medium">
              Scenariusz: {getEmergencyScenario(tempRadius)}
            </div>
          </div>

          {/* Quick Presets */}
          <div>
            <div className="text-base font-semibold text-blue-900 mb-3">
              Szybkie ustawienia
            </div>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTempRadius(25)}
                className={`text-xs font-medium py-2 rounded-lg transition-all duration-200 hover:scale-105 ${
                  tempRadius === 25 
                    ? 'bg-gradient-to-r from-blue-200 to-cyan-200 border-blue-400 text-blue-900' 
                    : 'border-blue-300 text-blue-700 hover:bg-blue-50'
                }`}
              >
                25km
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTempRadius(50)}
                className={`text-xs font-medium py-2 rounded-lg transition-all duration-200 hover:scale-105 ${
                  tempRadius === 50 
                    ? 'bg-gradient-to-r from-blue-200 to-cyan-200 border-blue-400 text-blue-900' 
                    : 'border-blue-300 text-blue-700 hover:bg-blue-50'
                }`}
              >
                50km
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTempRadius(150)}
                className={`text-xs font-medium py-2 rounded-lg transition-all duration-200 hover:scale-105 ${
                  tempRadius === 150 
                    ? 'bg-gradient-to-r from-blue-200 to-cyan-200 border-blue-400 text-blue-900' 
                    : 'border-blue-300 text-blue-700 hover:bg-blue-50'
                }`}
              >
                150km
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTempRadius(300)}
                className={`text-xs font-medium py-2 rounded-lg transition-all duration-200 hover:scale-105 ${
                  tempRadius === 300 
                    ? 'bg-gradient-to-r from-blue-200 to-cyan-200 border-blue-400 text-blue-900' 
                    : 'border-blue-300 text-blue-700 hover:bg-blue-50'
                }`}
              >
                300km
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTempRadius(500)}
              className={`w-full text-xs font-medium py-2 rounded-lg transition-all duration-200 hover:scale-105 ${
                tempRadius === 500 
                  ? 'bg-gradient-to-r from-blue-200 to-cyan-200 border-blue-400 text-blue-900' 
                  : 'border-blue-300 text-blue-700 hover:bg-blue-50'
              }`}
            >
              500km - Maksymalne
            </Button>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleApplyRadius}
              className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-3 rounded-xl shadow-lg transition-all duration-200 hover:scale-105"
              disabled={tempRadius === currentRadius || isLoading}
            >
              Zastosuj zmiany
            </Button>
            <Button
              onClick={handleReset}
              variant="outline"
              className="border-2 border-blue-300 text-blue-700 hover:bg-blue-50 font-semibold px-6 py-3 rounded-xl transition-all duration-200 hover:scale-105"
              disabled={isLoading}
            >
              Reset
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
