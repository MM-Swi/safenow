'use client';

import React, { useState } from 'react';
import { useAdminAllAlerts, useBulkUpdateAlertStatus } from '@/hooks/useApi';
import { useAuth } from '@/hooks/useAuth';
import { UserAlert } from '@/types/api';
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Users,
  Calendar,
  MapPin
} from 'lucide-react';
import { getHazardTypeDisplay, getSeverityDisplay, formatTimeUntilExpiry } from '@/lib/utils/api';

const AdminAlertPanel: React.FC = () => {
  const { user } = useAuth();
  const { data: allAlerts = [], isLoading, error, refetch } = useAdminAllAlerts();
  const bulkUpdateMutation = useBulkUpdateAlertStatus();
  
  const [selectedAlerts, setSelectedAlerts] = useState<number[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Check if user is admin
  const isAdmin = user?.role === 'ADMIN' || user?.is_staff || user?.is_superuser;

  if (!isAdmin) {
    return null; // Don't show admin panel to non-admin users
  }

  // Filter alerts based on selected status
  const filteredAlerts = allAlerts.filter(alert => {
    if (filterStatus === 'ALL') return true;
    return alert.status === filterStatus;
  });

  // Group alerts by status for quick overview
  const alertsByStatus = allAlerts.reduce((acc, alert) => {
    acc[alert.status] = (acc[alert.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const handleSelectAlert = (alertId: number) => {
    setSelectedAlerts(prev => 
      prev.includes(alertId) 
        ? prev.filter(id => id !== alertId)
        : [...prev, alertId]
    );
  };

  const handleSelectAll = () => {
    if (selectedAlerts.length === filteredAlerts.length) {
      setSelectedAlerts([]);
    } else {
      setSelectedAlerts(filteredAlerts.map(alert => alert.id));
    }
  };

  const handleBulkStatusUpdate = async (status: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'ACTIVE') => {
    if (selectedAlerts.length === 0) return;

    try {
      await bulkUpdateMutation.mutateAsync({
        alert_ids: selectedAlerts,
        status
      });
      setSelectedAlerts([]);
      refetch();
    } catch (error) {
      console.error('Failed to update alert statuses:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'VERIFIED': return <CheckCircle className="w-4 h-4 text-blue-600" />;
      case 'PENDING': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'REJECTED': return <XCircle className="w-4 h-4 text-red-600" />;
      default: return <AlertTriangle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'VERIFIED': return 'bg-blue-100 text-blue-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Shield className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Panel Administratora</h2>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">Ładowanie alertów...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Shield className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Panel Administratora</h2>
        </div>
        <div className="text-center py-8">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-600">Błąd podczas ładowania alertów</p>
          <button 
            onClick={() => refetch()}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Spróbuj ponownie
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Shield className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Panel Administratora</h2>
        </div>
        <div className="text-sm text-gray-500">
          Łącznie: {allAlerts.length} alertów
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-yellow-50 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-800">Oczekujące</span>
          </div>
          <p className="text-xl font-bold text-yellow-900">{alertsByStatus.PENDING || 0}</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Zweryfikowane</span>
          </div>
          <p className="text-xl font-bold text-blue-900">{alertsByStatus.VERIFIED || 0}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">Aktywne</span>
          </div>
          <p className="text-xl font-bold text-green-900">{alertsByStatus.ACTIVE || 0}</p>
        </div>
        <div className="bg-red-50 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <XCircle className="w-4 h-4 text-red-600" />
            <span className="text-sm font-medium text-red-800">Odrzucone</span>
          </div>
          <p className="text-xl font-bold text-red-900">{alertsByStatus.REJECTED || 0}</p>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex items-center space-x-4">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="ALL">Wszystkie statusy</option>
            <option value="PENDING">Oczekujące</option>
            <option value="VERIFIED">Zweryfikowane</option>
            <option value="ACTIVE">Aktywne</option>
            <option value="REJECTED">Odrzucone</option>
          </select>
          
          <button
            onClick={handleSelectAll}
            className="px-3 py-2 text-sm text-blue-600 hover:text-blue-800"
          >
            {selectedAlerts.length === filteredAlerts.length ? 'Odznacz wszystkie' : 'Zaznacz wszystkie'}
          </button>
        </div>

        {selectedAlerts.length > 0 && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">
              Zaznaczono: {selectedAlerts.length}
            </span>
            <button
              onClick={() => handleBulkStatusUpdate('ACTIVE')}
              disabled={bulkUpdateMutation.isPending}
              className="px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              Aktywuj
            </button>
            <button
              onClick={() => handleBulkStatusUpdate('VERIFIED')}
              disabled={bulkUpdateMutation.isPending}
              className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Zweryfikuj
            </button>
            <button
              onClick={() => handleBulkStatusUpdate('REJECTED')}
              disabled={bulkUpdateMutation.isPending}
              className="px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              Odrzuć
            </button>
          </div>
        )}
      </div>

      {/* Alerts List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filteredAlerts.map((alert) => (
          <div
            key={alert.id}
            className={`border rounded-lg p-4 hover:bg-gray-50 transition-colors ${
              selectedAlerts.includes(alert.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
            }`}
          >
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                checked={selectedAlerts.includes(alert.id)}
                onChange={() => handleSelectAlert(alert.id)}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900">
                      {getHazardTypeDisplay(alert.hazard_type)}
                    </span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(alert.status)}`}>
                      {getStatusIcon(alert.status)}
                      <span className="ml-1">{alert.status}</span>
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">ID: {alert.id}</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Users className="w-3 h-3" />
                    <span>Autor: {alert.created_by || 'System'}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                    <span>{formatTimeUntilExpiry(alert.valid_until)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-3 h-3" />
                    <span>{alert.center_lat.toFixed(4)}, {alert.center_lon.toFixed(4)}</span>
                  </div>
                </div>
                
                {alert.source && (
                  <p className="text-sm text-gray-700 mt-1 truncate">
                    {alert.source}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {filteredAlerts.length === 0 && (
          <div className="text-center py-8">
            <AlertTriangle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">Brak alertów dla wybranego filtru</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAlertPanel;
