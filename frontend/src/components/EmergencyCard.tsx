'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmergencyData } from '@/types/emergency';
import { Alert } from '@/types/api';
import { useSafetyInstructions, useVoteOnAlert } from '@/hooks/useApi';
import { AlertTriangle, Navigation, ChevronDown, ChevronUp, Info, Loader2, AlertCircle, ThumbsUp, ThumbsDown, Users } from 'lucide-react';
import { 
  getHazardTypeDisplay, 
  getSeverityDisplay, 
  getHazardTypeIcon,
  formatDistance,
  formatTimeUntilExpiry
} from '@/lib/utils/api';

interface EmergencyCardProps {
  emergency?: EmergencyData;
  alert?: Alert;
  onFindShelter?: () => void;
  nearestShelterETA?: number; // in seconds, for safety instructions context
  defaultExpanded?: boolean; // whether to show expanded by default
}

export function EmergencyCard({ emergency, alert, onFindShelter, nearestShelterETA, defaultExpanded = false }: EmergencyCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  
  // Use alert data if provided, otherwise fall back to emergency data
  const isAlertMode = !!alert;
  const hazardType = alert?.hazard_type;
  
  // Voting functionality
  const voteOnAlertMutation = useVoteOnAlert();
  
  const handleVote = (voteType: 'UPVOTE' | 'DOWNVOTE') => {
    if (!alert?.id) return;
    
    voteOnAlertMutation.mutate(
      { alertId: alert.id, voteType },
      {
        onSuccess: () => {
          // Vote submitted successfully
        },
        onError: (error) => {
          console.error('Failed to vote:', error);
          // You could show a toast notification here
        }
      }
    );
  };
  
  // Fetch safety instructions when expanded and in alert mode
  const { 
    data: safetyInstructions, 
    isLoading: isLoadingInstructions, 
    error: instructionsError 
  } = useSafetyInstructions(
    {
      hazard_type: hazardType!,
      eta_seconds: nearestShelterETA
    },
    isExpanded && isAlertMode && !!hazardType
  );
  const priorityStyles = {
    CRITICAL: {
      gradient: 'from-red-600 to-pink-600',
      glow: 'from-red-500/30 to-pink-500/30',
      text: 'text-red-100'
    },
    HIGH: {
      gradient: 'from-orange-600 to-red-600', 
      glow: 'from-orange-500/30 to-red-500/30',
      text: 'text-orange-100'
    },
    MEDIUM: {
      gradient: 'from-yellow-600 to-orange-600',
      glow: 'from-yellow-500/30 to-orange-500/30', 
      text: 'text-yellow-100'
    },
    LOW: {
      gradient: 'from-blue-600 to-indigo-600',
      glow: 'from-blue-500/30 to-indigo-500/30', 
      text: 'text-blue-100'
    },
    // Legacy support for EmergencyData priority format
    critical: {
      gradient: 'from-red-600 to-pink-600',
      glow: 'from-red-500/30 to-pink-500/30',
      text: 'text-red-100'
    },
    high: {
      gradient: 'from-orange-600 to-red-600', 
      glow: 'from-orange-500/30 to-red-500/30',
      text: 'text-orange-100'
    },
    medium: {
      gradient: 'from-yellow-600 to-orange-600',
      glow: 'from-yellow-500/30 to-orange-500/30', 
      text: 'text-yellow-100'
    }
  };

  // Determine which data to use and get appropriate style
  const priority = alert?.severity || emergency?.priority || 'MEDIUM';
  const style = priorityStyles[priority as keyof typeof priorityStyles] || priorityStyles.MEDIUM;
  
  // Get display data based on mode
  const displayData = isAlertMode && alert ? {
    title: `${getSeverityDisplay(alert.severity)} - ${getHazardTypeDisplay(alert.hazard_type)}`,
    description: `Odległość: ${formatDistance(alert.distance_km)} • Wygasa za: ${formatTimeUntilExpiry(alert.valid_until)}`,
    icon: getHazardTypeIcon(alert.hazard_type),
    instructions: emergency?.instructions || [],
    shouldEvacuate: alert.severity === 'CRITICAL' || alert.severity === 'HIGH'
  } : {
    title: emergency?.title || 'Nieznane zagrożenie',
    description: emergency?.description || '',
    icon: emergency?.icon || '⚠️',
    instructions: emergency?.instructions || [],
    shouldEvacuate: emergency?.shouldEvacuate || false
  };
  
  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="relative">
      {/* Animated glow effect */}
      <div className={`absolute -inset-1 bg-gradient-to-r ${style.glow} rounded-2xl blur-lg animate-pulse`} />
      
      <Card className={`relative w-full border-0 bg-gradient-to-br ${style.gradient} shadow-2xl overflow-hidden ${isAlertMode ? 'cursor-pointer hover:scale-[1.02] transition-transform duration-200' : ''}`}>
        {/* Background pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-black/40" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_70%)]" />
        
        <div className="relative z-10">
          <CardHeader 
            className={`pb-6 ${isAlertMode ? 'cursor-pointer' : ''}`}
            onClick={isAlertMode ? handleToggleExpand : undefined}
          >
            <CardTitle className="flex items-center gap-4 text-2xl font-black text-white">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl text-3xl">
                {displayData.icon}
              </div>
              <div className="flex-1">
                {displayData.title}
                <div className={`text-xs font-medium uppercase tracking-wider mt-1 ${style.text}`}>
                  {isAlertMode ? (
                    `Priorytet: ${alert?.severity === 'CRITICAL' ? 'Krytyczny' : alert?.severity === 'HIGH' ? 'Wysoki' : alert?.severity === 'MEDIUM' ? 'Średni' : 'Niski'}`
                  ) : (
                    `Priorytet: ${emergency?.priority === 'critical' ? 'Krytyczny' : emergency?.priority === 'high' ? 'Wysoki' : 'Średni'}`
                  )}
                </div>
              </div>
              {isAlertMode && (
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl">
                    <Info className="h-5 w-5 text-white" />
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-6 w-6 text-white" />
                  ) : (
                    <ChevronDown className="h-6 w-6 text-white" />
                  )}
                </div>
              )}
            </CardTitle>
            <CardDescription className="text-lg font-semibold text-white/90 mt-2">
              {displayData.description}
            </CardDescription>
            {isAlertMode && !isExpanded && (
              <div className="text-sm text-white/70 mt-2 flex items-center gap-2">
                <Info className="h-4 w-4" />
                Kliknij aby zobaczyć instrukcje bezpieczeństwa
              </div>
            )}
          </CardHeader>
          
          {/* Expandable Instructions Section */}
          {(isExpanded || !isAlertMode) && (
            <CardContent className="space-y-6">
              {/* Instructions with modern styling */}
              <div className="p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-white/20 rounded-xl">
                    <AlertTriangle className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Instrukcje postępowania</h3>
                </div>
                
                {/* Loading state for safety instructions */}
                {isAlertMode && isLoadingInstructions && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 text-white animate-spin" />
                    <span className="ml-2 text-white">Ładowanie instrukcji...</span>
                  </div>
                )}
                
                {/* Error state for safety instructions */}
                {isAlertMode && instructionsError && (
                  <div className="flex items-center gap-3 p-4 bg-red-500/20 rounded-xl border border-red-400/30">
                    <AlertCircle className="h-6 w-6 text-red-200" />
                    <span className="text-red-200">Nie udało się załadować instrukcji bezpieczeństwa</span>
                  </div>
                )}
                
                {/* Safety instructions from backend */}
                {isAlertMode && safetyInstructions && !isLoadingInstructions && (
                  <div className="space-y-6">
                    {/* What to do */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        Co robić:
                      </h4>
                      {safetyInstructions.steps.map((step, index) => (
                        <div key={index} className="flex items-start gap-4 p-4 bg-white/10 rounded-xl border border-white/10">
                          <div className="flex-shrink-0 w-8 h-8 bg-green-500/30 rounded-full flex items-center justify-center">
                            <span className="font-bold text-white text-sm">{index + 1}</span>
                          </div>
                          <p className="text-white font-medium leading-relaxed">{step}</p>
                        </div>
                      ))}
                    </div>
                    
                    {/* What NOT to do */}
                    {safetyInstructions.do_not.length > 0 && (
                      <div className="space-y-4">
                        <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                          <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                          Czego NIE robić:
                        </h4>
                        {safetyInstructions.do_not.map((dont, index) => (
                          <div key={index} className="flex items-start gap-4 p-4 bg-red-500/20 rounded-xl border border-red-400/30">
                            <div className="flex-shrink-0 w-8 h-8 bg-red-500/30 rounded-full flex items-center justify-center">
                              <AlertCircle className="h-4 w-4 text-white" />
                            </div>
                            <p className="text-white font-medium leading-relaxed">{dont}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* ETA hint */}
                    {safetyInstructions.eta_hint && (
                      <div className="p-4 bg-blue-500/20 rounded-xl border border-blue-400/30">
                        <div className="flex items-center gap-2 mb-2">
                          <Navigation className="h-5 w-5 text-blue-200" />
                          <span className="font-semibold text-blue-200">Informacja o ewakuacji:</span>
                        </div>
                        <p className="text-blue-100">{safetyInstructions.eta_hint}</p>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Fallback to static instructions for non-alert mode or when no backend data */}
                {(!isAlertMode || (!safetyInstructions && !isLoadingInstructions && !instructionsError)) && displayData.instructions.length > 0 && (
                  <div className="space-y-4">
                    {displayData.instructions.map((instruction, index) => (
                      <div key={index} className="flex items-start gap-4 p-4 bg-white/10 rounded-xl border border-white/10">
                        <div className="flex-shrink-0 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                          <span className="font-bold text-white text-sm">{index + 1}</span>
                        </div>
                        <p className="text-white font-medium leading-relaxed">{instruction}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {displayData.shouldEvacuate && (
                <Button 
                  onClick={onFindShelter}
                  className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 text-white font-bold py-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-xl group-hover:bg-white/30 transition-colors duration-300">
                      <Navigation className="w-6 h-6" />
                    </div>
                    <span className="text-lg">Znajdź najbliższe schronienie</span>
                  </div>
                </Button>
              )}
              
              {/* Voting Section - Only for alerts */}
              {isAlertMode && alert && (
                <div className="p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                  <div className="space-y-4">
                    <div className="text-center">
                      <h4 className="text-white font-semibold mb-2 flex items-center justify-center gap-2">
                        <Users className="w-4 h-4" />
                        Czy to prawdziwe zagrożenie?
                      </h4>
                      <p className="text-white/70 text-sm mb-4">
                        Pomóż innym użytkownikom weryfikując ten alert
                      </p>
                    </div>
                    
                    {/* Vote Buttons */}
                    <div className="flex gap-3">
                      <Button
                        onClick={() => handleVote('UPVOTE')}
                        disabled={voteOnAlertMutation.isPending}
                        className={`flex-1 ${
                          alert.vote_summary?.user_vote === 'UPVOTE'
                            ? 'bg-green-600 hover:bg-green-700'
                            : 'bg-white/20 hover:bg-green-600/30'
                        } backdrop-blur-sm border border-white/30 text-white font-medium py-3 rounded-xl transition-all duration-300`}
                      >
                        <div className="flex items-center justify-center gap-2">
                          <ThumbsUp className="w-4 h-4" />
                          <span>Prawda</span>
                          <span className="bg-white/20 px-2 py-1 rounded-full text-xs">
                            {alert.vote_summary?.upvotes || 0}
                          </span>
                        </div>
                      </Button>
                      
                      <Button
                        onClick={() => handleVote('DOWNVOTE')}
                        disabled={voteOnAlertMutation.isPending}
                        className={`flex-1 ${
                          alert.vote_summary?.user_vote === 'DOWNVOTE'
                            ? 'bg-red-600 hover:bg-red-700'
                            : 'bg-white/20 hover:bg-red-600/30'
                        } backdrop-blur-sm border border-white/30 text-white font-medium py-3 rounded-xl transition-all duration-300`}
                      >
                        <div className="flex items-center justify-center gap-2">
                          <ThumbsDown className="w-4 h-4" />
                          <span>Fałsz</span>
                          <span className="bg-white/20 px-2 py-1 rounded-full text-xs">
                            {alert.vote_summary?.downvotes || 0}
                          </span>
                        </div>
                      </Button>
                    </div>
                    
                    {/* Vote Summary */}
                    <div className="text-center text-white/70 text-sm">
                      <p>
                        Łącznie głosów: {alert.vote_summary?.total || 0} | 
                        Wynik weryfikacji: {alert.verification_score || 0}
                      </p>
                      {alert.is_official && (
                        <p className="text-yellow-300 font-medium mt-1">
                          ⭐ Alert oficjalny
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Emergency contact reminder */}
              <div className="p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                <div className="text-center">
                  <p className="text-white/90 text-sm mb-2">W nagłych wypadkach dzwoń:</p>
                  <p className="text-white font-bold text-2xl">112</p>
                </div>
              </div>
            </CardContent>
          )}
        </div>
      </Card>
    </div>
  );
}
