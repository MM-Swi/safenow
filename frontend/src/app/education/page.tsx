'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { EmergencyModeToggle } from '@/components/EmergencyModeToggle';
import { EmergencyEducationCard } from '@/components/EmergencyEducationCard';
import Navigation from '@/components/Navigation';
import { useEmergencyEducation } from '@/hooks/useApi';
import { HazardType } from '@/types/api';
import { ArrowLeft, BookOpen, Shield, AlertTriangle, Loader2 } from 'lucide-react';


export default function EducationPage() {
  const [isEmergencyMode, setIsEmergencyMode] = useState(false);
  const router = useRouter();
  
  // Fetch emergency education data from backend
  const { data: educationData, isLoading, error } = useEmergencyEducation();

  // Debug logging
  console.log('Education Page Debug:', {
    educationData: educationData?.length,
    isLoading,
    error
  });

  const handleEmergencyToggle = (isEmergency: boolean) => {
    setIsEmergencyMode(isEmergency);
    if (isEmergency) {
      router.push('/emergency');
    }
  };

  const handleBackToHome = () => {
    router.push('/');
  };

  const handleEmergencySelect = (hazardType: HazardType) => {
    // Use hazard type directly for routing - convert to lowercase with underscores
    router.push(`/education/${hazardType.toLowerCase().replace(/\s+/g, '_')}`);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Ładowanie danych edukacyjnych...</h2>
          <p className="text-gray-600">Pobieramy najnowsze informacje o bezpieczeństwie</p>
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
          <p className="text-gray-600 mb-4">Nie udało się pobrać danych edukacyjnych</p>
          <Button onClick={() => window.location.reload()}>Spróbuj ponownie</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      <Navigation />
      
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-indigo-400/20 to-pink-600/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}} />
      </div>
      
      <EmergencyModeToggle 
        isEmergencyMode={isEmergencyMode} 
        onToggle={handleEmergencyToggle} 
      />
      
      <div className="relative z-10 container mx-auto px-4 pt-24 pb-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button 
            onClick={handleBackToHome}
            variant="outline"
            size="sm"
            className="bg-white/80 backdrop-blur-sm hover:bg-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Powrót
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl shadow-lg">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-black bg-gradient-to-r from-gray-900 to-blue-800 bg-clip-text text-transparent">
              Sekcja edukacyjna
            </h1>
          </div>
        </div>

        {/* Introduction */}
        <Card className="mb-12 border-0 bg-white/80 backdrop-blur-sm shadow-xl">
          <CardContent className="p-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Wybierz typ sytuacji kryzysowej
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Poznaj szczegółowe informacje o różnych typach zagrożeń i naucz się jak się na nie przygotować. 
                Każda sekcja zawiera praktyczne wskazówki, kroki przygotowawcze i oznaki ostrzegawcze.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Emergency Types Grid - Using Backend Data */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
          {educationData?.map((data) => {
            return (
              <EmergencyEducationCard
                key={data.hazard_type}
                data={data}
                onClick={() => handleEmergencySelect(data.hazard_type)}
              />
            );
          })}
        </div>

        {/* Emergency Contact Reminder */}
        <Card className="border-0 bg-gradient-to-r from-red-500 to-pink-600 shadow-2xl">
          <CardContent className="p-8">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-4">Pamiętaj!</h3>
              <p className="text-red-100 text-lg mb-6">
                W przypadku prawdziwej sytuacji kryzysowej natychmiast dzwoń pod numer alarmowy
              </p>
              <div className="text-6xl font-black text-white drop-shadow-lg">112</div>
              <div className="text-white/80 text-lg font-medium mt-2">Dostępny 24/7</div>
            </div>
          </CardContent>
        </Card>

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
