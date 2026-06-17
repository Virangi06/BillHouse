import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../layouts/AuthLayout';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import GlassCard from '../components/common/GlassCard';
import API from '../utils/api';

interface LoginFormInputs {
  email: string;
  password: string;
  rememberMe: boolean;
}

export const Login: React.FC = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormInputs>();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect to dashboard or route user was previously trying to access
  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const onSubmit = async (data: LoginFormInputs) => {
    setErrorMsg(null);
    setIsLoading(true);
    try {
      const response = await API.post('/auth/login', {
        email: data.email,
        password: data.password,
      });

      const { token, user } = response.data;
      
      // Save credentials in AuthContext
      login(token, user);
      
      // If remember me is checked, let's keep it (AuthContext handles it by storing in localStorage anyway)
      if (!data.rememberMe) {
        // Option to clear token on session end can be added if needed, but localStorage is standard for simple MVPs.
      }

      navigate(from, { replace: true });
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.response && error.response.data) {
        setErrorMsg(error.response.data.error || 'Invalid credentials');
      } else {
        setErrorMsg('Network error. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your BillHouse invoicing dashboard"
      maxWidthClass="max-w-xl"
    >
      <GlassCard className="w-full p-5 sm:p-6 md:p-8 border-navy/5 bg-white shadow-xl flex flex-col gap-6">
        
        {/* Error Notification Alert */}
        {errorMsg && (
          <div className="p-4 bg-danger/10 border border-danger/35 text-danger text-sm font-semibold rounded-2xl animate-float-fast">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {/* Email field */}
          <Input
            label="Email Address"
            type="email"
            placeholder="you@company.com"
            error={errors.email?.message}
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address',
              },
            })}
          />

          {/* Password field */}
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            error={errors.password?.message}
            rightLabel={
              <Link
                to="/forgot-password"
                className="text-xs font-bold text-green hover:underline"
              >
                Forgot?
              </Link>
            }
            {...register('password', {
              required: 'Password is required',
              minLength: {
                value: 6,
                message: 'Password must be at least 6 characters',
              },
            })}
          />

          {/* Remember me options */}
          <div className="flex items-center justify-between select-none">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                className="rounded border-navy/15 text-green focus:ring-green h-4.5 w-4.5"
                {...register('rememberMe')}
              />
              <span className="text-xs font-semibold text-text-secondary">
                Remember me
              </span>
            </label>
          </div>

          {/* Submit Action */}
          <Button type="submit" variant="primary" className="w-full py-3 mt-1" isLoading={isLoading}>
            Sign In
          </Button>
        </form>

        {/* Footer section link */}
        <p className="text-xs text-text-secondary font-semibold text-center mt-1">
          New to BillHouse?{' '}
          <Link to="/register" className="text-green hover:underline">
            Start free trial
          </Link>
        </p>
      </GlassCard>
    </AuthLayout>
  );
};

export default Login;
