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
    <Card className="border-orange-200 bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 shadow-xl rounded-2xl overflow-hidden">
      <CardHeader className="pb-6 px-6 pt-6">
        <CardTitle className="flex items-center gap-3 text-orange-900 text-xl font-bold mb-4">
          <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl shadow-lg">
            <AlertTriangle className="w-6 h-6 text-white" />
          </div>
          🔍 Zasięg wyszukiwania alertów
        </CardTitle>

        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-bold text-orange-900 bg-gradient-to-r from-orange-200 to-amber-200 px-4 py-2.5 rounded-xl shadow-sm border border-orange-300">
            {currentSearchRadius === 0 ? '🎯 Bezpośrednie' : `📍 ${currentSearchRadius}km`} • <span className="text-orange-700">{alertCount} alertów</span>
            {isLoading && <span className="ml-2 animate-spin">⟳</span>}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="border-2 border-orange-400 text-orange-800 hover:bg-orange-200 hover:border-orange-500 font-semibold ml-3 px-4 py-2 rounded-xl shadow-sm transition-all duration-200"
          >
            <Settings className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Ustawienia</span>
          </Button>
        </div>

        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-orange-200">
          <div className="text-base font-semibold text-orange-900 mb-1">{getRadiusDescription(currentSearchRadius)}</div>
          <div className="text-sm text-orange-700 font-medium">{getSearchMode(currentSearchRadius)}</div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0 px-6 pb-6 space-y-6">
          {/* Radius Slider */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-orange-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <label className="text-base font-semibold text-orange-900">
                Zasięg wyszukiwania
              </label>
              <span className="text-base font-bold text-orange-800 bg-orange-100 px-3 py-1 rounded-lg">
                {tempRadius === 0 ? 'Bezpośrednie' : `${tempRadius}km`}
              </span>
            </div>

            <Slider
              value={[tempRadius]}
              onValueChange={(value: number[]) => setTempRadius(value[0])}
              max={500}
              min={0}
              step={5}
              className="mb-4"
            />

            <div className="flex justify-between text-sm font-medium text-orange-600">
              <span>Bezpośrednie</span>
              <span>100km</span>
              <span>250km</span>
              <span>500km</span>
            </div>
          </div>

          {/* Radius Description */}
          <div className="bg-gradient-to-r from-white to-orange-50 rounded-2xl p-5 border border-orange-200 shadow-sm">
            <div className="text-base font-bold text-orange-900 mb-2">
              {getRadiusDescription(tempRadius)}
            </div>
            <div className="text-sm text-orange-700 font-medium">
              {getSearchMode(tempRadius)}
            </div>
          </div>

          {/* Quick Presets */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-orange-200 shadow-sm">
            <div className="text-base font-semibold text-orange-900 mb-4">
              Szybkie ustawienia
            </div>
            <div className="space-y-3">
              {/* Row 1 */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTempRadius(0)}
                  className={`text-xs font-medium py-3 px-2 rounded-xl transition-all duration-200 ${
                    tempRadius === 0 
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white border-orange-500 shadow-md' 
                      : 'border-orange-300 text-orange-700 hover:bg-orange-50 hover:border-orange-400'
                  }`}
                >
                  Bezpośrednie
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTempRadius(25)}
                  className={`text-xs font-medium py-3 px-2 rounded-xl transition-all duration-200 ${
                    tempRadius === 25 
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white border-orange-500 shadow-md' 
                      : 'border-orange-300 text-orange-700 hover:bg-orange-50 hover:border-orange-400'
                  }`}
                >
                  25km - Lokalne
                </Button>
              </div>
              
              {/* Row 2 */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTempRadius(75)}
                  className={`text-xs font-medium py-3 px-2 rounded-xl transition-all duration-200 ${
                    tempRadius === 75 
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white border-orange-500 shadow-md' 
                      : 'border-orange-300 text-orange-700 hover:bg-orange-50 hover:border-orange-400'
                  }`}
                >
                  75km - Domyślne
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTempRadius(150)}
                  className={`text-xs font-medium py-3 px-2 rounded-xl transition-all duration-200 ${
                    tempRadius === 150 
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white border-orange-500 shadow-md' 
                      : 'border-orange-300 text-orange-700 hover:bg-orange-50 hover:border-orange-400'
                  }`}
                >
                  150km - Szeroka
                </Button>
              </div>
              
              {/* Row 3 */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTempRadius(300)}
                  className={`text-xs font-medium py-3 px-2 rounded-xl transition-all duration-200 ${
                    tempRadius === 300 
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white border-orange-500 shadow-md' 
                      : 'border-orange-300 text-orange-700 hover:bg-orange-50 hover:border-orange-400'
                  }`}
                >
                  300km - Kraj
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTempRadius(500)}
                  className={`text-xs font-medium py-3 px-2 rounded-xl transition-all duration-200 ${
                    tempRadius === 500 
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white border-orange-500 shadow-md' 
                      : 'border-orange-300 text-orange-700 hover:bg-orange-50 hover:border-orange-400'
                  }`}
                >
                  500km - Max
                </Button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button
              onClick={handleApplyRadius}
              className="flex-1 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-semibold py-3 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105"
              disabled={tempRadius === currentSearchRadius || isLoading}
            >
              <Search className="w-5 h-5 mr-2" />
              Zastosuj
            </Button>
            <Button
              onClick={handleReset}
              variant="outline"
              className="border-2 border-orange-400 text-orange-700 hover:bg-orange-100 hover:border-orange-500 font-semibold py-3 px-6 rounded-xl shadow-sm transition-all duration-200"
              disabled={isLoading}
            >
              Reset
            </Button>
          </div>

          {/* Help Text */}
          <div className="bg-gradient-to-r from-orange-100 to-amber-100 border border-orange-200 rounded-2xl p-4 shadow-sm">
            <div className="text-sm text-orange-800 leading-relaxed">
              <div className="font-semibold mb-1">💡 Jak to działa:</div>
              <div className="mb-2"><strong>Bezpośrednie:</strong> Tylko alerty które bezpośrednio Cię dotyczą (jesteś w zasięgu alertu)</div>
              <div><strong>Zasięg wyszukiwania:</strong> Pokazuje także alerty w określonej odległości od Twojej lokalizacji</div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
