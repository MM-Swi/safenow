'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LearningContent } from '@/types/emergency';
import { BookOpen, Lightbulb, CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react';

interface LearningCardProps {
  content: LearningContent;
  onLearnMore: () => void;
}

export function LearningCard({ content, onLearnMore }: LearningCardProps) {
  return (
    <Card className="group relative w-full overflow-hidden bg-gradient-to-br from-white to-gray-50/50 backdrop-blur-sm border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Animated border */}
      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />
      <div className="absolute inset-[1px] rounded-lg bg-white" />
      
      <div className="relative z-10">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg group-hover:shadow-blue-500/25 transition-shadow duration-300">
              <BookOpen className="w-5 h-5" />
            </div>
            {content.title}
          </CardTitle>
          <CardDescription className="text-gray-600 font-medium">{content.description}</CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <p className="text-sm text-gray-700 leading-relaxed">{content.content}</p>
          
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200/50">
              <h4 className="flex items-center gap-2 font-semibold text-sm mb-3 text-yellow-800">
                <div className="p-1 rounded-lg bg-yellow-500 text-white">
                  <Lightbulb className="w-3 h-3" />
                </div>
                Wskazówki
              </h4>
              <ul className="space-y-2">
                {content.tips.slice(0, 2).map((tip, index) => (
                  <li key={index} className="flex items-start gap-3 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200/50">
              <h4 className="flex items-center gap-2 font-semibold text-sm mb-3 text-orange-800">
                <div className="p-1 rounded-lg bg-orange-500 text-white">
                  <AlertTriangle className="w-3 h-3" />
                </div>
                Oznaki ostrzegawcze
              </h4>
              <ul className="space-y-2">
                {content.warningSigns.slice(0, 2).map((sign, index) => (
                  <li key={index} className="flex items-start gap-3 text-sm">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
                    <span className="text-gray-700">{sign}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <Button 
            onClick={onLearnMore} 
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group/btn"
          >
            <span>Dowiedz się więcej</span>
            <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform duration-300" />
          </Button>
        </CardContent>
      </div>
    </Card>
  );
}
