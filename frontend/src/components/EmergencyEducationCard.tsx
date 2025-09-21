'use client';

import { Card, CardContent } from '@/components/ui/Card';
import { AlertTriangle } from 'lucide-react';
import { EmergencyEducation } from '@/types/api';

interface EmergencyEducationCardProps {
  data: EmergencyEducation;
  onClick: () => void;
}

export function EmergencyEducationCard({ data, onClick }: EmergencyEducationCardProps) {
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

  const colorClass = getColorClass(data.priority);

  return (
    <Card 
      className="group border-0 bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-500 cursor-pointer hover:-translate-y-2"
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="text-center space-y-4">
          {/* Icon */}
          <div className="relative mx-auto w-16 h-16">
            <div className={`absolute inset-0 bg-gradient-to-br ${colorClass} rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300`} />
            <div className={`relative w-full h-full bg-gradient-to-br ${colorClass} rounded-2xl flex items-center justify-center shadow-lg`}>
              <span className="text-3xl">{data.icon}</span>
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
              : data.priority === 'medium'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-blue-100 text-blue-800'
          }`}>
            <AlertTriangle className="w-3 h-3 mr-1" />
            {data.priority === 'critical' ? 'Krytyczny' : 
             data.priority === 'high' ? 'Wysoki' : 
             data.priority === 'medium' ? 'Średni' : 'Niski'}
          </div>
          
          {/* Description */}
          <p className="text-sm text-gray-600 leading-relaxed">
            {data.description}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
