'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import type { UserAlert } from '@/types/api';
import { 
  useDashboardStats, 
  useUserAlerts, 
  useVotingHistory, 
  useRecentActivity, 
  useNotifications,
  useCreateAlert
} from '@/hooks/useApi';
import Navigation from '@/components/Navigation';
import ProtectedRoute from '@/components/ProtectedRoute';

import AlertCreationModal, { type AlertFormData } from '@/components/AlertCreationModal';
import AdminAlertPanel from '@/components/AdminAlertPanel';
import { 
  Bell, 
  AlertTriangle, 
  TrendingUp, 
  Activity,
  Shield,
  CheckCircle,
  Clock,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Plus,
  Loader2
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // API hooks
  const { data: stats, isLoading: statsLoading, error: statsError } = useDashboardStats();
  const { data: userAlerts = [], isLoading: alertsLoading, error: alertsError } = useUserAlerts();
  const { data: votingHistory = [], isLoading: votingLoading, error: votingError } = useVotingHistory();
  const { data: recentActivity = [], isLoading: activityLoading, error: activityError } = useRecentActivity();
  const { data: notifications = [], isLoading: notificationsLoading, error: notificationsError } = useNotifications();

  // Mutations
  const createAlertMutation = useCreateAlert();

  // Mock data fallback for development
  const mockUserAlerts: UserAlert[] = [
    {
      id: 1,
      hazard_type: 'FIRE',
      center_lat: 50.0647,
      center_lon: 19.9450,
      radius_m: 1000,
      severity: 'HIGH',
      status: 'VERIFIED',
      source: 'Pożar w centrum miasta',
      description: 'Duży pożar w centrum miasta, ewakuacja w toku',
      valid_until: '2025-01-20T12:30:00Z',
      created_at: '2025-01-20T10:30:00Z',
      created_by: 1,
      verification_score: 5,
      is_official: false,
      vote_summary: { upvotes: 8, downvotes: 3, total: 11 }
    },
    {
      id: 2,
      hazard_type: 'FLOOD',
      center_lat: 50.0647,
      center_lon: 19.9450,
      radius_m: 500,
      severity: 'MEDIUM',
      status: 'PENDING',
      source: 'Podtopienia na ul. Głównej',
      description: 'Podtopienia po intensywnych opadach deszczu',
      valid_until: '2025-01-21T10:15:00Z',
      created_at: '2025-01-21T08:15:00Z',
      created_by: 1,
      verification_score: 1,
      is_official: false,
      vote_summary: { upvotes: 2, downvotes: 1, total: 3 }
    }
  ];

  const mockVotingHistory = [
    {
      id: 1,
      alert_title: 'Awaria przemysłowa',
      vote_type: 'UPVOTE',
      voted_at: '2025-01-19T14:20:00Z',
      alert_status: 'VERIFIED'
    },
    {
      id: 2,
      alert_title: 'Burza z gradem',
      vote_type: 'DOWNVOTE',
      voted_at: '2025-01-18T16:45:00Z',
      alert_status: 'REJECTED'
    }
  ];

  const mockRecentActivity = [
    {
      id: 1,
      type: 'alert_created',
      message: 'Utworzyłeś nowy alert: "Pożar w centrum miasta"',
      timestamp: '2025-01-20T10:30:00Z'
    },
    {
      id: 2,
      type: 'vote_cast',
      message: 'Zagłosowałeś na alert: "Awaria przemysłowa"',
      timestamp: '2025-01-19T14:20:00Z'
    },
    {
      id: 3,
      type: 'alert_verified',
      message: 'Twój alert "Pożar w centrum miasta" został zweryfikowany',
      timestamp: '2025-01-20T15:45:00Z'
    }
  ];

  const profileCompletion = {
    total: 100,
    completed: 85,
    missing: ['phone_number', 'location_preferences']
  };

  // Handlers




  const handleCreateAlert = async (data: AlertFormData) => {
    try {
      // Transform form data to backend API format
      const alertData = {
        hazard_type: data.hazard_type,
        severity: data.severity,
        center_lat: data.latitude,
        center_lon: data.longitude,
        radius_m: data.radius,
        source: data.title || 'User Report', // Use title as source, fallback to default
        description: data.description || '', // Include description
        valid_minutes: 60, // Default to 1 hour
      };
      
      console.log('Creating alert with data:', alertData);
      await createAlertMutation.mutateAsync(alertData);
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error('Failed to create alert:', error);
      // Show error to user - you could add a toast notification here
      alert('Failed to create alert. Please check the console for details.');
    }
  };

  // Use real data or fallback to mock data
  const displayAlerts = userAlerts.length > 0 ? userAlerts : mockUserAlerts;
  const displayVotingHistory = votingHistory.length > 0 ? votingHistory : mockVotingHistory;
  const displayActivity = recentActivity.length > 0 ? recentActivity : mockRecentActivity;

  const calculatedStats = {
    alertsCreated: stats?.alerts_created || displayAlerts.length,
    votesCast: stats?.votes_cast || displayVotingHistory.length,
    verifiedAlerts: stats?.verified_alerts || displayAlerts.filter(alert => alert.status === 'VERIFIED').length,
    totalScore: stats?.total_score || displayAlerts.reduce((sum, alert) => sum + (alert.verification_score || 0), 0)
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'VERIFIED': return 'bg-green-100 text-green-800 border-green-200';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'REJECTED': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'VERIFIED': return <CheckCircle className="w-4 h-4" />;
      case 'PENDING': return <Clock className="w-4 h-4" />;
      case 'REJECTED': return <AlertTriangle className="w-4 h-4" />;
      default: return <Eye className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const tabs = [
    { id: 'overview', name: 'Przegląd', icon: Activity },
    { id: 'alerts', name: 'Moje alerty', icon: AlertTriangle },
    { id: 'voting', name: 'Historia głosów', icon: TrendingUp },
    { id: 'notifications', name: 'Powiadomienia', icon: Bell },
  ];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <Navigation />
        
        <div className="pt-28 pb-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                    Panel użytkownika
                  </h1>
                  <p className="text-gray-600 mt-2 text-sm sm:text-base">
                    Witaj ponownie, {user?.first_name || user?.username}! 
                    {user?.role === 'ADMIN' && <span className="block sm:inline ml-0 sm:ml-2 mt-1 sm:mt-0 px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">Administrator</span>}
                  </p>
                </div>
                <button 
                  onClick={() => setIsCreateModalOpen(true)}
                  className="group relative bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 sm:px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 w-full sm:w-auto"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-xl blur opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>
                  <div className="relative flex items-center justify-center space-x-2">
                    <Plus className="w-5 h-5" />
                    <span className="text-sm sm:text-base">Nowy alert</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Utworzone alerty</p>
                    {statsLoading ? (
                      <div className="flex items-center space-x-2">
                        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                        <span className="text-gray-400">Ładowanie...</span>
                      </div>
                    ) : statsError ? (
                      <p className="text-sm text-red-600">Błąd ładowania</p>
                    ) : (
                      <p className="text-3xl font-bold text-gray-900">{calculatedStats.alertsCreated}</p>
                    )}
                  </div>
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                    <AlertTriangle className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Oddane głosy</p>
                    <p className="text-3xl font-bold text-gray-900">{calculatedStats.votesCast}</p>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Zweryfikowane</p>
                    <p className="text-3xl font-bold text-gray-900">{calculatedStats.verifiedAlerts}</p>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Punkty zaufania</p>
                    <p className="text-3xl font-bold text-gray-900">{calculatedStats.totalScore}</p>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Completion */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Kompletność profilu</h3>
                <span className="text-sm text-gray-600">{profileCompletion.completed}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${profileCompletion.completed}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600">
                Uzupełnij brakujące informacje: numer telefonu, preferencje lokalizacji
              </p>
            </div>

            {/* Admin Panel - Only show for admin users */}
            {(user?.role === 'ADMIN') && (
              <div className="mb-8">
                <AdminAlertPanel />
              </div>
            )}

            {/* Tabs */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
              <div className="border-b border-gray-200">
                <nav className="flex overflow-x-auto scrollbar-hide px-4 sm:px-6">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-shrink-0 py-4 px-2 sm:px-4 border-b-2 font-medium text-xs sm:text-sm transition-all duration-300 ${
                          activeTab === tab.id
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2">
                          <Icon className="w-4 h-4" />
                          <span className="whitespace-nowrap">{tab.name}</span>
                        </div>
                      </button>
                    );
                  })}
                </nav>
              </div>

              <div className="p-6">
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900">Ostatnia aktywność</h3>
                    {activityLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                        <span className="ml-2 text-gray-600">Ładowanie aktywności...</span>
                      </div>
                    ) : activityError ? (
                      <div className="text-center py-12">
                        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                        <p className="text-red-600 mb-2">Nie udało się załadować aktywności</p>
                        <button 
                          onClick={() => window.location.reload()}
                          className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                        >
                          Spróbuj ponownie
                        </button>
                      </div>
                    ) : displayActivity.length === 0 ? (
                      <div className="text-center py-12">
                        <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">Brak ostatniej aktywności</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {displayActivity.map((activity) => (
                        <div key={activity.id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-xl">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Activity className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-900">{activity.message}</p>
                            <p className="text-xs text-gray-500 mt-1">{formatDate(activity.timestamp)}</p>
                          </div>
                        </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'alerts' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">Moje alerty</h3>
                      <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                        Zobacz wszystkie
                      </button>
                    </div>
                    {alertsLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                        <span className="ml-2 text-gray-600">Ładowanie alertów...</span>
                      </div>
                    ) : alertsError ? (
                      <div className="text-center py-12">
                        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                        <p className="text-red-600 mb-2">Nie udało się załadować alertów</p>
                        <button 
                          onClick={() => window.location.reload()}
                          className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                        >
                          Spróbuj ponownie
                        </button>
                      </div>
                    ) : displayAlerts.length === 0 ? (
                      <div className="text-center py-12">
                        <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 mb-2">Nie masz jeszcze żadnych alertów</p>
                        <button 
                          onClick={() => setIsCreateModalOpen(true)}
                          className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                        >
                          Utwórz pierwszy alert
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {displayAlerts.map((alert) => (
                        <div key={alert.id} className="group relative bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:border-gray-200 transition-all duration-300 transform hover:-translate-y-1">
                          {/* Background gradient overlay */}
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-purple-50/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          
                          <div className="relative">
                            {/* Header with status and hazard type */}
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center space-x-3">
                                <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold border-2 ${getStatusColor(alert.status)} shadow-sm`}>
                                  {getStatusIcon(alert.status)}
                                  <span className="ml-2">{alert.status}</span>
                                </span>
                                <div className="flex items-center space-x-2 px-3 py-1 bg-gray-100 rounded-full">
                                  <AlertTriangle className="w-4 h-4 text-gray-600" />
                                  <span className="text-sm font-medium text-gray-700">{alert.hazard_type}</span>
                                </div>
                              </div>
                              
                              {/* Verification score indicator */}
                              <div className="flex items-center space-x-2">
                                <div className="flex items-center space-x-1 px-3 py-1 bg-blue-50 rounded-full">
                                  <Shield className="w-4 h-4 text-blue-600" />
                                  <span className="text-sm font-medium text-blue-700">{alert.verification_score}</span>
                                </div>
                              </div>
                            </div>
                            
                            {/* Alert title and description */}
                            <div className="mb-4">
                              <h4 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-900 transition-colors duration-200">{alert.source}</h4>
                              {alert.description && (
                                <p className="text-gray-600 leading-relaxed">{alert.description}</p>
                              )}
                            </div>
                            
                            {/* Metadata and voting */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                              <div className="flex items-center space-x-1 text-sm text-gray-500">
                                <Clock className="w-4 h-4 flex-shrink-0" />
                                <span className="truncate">{formatDate(alert.created_at)}</span>
                              </div>
                              
                              {/* Voting summary */}
                              <div className="flex items-center space-x-3">
                                <div className="flex items-center space-x-2 px-3 py-2 bg-green-50 rounded-lg border border-green-100">
                                  <ThumbsUp className="w-4 h-4 text-green-600" />
                                  <span className="font-semibold text-green-700">{alert.vote_summary.upvotes}</span>
                                </div>
                                <div className="flex items-center space-x-2 px-3 py-2 bg-red-50 rounded-lg border border-red-100">
                                  <ThumbsDown className="w-4 h-4 text-red-600" />
                                  <span className="font-semibold text-red-700">{alert.vote_summary.downvotes}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'voting' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900">Historia głosowania</h3>
                    {votingLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                        <span className="ml-2 text-gray-600">Ładowanie historii głosów...</span>
                      </div>
                    ) : votingError ? (
                      <div className="text-center py-12">
                        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                        <p className="text-red-600 mb-2">Nie udało się załadować historii głosów</p>
                        <button 
                          onClick={() => window.location.reload()}
                          className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                        >
                          Spróbuj ponownie
                        </button>
                      </div>
                    ) : displayVotingHistory.length === 0 ? (
                      <div className="text-center py-12">
                        <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">Nie oddałeś jeszcze żadnych głosów</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {displayVotingHistory.map((vote) => (
                        <div key={vote.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                          <div className="flex items-center space-x-4">
                            <div className={`p-2 rounded-lg ${vote.vote_type === 'UPVOTE' ? 'bg-green-100' : 'bg-red-100'}`}>
                              {vote.vote_type === 'UPVOTE' ? 
                                <ThumbsUp className="w-4 h-4 text-green-600" /> : 
                                <ThumbsDown className="w-4 h-4 text-red-600" />
                              }
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {'alert_title' in vote ? vote.alert_title : vote.alert.title}
                              </p>
                              <p className="text-sm text-gray-600">{formatDate('voted_at' in vote ? vote.voted_at : vote.created_at)}</p>
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor('alert_status' in vote ? vote.alert_status : vote.alert.status)}`}>
                            {'alert_status' in vote ? vote.alert_status : vote.alert.status}
                          </span>
                        </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'notifications' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900">Centrum powiadomień</h3>
                    {notificationsLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                        <span className="ml-2 text-gray-600">Ładowanie powiadomień...</span>
                      </div>
                    ) : notificationsError ? (
                      <div className="text-center py-12">
                        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                        <p className="text-red-600 mb-2">Nie udało się załadować powiadomień</p>
                        <button 
                          onClick={() => window.location.reload()}
                          className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                        >
                          Spróbuj ponownie
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {notifications.length > 0 ? (
                        notifications.map((notification) => (
                          <div key={notification.id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-xl">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <Bell className="w-4 h-4 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{notification.title}</h4>
                              <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                              <p className="text-xs text-gray-500 mt-1">{formatDate(notification.created_at)}</p>
                            </div>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
                          </div>
                        ))
                      ) : (
                          <div className="text-center py-12">
                            <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600">Brak nowych powiadomień</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>



        {/* Alert Creation Modal */}
        <AlertCreationModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSave={handleCreateAlert}
        />
      </div>
    </ProtectedRoute>
  );
};

export default Dashboard;
