'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { EmergencyModeToggle } from '@/components/EmergencyModeToggle';
import { emergencyData } from '@/data/emergencies';
import { EmergencyType } from '@/types/emergency';
import { ArrowLeft, BookOpen, Shield, AlertTriangle, Flame, Droplets, Zap, Target, Mountain, Skull } from 'lucide-react';

const emergencyIcons: Record<EmergencyType, any> = {
  missile_attack: Target,
  drone_attack: Zap,
  flood: Droplets,
  wildfire: Flame,
  shooting: Target,
  earthquake: Mountain,
  chemical_emergency: Skull,
  biological_emergency: Shield
};

const emergencyColors: Record<EmergencyType, string> = {
  missile_attack: 'from-red-600 to-pink-600',
  drone_attack: 'from-purple-600 to-indigo-600',
  flood: 'from-blue-600 to-cyan-600',
  wildfire: 'from-orange-600 to-red-600',
  shooting: 'from-gray-700 to-gray-900',
  earthquake: 'from-amber-600 to-orange-600',
  chemical_emergency: 'from-green-600 to-emerald-600',
  biological_emergency: 'from-teal-600 to-green-600'
};

export default function EducationPage() {
  const [isEmergencyMode, setIsEmergencyMode] = useState(false);
  const router = useRouter();

  const handleEmergencyToggle = (isEmergency: boolean) => {
    setIsEmergencyMode(isEmergency);
    if (isEmergency) {
      router.push('/emergency');
    }
  };

  const handleBackToHome = () => {
    router.push('/');
  };

  const handleEmergencySelect = (emergencyType: EmergencyType) => {
    router.push(`/education/${emergencyType}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-indigo-400/20 to-pink-600/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}} />
      </div>
      
      <EmergencyModeToggle 
        isEmergencyMode={isEmergencyMode} 
        onToggle={handleEmergencyToggle} 
      />
      
      <div className="relative z-10 container mx-auto px-4 py-8">
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

        {/* Emergency Types Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
          {Object.entries(emergencyData).map(([type, data]) => {
            const IconComponent = emergencyIcons[type as EmergencyType];
            const colorClass = emergencyColors[type as EmergencyType];
            
            return (
              <Card 
                key={type}
                className="group border-0 bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-500 cursor-pointer hover:-translate-y-2"
                onClick={() => handleEmergencySelect(type as EmergencyType)}
              >
                <CardContent className="p-6">
                  <div className="text-center space-y-4">
                    {/* Icon */}
                    <div className="relative mx-auto w-16 h-16">
                      <div className={`absolute inset-0 bg-gradient-to-br ${colorClass} rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300`} />
                      <div className={`relative w-full h-full bg-gradient-to-br ${colorClass} rounded-2xl flex items-center justify-center shadow-lg`}>
                        <IconComponent className="w-8 h-8 text-white" />
                      </div>
                    </div>
                    
                    {/* Title */}
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-800 transition-colors duration-300">
                      {data.title}
                    </h3>
                    
                    {/* Priority Badge */}
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      data.priority === 'critical' 
                        ? 'bg-red-100 text-red-800' 
                        : data.priority === 'high'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      {data.priority === 'critical' ? 'Krytyczny' : data.priority === 'high' ? 'Wysoki' : 'Średni'}
                    </div>
                    
                    {/* Description */}
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {data.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
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
