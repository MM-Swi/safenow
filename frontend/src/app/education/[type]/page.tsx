'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';

import { useEmergencyEducation, useSafetyInstructions } from '@/hooks/useApi';
import { HazardType } from '@/types/api';
import { ArrowLeft, BookOpen, Lightbulb, CheckCircle, AlertTriangle, Shield, Phone, Loader2 } from 'lucide-react';

// Generate color class based on priority
const getColorClass = (priority: string) => {
  switch (priority) {
    case 'critical':
      return 'from-red-600 to-pink-600';
    case 'high':
      return 'from-orange-600 to-red-600';
    case 'medium':
      return 'from-yellow-600 to-orange-600';
    case 'low':
      return 'from-blue-600 to-cyan-600';
    default:
      return 'from-gray-600 to-gray-800';
  }
};

export default function EmergencyDetailPage() {
  const [isEmergencyMode, setIsEmergencyMode] = useState(false);
  const router = useRouter();
  const params = useParams();
  const hazardTypeParam = params.type as string;

  // Convert URL param back to hazard type
  const convertUrlToHazardType = (urlParam: string): HazardType => {
    const upperParam = urlParam.toUpperCase();
    
    // Special cases that use spaces in backend
    const spaceBasedTypes: Record<string, string> = {
      'CHEMICAL_WEAPON': 'CHEMICAL WEAPON',
      'UNMARKED_SOLDIERS': 'UNMARKED SOLDIERS', 
      'TERRORIST_ATTACK': 'TERRORIST ATTACK',
      'MASS_POISONING': 'MASS POISONING',
      'CYBER_ATTACK': 'CYBER ATTACK'
    };
    
    return (spaceBasedTypes[upperParam] || upperParam) as HazardType;
  };
  
  const hazardType = convertUrlToHazardType(hazardTypeParam);

  // Fetch emergency education data from backend
  const { data: educationData, isLoading, error } = useEmergencyEducation();
  
  // Find the education data for this specific hazard type
  const emergency = educationData?.find(data => 
    data.hazard_type === hazardType
  );
  
  // Fetch safety instructions from backend (like in /emergency)
  const { data: safetyInstructions, isLoading: instructionsLoading, error: instructionsError } = useSafetyInstructions(
    { hazard_type: emergency?.hazard_type || 'AIR_RAID', eta_seconds: 0 },
    !!emergency?.hazard_type
  );

  const handleEmergencyToggle = (isEmergency: boolean) => {
    setIsEmergencyMode(isEmergency);
    if (isEmergency) {
      router.push('/emergency');
    }
  };

  const handleBackToEducation = () => {
    router.push('/education');
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Ładowanie materiału edukacyjnego...</h2>
          <p className="text-gray-600">Pobieramy szczegółowe informacje</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Błąd ładowania danych</h2>
          <p className="text-gray-600 mb-4">Nie udało się pobrać materiału edukacyjnego</p>
          <Button onClick={() => window.location.reload()}>Spróbuj ponownie</Button>
        </div>
      </div>
    );
  }

  if (!emergency) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Nie znaleziono materiału</h2>
          <p className="text-gray-600 mb-4">Przepraszamy, nie możemy znaleźć tego materiału edukacyjnego.</p>
          <Button onClick={() => router.push('/education')}>
            Powrót do sekcji edukacyjnej
          </Button>
        </div>
      </div>
    );
  }

  const colorClass = getColorClass(emergency.priority);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-indigo-400/20 to-pink-600/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}} />
      </div>
      

      
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button 
            onClick={handleBackToEducation}
            variant="outline"
            size="sm"
            className="bg-white/80 backdrop-blur-sm hover:bg-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Powrót
          </Button>
          <div className="flex items-center gap-3">
            <div className={`p-3 bg-gradient-to-br ${colorClass} rounded-2xl shadow-lg`}>
              <span className="text-2xl">{emergency.icon}</span>
            </div>
            <h1 className="text-3xl font-black bg-gradient-to-r from-gray-900 to-blue-800 bg-clip-text text-transparent">
              {emergency.title}
            </h1>
          </div>
        </div>

        <div className="max-w-6xl mx-auto space-y-8">
          {/* Main Overview */}
          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-4 text-2xl">
                <div className={`p-3 bg-gradient-to-br ${colorClass} rounded-2xl`}>
                  <span className="text-3xl">{emergency.icon}</span>
                </div>
                <div>
                  {emergency.title}
                  <div className={`text-xs font-medium uppercase tracking-wider mt-1 ${
                    emergency.priority === 'critical' ? 'text-red-600' : 
                    emergency.priority === 'high' ? 'text-orange-600' : 
                    emergency.priority === 'medium' ? 'text-yellow-600' : 'text-blue-600'
                  }`}>
                    Priorytet: {emergency.priority === 'critical' ? 'Krytyczny' : 
                               emergency.priority === 'high' ? 'Wysoki' : 
                               emergency.priority === 'medium' ? 'Średni' : 'Niski'}
                  </div>
                </div>
              </CardTitle>
              <CardDescription className="text-lg font-medium text-gray-700">
                {emergency.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed text-lg">
                Poznaj szczegółowe informacje o tym typie zagrożenia, w tym praktyczne wskazówki, 
                oznaki ostrzegawcze i kroki przygotowawcze.
              </p>
            </CardContent>
          </Card>

          {/* Emergency Instructions */}
          <Card className={`border-0 bg-gradient-to-br ${colorClass} shadow-2xl`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl text-white">
                <div className="p-2 bg-white/20 rounded-xl">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                Instrukcje postępowania w sytuacji kryzysowej
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {instructionsLoading ? (
                <div className="p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 flex items-center gap-3">
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                  <p className="text-white font-medium">Ładowanie instrukcji...</p>
                </div>
              ) : instructionsError ? (
                <div className="p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                  <p className="text-white font-medium leading-relaxed">
                    Nie udało się załadować instrukcji bezpieczeństwa. Spróbuj ponownie później.
                  </p>
                </div>
              ) : safetyInstructions ? (
                <>
                  {/* What to do - Backend Instructions */}
                  {safetyInstructions.steps && safetyInstructions.steps.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-white font-semibold text-lg flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-300" />
                        Co robić:
                      </h4>
                      {safetyInstructions.steps.map((step: string, index: number) => (
                        <div key={index} className="flex items-start gap-4 p-4 bg-green-500/10 backdrop-blur-sm rounded-xl border border-green-300/20">
                          <div className="flex-shrink-0 w-8 h-8 bg-green-500/30 rounded-full flex items-center justify-center">
                            <span className="font-bold text-white text-sm">{index + 1}</span>
                          </div>
                          <p className="text-white font-medium leading-relaxed">{step}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* What NOT to do - Backend Instructions */}
                  {safetyInstructions.do_not && safetyInstructions.do_not.length > 0 && (
                    <div className="space-y-3 mt-6">
                      <h4 className="text-white font-semibold text-lg flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-300" />
                        Czego NIE robić:
                      </h4>
                      {safetyInstructions.do_not.map((warning: string, index: number) => (
                        <div key={index} className="flex items-start gap-4 p-4 bg-red-500/10 backdrop-blur-sm rounded-xl border border-red-300/20">
                          <AlertTriangle className="w-5 h-5 text-red-300 mt-0.5 flex-shrink-0" />
                          <p className="text-white font-medium leading-relaxed">{warning}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                  <p className="text-white font-medium leading-relaxed">
                    Szczegółowe instrukcje postępowania będą dostępne wkrótce.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Tips Section - Using Backend Data */}
            <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-yellow-500 rounded-xl">
                    <Lightbulb className="w-5 h-5 text-white" />
                  </div>
                  Praktyczne wskazówki
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {emergency?.practical_tips?.map((tip: string, index: number) => (
                    <div key={index} className="flex items-start gap-3 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <p className="text-gray-700 leading-relaxed">{tip}</p>
                    </div>
                  )) || (
                    <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                      <p className="text-gray-700 leading-relaxed">Praktyczne wskazówki będą dostępne wkrótce.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Warning Signs - Using Backend Data */}
            <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-orange-500 rounded-xl">
                    <AlertTriangle className="w-5 h-5 text-white" />
                  </div>
                  Oznaki ostrzegawcze
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {emergency?.warning_signs?.map((sign: string, index: number) => (
                    <div key={index} className="flex items-start gap-3 p-4 bg-orange-50 rounded-xl border border-orange-200">
                      <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                      <p className="text-gray-700 leading-relaxed">{sign}</p>
                    </div>
                  )) || (
                    <div className="p-4 bg-orange-50 rounded-xl border border-orange-200">
                      <p className="text-gray-700 leading-relaxed">Oznaki ostrzegawcze będą dostępne wkrótce.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preparation Steps - Using Backend Data */}
          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 bg-blue-600 rounded-xl">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                Kroki przygotowawcze
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {emergency?.preparation_steps?.map((step: string, index: number) => (
                  <div key={index} className="flex items-start gap-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </div>
                    <p className="text-gray-700 leading-relaxed">{step}</p>
                  </div>
                )) || (
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <p className="text-gray-700 leading-relaxed">Kroki przygotowawcze będą dostępne wkrótce.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          <Card className="border-0 bg-gradient-to-r from-red-500 to-pink-600 shadow-2xl">
            <CardContent className="p-8">
              <div className="text-center">
                <div className="flex items-center justify-center gap-4 mb-4">
                  <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                    <Phone className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">Numer alarmowy</h3>
                </div>
                <p className="text-red-100 text-lg mb-6">
                  W przypadku prawdziwej sytuacji kryzysowej natychmiast dzwoń
                </p>
                <div className="text-6xl font-black text-white drop-shadow-lg mb-2">112</div>
                <div className="text-white/80 text-lg font-medium">Dostępny 24/7</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/60 backdrop-blur-sm rounded-full border border-white/20 shadow-lg">
            <Shield className="w-5 h-5 text-blue-600" />
            <span className="text-gray-700 font-medium">© 2024 SafeNow - Edukacja o bezpieczeństwie</span>
          </div>
        </div>
      </div>
    </div>
  );
}
