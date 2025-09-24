'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Slider } from './ui/Slider';
import { Settings, MapPin, Clock, Shield } from 'lucide-react';

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
    <Card className="border-blue-300 bg-gradient-to-r from-blue-50 to-sky-50 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-blue-900 text-lg font-bold">
            <Shield className="w-6 h-6 text-blue-600" />
            🏠 Zasięg wyszukiwania schronów
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="text-sm font-semibold text-blue-800 bg-blue-100 px-3 py-1 rounded-full">
              🏠 {currentRadius}km • {shelterCount} schronów
              {isLoading && <span className="ml-1 animate-pulse">⟳</span>}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="border-blue-400 text-blue-800 hover:bg-blue-200 font-semibold"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="text-sm text-blue-700">
          <div className="font-medium">{getRadiusDescription(currentRadius)}</div>
          <div className="text-xs">{getEmergencyScenario(currentRadius)}</div>
        </div>
      </CardHeader>

      {/* Expanded Controls */}
      {isExpanded && (
        <CardContent className="pt-0 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-blue-900">
                  Zasięg wyszukiwania
                </label>
                <span className="text-sm text-blue-700">
                  {tempRadius}km
                </span>
              </div>

              <Slider
                value={[tempRadius]}
                onValueChange={(value: number[]) => setTempRadius(value[0])}
                max={500}
                min={5}
                step={5}
                className="mb-2"
              />

              <div className="flex justify-between text-xs text-blue-600">
                <span>5km</span>
                <span>100km</span>
                <span>250km</span>
                <span>500km</span>
              </div>
            </div>

            {/* Radius Description */}
            <div className="bg-white rounded-lg p-3 border border-blue-200">
              <div className="text-sm">
                <div className="font-medium text-blue-900 mb-1">
                  {getRadiusDescription(tempRadius)}
                </div>
                <div className="text-blue-700 text-xs">
                  Scenariusz: {getEmergencyScenario(tempRadius)}
                </div>
              </div>
            </div>

            {/* Quick Presets */}
            <div>
              <div className="text-sm font-medium text-blue-900 mb-2">
                Szybkie ustawienia
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTempRadius(25)}
                  className={`text-xs ${tempRadius === 25 ? 'bg-blue-100 border-blue-400' : ''}`}
                >
                  25km - Lokalne
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTempRadius(50)}
                  className={`text-xs ${tempRadius === 50 ? 'bg-blue-100 border-blue-400' : ''}`}
                >
                  50km - Domyślne
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTempRadius(150)}
                  className={`text-xs ${tempRadius === 150 ? 'bg-blue-100 border-blue-400' : ''}`}
                >
                  150km - Regionalne
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTempRadius(300)}
                  className={`text-xs ${tempRadius === 300 ? 'bg-blue-100 border-blue-400' : ''}`}
                >
                  300km - Krajowe
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTempRadius(500)}
                  className={`text-xs ${tempRadius === 500 ? 'bg-blue-100 border-blue-400' : ''}`}
                  style={{ gridColumn: 'span 2' }}
                >
                  500km - Maksymalne
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleApplyRadius}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={tempRadius === currentRadius || isLoading}
              >
                Zastosuj
              </Button>
              <Button
                onClick={handleReset}
                variant="outline"
                className="border-blue-300 text-blue-700"
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
