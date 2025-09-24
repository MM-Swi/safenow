'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import type { UserUpdateRequest, UserPreferencesUpdateRequest, ChangePasswordRequest, Language } from '@/types/api';

const ProfilePage: React.FC = () => {
  const { user, updateProfile, updatePreferences, changePassword, error, clearError } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'password'>('profile');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Profile form data
  const [profileData, setProfileData] = useState<UserUpdateRequest>({
    first_name: '',
    last_name: '',
    phone_number: '',
  });

  // Preferences form data
  const [preferencesData, setPreferencesData] = useState<UserPreferencesUpdateRequest>({
    preferred_language: 'pl',
    email_notifications: true,
    push_notifications: true,
    sms_notifications: false,
    auto_location: true,
    alert_radius: 10,
  });

  // Password form data
  const [passwordData, setPasswordData] = useState<ChangePasswordRequest>({
    old_password: '',
    new_password: '',
    new_password2: '',
  });

  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});

  // Initialize form data when user data is available
  useEffect(() => {
    if (user) {
      setProfileData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone_number: user.phone_number || '',
      });

      setPreferencesData({
        preferred_language: user.profile.preferred_language || 'pl',
        email_notifications: user.profile.email_notifications ?? true,
        push_notifications: user.profile.push_notifications ?? true,
        sms_notifications: user.profile.sms_notifications ?? false,
        auto_location: user.profile.auto_location ?? true,
        alert_radius: user.profile.alert_radius || 10,
      });
    }
  }, [user]);

  // Clear messages when switching tabs
  useEffect(() => {
    setSuccessMessage('');
    if (error) {
      clearError();
    }
  }, [activeTab, error, clearError]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage('');

    try {
      await updateProfile(profileData);
      setSuccessMessage('Profil został zaktualizowany pomyślnie');
    } catch (error) {
      console.error('Profile update failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePreferencesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage('');

    try {
      await updatePreferences(preferencesData);
      setSuccessMessage('Preferencje zostały zaktualizowane pomyślnie');
    } catch (error) {
      console.error('Preferences update failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const validatePassword = (): boolean => {
    const errors: Record<string, string> = {};

    if (!passwordData.old_password) {
      errors.old_password = 'Obecne hasło jest wymagane';
    }

    if (!passwordData.new_password) {
      errors.new_password = 'Nowe hasło jest wymagane';
    } else if (passwordData.new_password.length < 8) {
      errors.new_password = 'Nowe hasło musi mieć co najmniej 8 znaków';
    }

    if (!passwordData.new_password2) {
      errors.new_password2 = 'Potwierdzenie hasła jest wymagane';
    } else if (passwordData.new_password !== passwordData.new_password2) {
      errors.new_password2 = 'Hasła nie są identyczne';
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePassword()) {
      return;
    }

    setIsSubmitting(true);
    setSuccessMessage('');

    try {
      await changePassword(passwordData);
      setSuccessMessage('Hasło zostało zmienione pomyślnie');
      setPasswordData({
        old_password: '',
        new_password: '',
        new_password2: '',
      });
      setPasswordErrors({});
    } catch (error) {
      console.error('Password change failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const tabs = [
    { id: 'profile', name: 'Profil', icon: '👤' },
    { id: 'preferences', name: 'Preferencje', icon: '⚙️' },
    { id: 'password', name: 'Hasło', icon: '🔒' },
  ] as const;

  const languageOptions = [
    { value: 'pl', label: 'Polski' },
    { value: 'en', label: 'English' },
    { value: 'uk', label: 'Українська' },
  ];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="pt-8 pb-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
              {/* Header */}
              <div className="px-6 py-6 border-b border-gray-200/50">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                  Mój profil
                </h1>
                <p className="mt-2 text-gray-600">
                  Zarządzaj swoimi danymi osobowymi i preferencjami
                </p>
              </div>

              {/* Tabs */}
              <div className="border-b border-gray-200/50">
                <nav className="-mb-px flex space-x-8 px-6">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm transition-all duration-300 ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span>{tab.icon}</span>
                        <span>{tab.name}</span>
                      </div>
                    </button>
                  ))}
                </nav>
              </div>

              {/* Content */}
              <div className="px-6 py-6">
                {/* Success Message */}
                {successMessage && (
                  <div className="mb-6 rounded-xl bg-green-50/80 backdrop-blur-sm p-4 border border-green-200/50">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg
                          className="h-5 w-5 text-green-400"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-green-800">
                          {successMessage}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="mb-6 rounded-xl bg-red-50/80 backdrop-blur-sm p-4 border border-red-200/50">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg
                          className="h-5 w-5 text-red-400"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-red-800">
                          {error}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                        Imię
                      </label>
                      <input
                        type="text"
                        id="first_name"
                        value={profileData.first_name}
                        onChange={(e) => setProfileData(prev => ({ ...prev, first_name: e.target.value }))}
                        className="mt-1 block w-full px-4 py-3 text-base border-2 border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white placeholder-gray-400"
                        disabled={isSubmitting}
                      />
                    </div>

                    <div>
                      <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                        Nazwisko
                      </label>
                      <input
                        type="text"
                        id="last_name"
                        value={profileData.last_name}
                        onChange={(e) => setProfileData(prev => ({ ...prev, last_name: e.target.value }))}
                        className="mt-1 block w-full px-4 py-3 text-base border-2 border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white placeholder-gray-400"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700">
                      Numer telefonu
                    </label>
                    <input
                      type="tel"
                      id="phone_number"
                      value={profileData.phone_number}
                      onChange={(e) => setProfileData(prev => ({ ...prev, phone_number: e.target.value }))}
                      className="mt-1 block w-full px-4 py-3 text-base border-2 border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white placeholder-gray-400"
                      placeholder="+48 123 456 789"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="group relative bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
                    >
                      {isSubmitting ? 'Zapisywanie...' : 'Zapisz zmiany'}
                    </button>
                  </div>
                </form>
              )}

              {/* Preferences Tab */}
              {activeTab === 'preferences' && (
                <form onSubmit={handlePreferencesSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="preferred_language" className="block text-sm font-medium text-gray-700">
                      Preferowany język
                    </label>
                    <select
                      id="preferred_language"
                      value={preferencesData.preferred_language}
                      onChange={(e) => setPreferencesData(prev => ({ ...prev, preferred_language: e.target.value as Language }))}
                      className="mt-1 block w-full px-4 py-3 text-base border-2 border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                      disabled={isSubmitting}
                    >
                      {languageOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-4">
                      Powiadomienia
                    </label>
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <input
                          id="email_notifications"
                          type="checkbox"
                          checked={preferencesData.email_notifications}
                          onChange={(e) => setPreferencesData(prev => ({ ...prev, email_notifications: e.target.checked }))}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          disabled={isSubmitting}
                        />
                        <label htmlFor="email_notifications" className="ml-2 block text-sm text-gray-900">
                          Powiadomienia email
                        </label>
                      </div>

                      <div className="flex items-center">
                        <input
                          id="push_notifications"
                          type="checkbox"
                          checked={preferencesData.push_notifications}
                          onChange={(e) => setPreferencesData(prev => ({ ...prev, push_notifications: e.target.checked }))}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          disabled={isSubmitting}
                        />
                        <label htmlFor="push_notifications" className="ml-2 block text-sm text-gray-900">
                          Powiadomienia push
                        </label>
                      </div>

                      <div className="flex items-center">
                        <input
                          id="sms_notifications"
                          type="checkbox"
                          checked={preferencesData.sms_notifications}
                          onChange={(e) => setPreferencesData(prev => ({ ...prev, sms_notifications: e.target.checked }))}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          disabled={isSubmitting}
                        />
                        <label htmlFor="sms_notifications" className="ml-2 block text-sm text-gray-900">
                          Powiadomienia SMS
                        </label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center mb-4">
                      <input
                        id="auto_location"
                        type="checkbox"
                        checked={preferencesData.auto_location}
                        onChange={(e) => setPreferencesData(prev => ({ ...prev, auto_location: e.target.checked }))}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        disabled={isSubmitting}
                      />
                      <label htmlFor="auto_location" className="ml-2 block text-sm font-medium text-gray-900">
                        Automatyczne wykrywanie lokalizacji
                      </label>
                    </div>

                    <div>
                      <label htmlFor="alert_radius" className="block text-sm font-medium text-gray-700">
                        Promień alertów (km)
                      </label>
                      <input
                        type="number"
                        id="alert_radius"
                        min="1"
                        max="100"
                        value={preferencesData.alert_radius}
                        onChange={(e) => setPreferencesData(prev => ({ ...prev, alert_radius: parseInt(e.target.value) || 10 }))}
                        className="mt-1 block w-full px-4 py-3 text-base border-2 border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white placeholder-gray-400"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="group relative bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
                    >
                      {isSubmitting ? 'Zapisywanie...' : 'Zapisz preferencje'}
                    </button>
                  </div>
                </form>
              )}

              {/* Password Tab */}
              {activeTab === 'password' && (
                <form onSubmit={handlePasswordSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="old_password" className="block text-sm font-medium text-gray-700">
                      Obecne hasło
                    </label>
                    <input
                      type="password"
                      id="old_password"
                      value={passwordData.old_password}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, old_password: e.target.value }))}
                      className={`mt-1 block w-full px-4 py-3 text-base border-2 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white placeholder-gray-400 ${
                        passwordErrors.old_password ? 'border-red-300 bg-red-50' : 'border-gray-200'
                      }`}
                      disabled={isSubmitting}
                    />
                    {passwordErrors.old_password && (
                      <p className="mt-1 text-sm text-red-600">{passwordErrors.old_password}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="new_password" className="block text-sm font-medium text-gray-700">
                      Nowe hasło
                    </label>
                    <input
                      type="password"
                      id="new_password"
                      value={passwordData.new_password}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, new_password: e.target.value }))}
                      className={`mt-1 block w-full px-4 py-3 text-base border-2 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white placeholder-gray-400 ${
                        passwordErrors.new_password ? 'border-red-300 bg-red-50' : 'border-gray-200'
                      }`}
                      disabled={isSubmitting}
                    />
                    {passwordErrors.new_password && (
                      <p className="mt-1 text-sm text-red-600">{passwordErrors.new_password}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="new_password2" className="block text-sm font-medium text-gray-700">
                      Potwierdź nowe hasło
                    </label>
                    <input
                      type="password"
                      id="new_password2"
                      value={passwordData.new_password2}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, new_password2: e.target.value }))}
                      className={`mt-1 block w-full px-4 py-3 text-base border-2 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white placeholder-gray-400 ${
                        passwordErrors.new_password2 ? 'border-red-300 bg-red-50' : 'border-gray-200'
                      }`}
                      disabled={isSubmitting}
                    />
                    {passwordErrors.new_password2 && (
                      <p className="mt-1 text-sm text-red-600">{passwordErrors.new_password2}</p>
                    )}
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="group relative bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
                    >
                      {isSubmitting ? 'Zmienianie...' : 'Zmień hasło'}
                    </button>
                  </div>
                </form>
              )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default ProfilePage;
