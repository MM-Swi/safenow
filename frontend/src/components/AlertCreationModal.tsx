'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, MapPin, AlertTriangle, Loader2 } from 'lucide-react';
import type { HazardType, AlertSeverity } from '@/types/api';

interface AlertCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: AlertFormData) => Promise<void>;
}

const alertSchema = z.object({
  title: z.string().min(5, 'Tytuł musi mieć co najmniej 5 znaków'),
  description: z.string().min(10, 'Opis musi mieć co najmniej 10 znaków'),
  hazard_type: z.enum(['AIR_RAID', 'DRONE', 'MISSILE', 'FLOOD', 'FIRE', 'INDUSTRIAL', 'SHOOTING', 'STORM', 'TSUNAMI', 'CHEMICAL WEAPON', 'BIOHAZARD', 'NUCLEAR', 'UNMARKED SOLDIERS', 'PANDEMIC', 'TERRORIST ATTACK', 'MASS POISONING', 'CYBER ATTACK', 'EARTHQUAKE']),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  radius: z.number().min(100).max(10000),
  latitude: z.number().min(-90).max(90).transform(val => Math.round(val * 1000000) / 1000000),
  longitude: z.number().min(-180).max(180).transform(val => Math.round(val * 1000000) / 1000000),
});

export type AlertFormData = z.infer<typeof alertSchema>;

const AlertCreationModal: React.FC<AlertCreationModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<AlertFormData>({
    resolver: zodResolver(alertSchema),
    defaultValues: {
      title: '',
      description: '',
      hazard_type: 'FIRE',
      severity: 'MEDIUM',
      radius: 1000,
      latitude: 0,
      longitude: 0,
    },
  });

  const latitude = watch('latitude');
  const longitude = watch('longitude');

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

  const getCurrentLocation = () => {
    setIsGettingLocation(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError('Geolokalizacja nie jest obsługiwana przez tę przeglądarkę');
      setIsGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Round coordinates to 6 decimal places to match backend requirements
        const roundedLat = Math.round(position.coords.latitude * 1000000) / 1000000;
        const roundedLon = Math.round(position.coords.longitude * 1000000) / 1000000;
        setValue('latitude', roundedLat);
        setValue('longitude', roundedLon);
        setIsGettingLocation(false);
      },
      (error) => {
        let errorMessage = 'Nie udało się pobrać lokalizacji';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Dostęp do lokalizacji został odrzucony';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Informacje o lokalizacji są niedostępne';
            break;
          case error.TIMEOUT:
            errorMessage = 'Przekroczono czas oczekiwania na lokalizację';
            break;
        }
        setLocationError(errorMessage);
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  const onSubmit = async (data: AlertFormData) => {
    setIsSubmitting(true);
    try {
      await onSave(data);
      reset();
      onClose();
    } catch (error) {
      console.error('Failed to create alert:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    setLocationError(null);
    onClose();
  };

  // Get user's location when modal opens
  useEffect(() => {
    if (isOpen && latitude === 0 && longitude === 0) {
      getCurrentLocation();
    }
  }, [isOpen, latitude, longitude]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Utwórz nowy alert</h2>
            <p className="text-sm text-gray-600 mt-1">
              Zgłoś zagrożenie w Twojej okolicy
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <X className="w-6 h-6" />
          </button>
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

          {/* Location */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">
                Lokalizacja *
              </label>
              <button
                type="button"
                onClick={getCurrentLocation}
                disabled={isGettingLocation}
                className="flex items-center space-x-2 px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {isGettingLocation ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <MapPin className="w-4 h-4" />
                )}
                <span>{isGettingLocation ? 'Pobieranie...' : 'Użyj mojej lokalizacji'}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="latitude" className="block text-sm font-medium text-gray-600 mb-1">
                  Szerokość geograficzna
                </label>
                <input
                  {...register('latitude', { valueAsNumber: true })}
                  type="number"
                  step="0.000001"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.latitude ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="50.092442"
                />
                {errors.latitude && (
                  <p className="mt-1 text-xs text-red-600">{errors.latitude.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="longitude" className="block text-sm font-medium text-gray-600 mb-1">
                  Długość geograficzna
                </label>
                <input
                  {...register('longitude', { valueAsNumber: true })}
                  type="number"
                  step="0.000001"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.longitude ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="22.347776"
                />
                {errors.longitude && (
                  <p className="mt-1 text-xs text-red-600">{errors.longitude.message}</p>
                )}
              </div>
            </div>

            {locationError && (
              <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <p className="text-sm text-red-700">{locationError}</p>
              </div>
            )}

            {latitude !== 0 && longitude !== 0 && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-2 text-green-800">
                  <MapPin className="w-4 h-4" />
                  <span className="font-medium text-sm">Lokalizacja ustawiona</span>
                </div>
                <p className="text-xs text-green-700 mt-1">
                  {latitude.toFixed(6)}, {longitude.toFixed(6)}
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-3 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 transition-colors duration-200 font-medium"
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={isSubmitting || latitude === 0 || longitude === 0}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-medium"
            >
              {isSubmitting ? 'Tworzenie...' : 'Utwórz alert'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AlertCreationModal;
