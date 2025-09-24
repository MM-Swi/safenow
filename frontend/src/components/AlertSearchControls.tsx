'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Slider } from './ui/Slider';
import { Settings, AlertTriangle, Search } from 'lucide-react';

interface AlertSearchControlsProps {
  currentSearchRadius: number;
  onSearchRadiusChange: (radius: number) => void;
  alertCount: number;
  isLoading?: boolean;
}

export function AlertSearchControls({
  currentSearchRadius,
  onSearchRadiusChange,
  alertCount,
  isLoading = false
}: AlertSearchControlsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [tempRadius, setTempRadius] = useState(currentSearchRadius);

  const handleApplyRadius = () => {
    onSearchRadiusChange(tempRadius);
    setIsExpanded(false);
  };

  const handleReset = () => {
    setTempRadius(500); // Default: maximum range
    onSearchRadiusChange(500);
    setIsExpanded(false);
  };

  const getRadiusDescription = (radius: number) => {
    if (radius === 0) return 'Tylko alerty które Cię dotyczą';
    if (radius <= 25) return 'Lokalne alerty';
    if (radius <= 75) return 'Regionalne alerty';
    if (radius <= 150) return 'Alerty w szerokiej okolicy';
    if (radius <= 300) return 'Alerty międzyregionalne';
    return 'Maksymalny zasięg krajowy';
  };

  const getSearchMode = (radius: number) => {
    if (radius === 0) return 'Tryb bezpieczeństwa';
    if (radius <= 25) return 'Świadomość lokalna';
    if (radius <= 75) return 'Świadomość regionalna';
    if (radius <= 150) return 'Świadomość szeroka';
    if (radius <= 300) return 'Świadomość międzyregionalna';
    return 'Świadomość krajowa';
  };

  return (
    <Card className="border-orange-300 bg-gradient-to-r from-orange-50 to-amber-50 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-orange-900 text-lg font-bold">
            <AlertTriangle className="w-6 h-6 text-orange-600" />
            🔍 Zasięg wyszukiwania alertów
          </CardTitle>

          <div className="flex items-center gap-2">
            <div className="text-sm font-semibold text-orange-800 bg-orange-100 px-3 py-1 rounded-full">
              {currentSearchRadius === 0 ? '🎯 Bezpośrednie' : `📍 ${currentSearchRadius}km`} • {alertCount} alertów
              {isLoading && <span className="ml-1 animate-pulse">⟳</span>}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="border-orange-400 text-orange-800 hover:bg-orange-200 font-semibold"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="text-sm text-orange-700">
          <div className="font-medium">{getRadiusDescription(currentSearchRadius)}</div>
          <div className="text-xs">{getSearchMode(currentSearchRadius)}</div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0 space-y-4">
          {/* Radius Slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-orange-900">
                Zasięg wyszukiwania
              </label>
              <span className="text-sm text-orange-700">
                {tempRadius === 0 ? 'Bezpośrednie' : `${tempRadius}km`}
              </span>
            </div>

            <Slider
              value={[tempRadius]}
              onValueChange={(value: number[]) => setTempRadius(value[0])}
              max={500}
              min={0}
              step={5}
              className="mb-2"
            />

            <div className="flex justify-between text-xs text-orange-600">
              <span>Bezpośrednie</span>
              <span>100km</span>
              <span>250km</span>
              <span>500km</span>
            </div>
          </div>

          {/* Radius Description */}
          <div className="bg-white rounded-lg p-3 border border-orange-200">
            <div className="text-sm">
              <div className="font-medium text-orange-900 mb-1">
                {getRadiusDescription(tempRadius)}
              </div>
              <div className="text-orange-700 text-xs">
                {getSearchMode(tempRadius)}
              </div>
            </div>
          </div>

          {/* Quick Presets */}
          <div>
            <div className="text-sm font-medium text-orange-900 mb-2">
              Szybkie ustawienia
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTempRadius(0)}
                className={`text-xs ${tempRadius === 0 ? 'bg-orange-100 border-orange-400' : ''}`}
              >
                Bezpośrednie
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTempRadius(25)}
                className={`text-xs ${tempRadius === 25 ? 'bg-orange-100 border-orange-400' : ''}`}
              >
                25km - Lokalne
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTempRadius(75)}
                className={`text-xs ${tempRadius === 75 ? 'bg-orange-100 border-orange-400' : ''}`}
              >
                75km - Domyślne
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTempRadius(150)}
                className={`text-xs ${tempRadius === 150 ? 'bg-orange-100 border-orange-400' : ''}`}
              >
                150km - Szeroka okolicy
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTempRadius(300)}
                className={`text-xs ${tempRadius === 300 ? 'bg-orange-100 border-orange-400' : ''}`}
              >
                300km - Międzyregionalne
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTempRadius(500)}
                className={`text-xs ${tempRadius === 500 ? 'bg-orange-100 border-orange-400' : ''}`}
              >
                500km - Maksymalne
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleApplyRadius}
              className="flex-1 bg-orange-600 hover:bg-orange-700"
              disabled={tempRadius === currentSearchRadius || isLoading}
            >
              <Search className="w-4 h-4 mr-2" />
              Zastosuj
            </Button>
            <Button
              onClick={handleReset}
              variant="outline"
              className="border-orange-300 text-orange-700 hover:bg-orange-100"
              disabled={isLoading}
            >
              Reset
            </Button>
          </div>

          {/* Help Text */}
          <div className="text-xs text-orange-600 bg-orange-100 p-2 rounded">
            <strong>Bezpośrednie:</strong> Tylko alerty które bezpośrednio Cię dotyczą (jesteś w zasięgu alertu)<br/>
            <strong>Zasięg wyszukiwania:</strong> Pokazuje także alerty w określonej odległości od Twojej lokalizacji
          </div>
        </CardContent>
      )}
    </Card>
  );
}
