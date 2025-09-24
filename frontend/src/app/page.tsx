'use client';


import { useRouter } from 'next/navigation';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';

import { EmergencyDashboard } from '@/components/EmergencyDashboard';
import { Shield, BookOpen, Phone, Activity } from 'lucide-react';

export default function Home() {
  const router = useRouter();



  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-indigo-400/20 to-pink-600/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}} />
      </div>
      

      
      <div className="relative z-10 container mx-auto px-4 pt-28 pb-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur-lg opacity-30 animate-pulse" />
              <div className="relative p-4 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl shadow-2xl">
                <Shield className="w-12 h-12 text-white" />
              </div>
            </div>
            <h1 className="text-5xl font-black bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
              SafeNow
            </h1>
          </div>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto font-medium leading-relaxed">
            Nowoczesna aplikacja edukacyjna o sytuacjach kryzysowych i bezpieczeństwie
          </p>
        </div>

        {/* Emergency Contact */}
        <Card className="mb-12 border-0 bg-gradient-to-r from-red-500 to-pink-600 shadow-2xl overflow-hidden">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                  <Phone className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Numer alarmowy</h3>
                  <p className="text-red-100 font-medium">W nagłych przypadkach dzwoń natychmiast</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-5xl font-black text-white drop-shadow-lg">112</div>
                <div className="text-white/80 text-sm font-medium">24/7</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Features Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {/* Education Section */}
          <Card className="group border-0 bg-gradient-to-br from-blue-500 to-purple-600 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 cursor-pointer"
                onClick={() => router.push('/education')}>
            <CardHeader className="p-8">
              <CardTitle className="flex items-center gap-4 text-2xl font-bold text-white mb-3">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl group-hover:bg-white/30 transition-colors duration-300">
                  <BookOpen className="w-8 h-8" />
                </div>
                Sekcja edukacyjna
              </CardTitle>
              <CardDescription className="text-blue-100 text-lg font-medium leading-relaxed">
                Kompleksowe materiały edukacyjne o przygotowaniu na różne sytuacje kryzysowe
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Emergency Dashboard */}
          <Card className="group border-0 bg-gradient-to-br from-orange-500 to-red-600 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 cursor-pointer"
                onClick={() => router.push('/emergency')}>
            <CardHeader className="p-8">
              <CardTitle className="flex items-center gap-4 text-2xl font-bold text-white mb-3">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl group-hover:bg-white/30 transition-colors duration-300">
                  <Activity className="w-8 h-8" />
                </div>
                Panel sytuacji kryzysowych
              </CardTitle>
              <CardDescription className="text-orange-100 text-lg font-medium leading-relaxed">
                Monitorowanie aktywnych alertów i najbliższych schronów w czasie rzeczywistym
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Live Emergency Dashboard */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Aktualny status bezpieczeństwa</h2>
            <p className="text-gray-600 text-lg">Dane w czasie rzeczywistym z systemu SafeNow</p>
          </div>
          <EmergencyDashboard />
        </div>



        {/* Footer */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/60 backdrop-blur-sm rounded-full border border-white/20 shadow-lg">
            <Shield className="w-5 h-5 text-blue-600" />
            <span className="text-gray-700 font-medium">© 2024 SafeNow - Nowoczesna edukacja o bezpieczeństwie</span>
          </div>
          <p className="text-gray-600 font-medium">
            W przypadku prawdziwej sytuacji kryzysowej natychmiast dzwoń <span className="font-bold text-red-600">112</span>
          </p>
        </div>
      </div>
    </div>
  );
}
