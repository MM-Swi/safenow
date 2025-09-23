'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, AlertTriangle, MapPin, Clock, Users } from 'lucide-react';
import type { UserAlert, HazardType } from '@/types/api';

interface AlertManagementModalProps {
  alert: UserAlert;
  isOpen: boolean;
  onClose: () => void;
  onSave: (alertId: number, data: Partial<UserAlert>) => void;
  onDelete: (alertId: number) => void;
}

const alertSchema = z.object({
  title: z.string().min(5, 'Tytuł musi mieć co najmniej 5 znaków'),
  description: z.string().min(10, 'Opis musi mieć co najmniej 10 znaków'),
  hazard_type: z.enum(['AIR_RAID', 'DRONE', 'MISSILE', 'FLOOD', 'FIRE', 'INDUSTRIAL', 'SHOOTING', 'STORM', 'TSUNAMI', 'CHEMICAL WEAPON', 'BIOHAZARD', 'NUCLEAR', 'UNMARKED SOLDIERS', 'PANDEMIC', 'TERRORIST ATTACK', 'MASS POISONING', 'CYBER ATTACK', 'EARTHQUAKE']),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  radius: z.number().min(100).max(10000),
});

type AlertFormData = z.infer<typeof alertSchema>;

const AlertManagementModal: React.FC<AlertManagementModalProps> = ({
  alert,
  isOpen,
  onClose,
  onSave,
  onDelete,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<AlertFormData>({
    resolver: zodResolver(alertSchema),
    defaultValues: {
      title: alert.source || '', // Use source as title
      description: alert.description || '', // Now UserAlert has description field
      hazard_type: alert.hazard_type,
      severity: alert.severity,
      radius: alert.radius_m,
    },
  });

  const hazardTypes: { value: HazardType; label: string }[] = [
    { value: 'AIR_RAID', label: '🚨 Nalot' },
    { value: 'DRONE', label: '🛸 Atak dronów' },
    { value: 'MISSILE', label: '🚀 Atak rakietowy' },
    { value: 'FLOOD', label: '🌊 Powódź' },
    { value: 'FIRE', label: '🔥 Pożar' },
    { value: 'INDUSTRIAL', label: '🏭 Awaria przemysłowa' },
    { value: 'SHOOTING', label: '🔫 Strzelanina' },
    { value: 'STORM', label: '⛈️ Burza' },
    { value: 'TSUNAMI', label: '🌊 Tsunami' },
    { value: 'CHEMICAL WEAPON', label: '☢️ Broń chemiczna' },
    { value: 'BIOHAZARD', label: '☣️ Zagrożenie biologiczne' },
    { value: 'NUCLEAR', label: '☢️ Zagrożenie nuklearne' },
    { value: 'UNMARKED SOLDIERS', label: '👤 Nieoznaczeni żołnierze' },
    { value: 'PANDEMIC', label: '🦠 Pandemia' },
    { value: 'TERRORIST ATTACK', label: '💥 Atak terrorystyczny' },
    { value: 'MASS POISONING', label: '☠️ Masowe zatrucie' },
    { value: 'CYBER ATTACK', label: '💻 Atak cybernetyczny' },
    { value: 'EARTHQUAKE', label: '🌍 Trzęsienie ziemi' },
  ];

  const severityOptions = [
    { value: 'LOW', label: 'Niskie', color: 'text-green-600' },
    { value: 'MEDIUM', label: 'Średnie', color: 'text-yellow-600' },
    { value: 'HIGH', label: 'Wysokie', color: 'text-orange-600' },
    { value: 'CRITICAL', label: 'Krytyczne', color: 'text-red-600' },
  ];

  const onSubmit = async (data: AlertFormData) => {
    try {
      // Transform form data to UserAlert format
      const updateData: Partial<UserAlert> = {
        source: data.title, // Map title back to source
        description: data.description, // Include description
        hazard_type: data.hazard_type as HazardType,
        severity: data.severity,
        radius_m: data.radius,
      };
      await onSave(alert.id, updateData);
      onClose();
    } catch (error) {
      console.error('Failed to update alert:', error);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(alert.id);
      onClose();
    } catch (error) {
      console.error('Failed to delete alert:', error);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'VERIFIED': return 'bg-green-100 text-green-800 border-green-200';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'REJECTED': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Edytuj alert</h2>
            <div className="flex items-center space-x-4 mt-2">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(alert.status)}`}>
                {alert.status}
              </span>
              <span className="text-sm text-gray-600">
                Utworzono: {formatDate(alert.created_at)}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Alert Stats */}
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 text-green-600">
                <Users className="w-4 h-4" />
                <span className="font-semibold">{alert.vote_summary.upvotes}</span>
              </div>
              <p className="text-xs text-gray-600 mt-1">Głosy za</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 text-red-600">
                <Users className="w-4 h-4" />
                <span className="font-semibold">{alert.vote_summary.downvotes}</span>
              </div>
              <p className="text-xs text-gray-600 mt-1">Głosy przeciw</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 text-purple-600">
                <AlertTriangle className="w-4 h-4" />
                <span className="font-semibold">{alert.verification_score}</span>
              </div>
              <p className="text-xs text-gray-600 mt-1">Punkty</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Tytuł alertu *
            </label>
            <input
              {...register('title')}
              type="text"
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.title ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Krótki, opisowy tytuł alertu"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Opis *
            </label>
            <textarea
              {...register('description')}
              rows={4}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.description ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Szczegółowy opis sytuacji..."
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          {/* Hazard Type and Severity */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="hazard_type" className="block text-sm font-medium text-gray-700 mb-2">
                Rodzaj zagrożenia *
              </label>
              <select
                {...register('hazard_type')}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {hazardTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="severity" className="block text-sm font-medium text-gray-700 mb-2">
                Poziom zagrożenia *
              </label>
              <select
                {...register('severity')}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {severityOptions.map((severity) => (
                  <option key={severity.value} value={severity.value}>
                    {severity.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Radius */}
          <div>
            <label htmlFor="radius" className="block text-sm font-medium text-gray-700 mb-2">
              Zasięg alertu (metry) *
            </label>
            <input
              {...register('radius', { valueAsNumber: true })}
              type="number"
              min="100"
              max="10000"
              step="100"
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.radius ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.radius && (
              <p className="mt-1 text-sm text-red-600">{errors.radius.message}</p>
            )}
          </div>

          {/* Location Info */}
          <div className="bg-blue-50 rounded-xl p-4">
            <div className="flex items-center space-x-2 text-blue-800 mb-2">
              <MapPin className="w-4 h-4" />
              <span className="font-medium">Lokalizacja</span>
            </div>
            <p className="text-sm text-blue-700">
              Szerokość: {alert.center_lat.toFixed(6)}, Długość: {alert.center_lon.toFixed(6)}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Lokalizacja nie może być zmieniona po utworzeniu alertu
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors duration-200 font-medium"
            >
              Usuń alert
            </button>
            
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 transition-colors duration-200 font-medium"
              >
                Anuluj
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-medium"
              >
                {isSubmitting ? 'Zapisywanie...' : 'Zapisz zmiany'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Usuń alert
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Czy na pewno chcesz usunąć ten alert? Ta operacja jest nieodwracalna.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors duration-200"
                >
                  Anuluj
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {isDeleting ? 'Usuwanie...' : 'Usuń'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertManagementModal;
