'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';

// Validation schema
const loginSchema = z.object({
  username: z.string().min(1, 'Nazwa użytkownika lub email jest wymagana'),
  password: z.string().min(1, 'Hasło jest wymagane'),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

const LoginPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated, isLoading, error, clearError } = useAuth();
  
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
      rememberMe: false,
    },
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      const redirectTo = searchParams.get('redirect') || '/';
      router.push(redirectTo);
    }
  }, [isAuthenticated, isLoading, router, searchParams]);

  // Clear errors when component mounts
  useEffect(() => {
    if (error) {
      clearError();
    }
  }, [error, clearError]);

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login({
        username: data.username,
        password: data.password,
      });
      // Redirect will be handled by useEffect
    } catch (err: unknown) {
      // Set form-specific errors
      const errorResponse = err as any;
      if (errorResponse.response?.data?.username) {
        setError('username', { message: errorResponse.response.data.username[0] });
      }
      if (errorResponse.response?.data?.password) {
        setError('password', { message: errorResponse.response.data.password[0] });
      }
      if (errorResponse.response?.data?.non_field_errors) {
        setError('username', { message: errorResponse.response.data.non_field_errors[0] });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Ładowanie...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg mb-6">
            <svg
              className="h-10 w-10 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Zaloguj się do SafeNow
          </h1>
          <p className="text-gray-600">
            Lub{' '}
            <Link
              href="/auth/register"
              className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
            >
              utwórz nowe konto
            </Link>
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
        
        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="username" className="block text-sm font-semibold text-gray-700">
                Nazwa użytkownika lub email
              </label>
              <input
                {...register('username')}
                id="username"
                type="text"
                autoComplete="username"
                className="w-full px-4 py-4 text-base border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400 bg-gray-50 focus:bg-white"
                placeholder="Wprowadź nazwę użytkownika lub email"
                disabled={isSubmitting}
              />
              {errors.username && (
                <p className="text-sm text-red-600 font-medium">{errors.username.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                Hasło
              </label>
              <div className="relative">
                <input
                  {...register('password')}
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="w-full px-4 py-4 pr-12 text-base border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400 bg-gray-50 focus:bg-white"
                  placeholder="Wprowadź hasło"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isSubmitting}
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    {showPassword ? (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.464 8.464m1.414 1.414L8.464 8.464m5.656 5.656l1.415 1.415m-1.415-1.415l1.415 1.415M14.828 14.828L16.243 16.243"
                      />
                    ) : (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    )}
                  </svg>
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-600 font-medium">{errors.password.message}</p>
              )}
            </div>

            {/* Remember Me and Forgot Password */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center">
                <input
                  {...register('rememberMe')}
                  id="remember-me"
                  type="checkbox"
                  className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded-md transition-colors"
                />
                <label htmlFor="remember-me" className="ml-3 block text-sm font-medium text-gray-700">
                  Zapamiętaj mnie
                </label>
              </div>

              <div className="text-sm">
                <Link
                  href="#"
                  className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Zapomniałeś hasła?
                </Link>
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
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
                  <h3 className="text-sm font-medium text-red-800">
                    Błąd logowania
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-4 px-6 rounded-xl shadow-lg transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <div className="flex items-center justify-center space-x-2">
                {isSubmitting ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <svg
                    className="h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                <span>{isSubmitting ? 'Logowanie...' : 'Zaloguj się'}</span>
              </div>
            </button>

            {/* Back Link */}
            <div className="text-center mt-6">
              <Link
                href="/"
                className="inline-flex items-center font-semibold text-blue-600 hover:text-blue-700 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Powrót do strony głównej
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
