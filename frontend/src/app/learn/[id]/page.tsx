'use client';

import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';

import { learningContent } from '@/data/emergencies';
import { ArrowLeft, BookOpen, Lightbulb, CheckCircle, AlertTriangle, Shield } from 'lucide-react';
import { useState } from 'react';

export default function LearnDetailPage() {
  const [isEmergencyMode, setIsEmergencyMode] = useState(false);
  const router = useRouter();
  const params = useParams();
  const contentId = params.id as string;

  const content = learningContent.find(c => c.id === contentId);

  const handleEmergencyToggle = (isEmergency: boolean) => {
    setIsEmergencyMode(isEmergency);
    if (isEmergency) {
      router.push('/emergency');
    }
  };

  const handleBackToHome = () => {
    router.push('/');
  };

  if (!content) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Nie znaleziono materiału</h2>
          <p className="text-gray-600 mb-4">Przepraszamy, nie możemy znaleźć tego materiału edukacyjnego.</p>
          <Button onClick={handleBackToHome}>
            Powrót do strony głównej
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            onClick={handleBackToHome}
            variant="outline"
            size="sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Powrót
          </Button>
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Materiały edukacyjne</h1>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Title Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl">{content.title}</CardTitle>
              <CardDescription className="text-lg">{content.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">{content.content}</p>
            </CardContent>
          </Card>

          {/* Tips Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Lightbulb className="w-6 h-6 text-yellow-600" />
                Praktyczne wskazówki
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {content.tips.map((tip, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-700">{tip}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Preparation Steps */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Shield className="w-6 h-6 text-blue-600" />
                Kroki przygotowawcze
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {content.preparationSteps.map((step, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </div>
                    <p className="text-gray-700 pt-1">{step}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Warning Signs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
                Oznaki ostrzegawcze
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {content.warningSigns.map((sign, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg border-l-4 border-orange-400">
                    <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-700">{sign}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Emergency Contact Reminder */}
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="text-center">
                <h3 className="text-xl font-bold text-red-900 mb-2">Pamiętaj!</h3>
                <p className="text-red-700 mb-4">
                  W przypadku prawdziwej sytuacji kryzysowej natychmiast dzwoń pod numer alarmowy
                </p>
                <div className="text-4xl font-bold text-red-600">112</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-600 text-sm mt-8">
          <p>© 2024 SafeNow - Materiały edukacyjne o bezpieczeństwie</p>
        </div>
      </div>
    </div>
  );
}
