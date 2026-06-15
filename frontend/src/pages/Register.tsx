import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import GlassCard from '../components/common/GlassCard';
import API from '../utils/api';
import { MailOpen } from 'lucide-react';

interface RegisterFormInputs {
  name: string;
  email: string;
  passwordHash: string;
  confirmPassword: string;
  termsAccepted: boolean;
}

export const Register: React.FC = () => {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterFormInputs>();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const passwordValue = watch('passwordHash');

  const onSubmit = async (data: RegisterFormInputs) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);
    try {
      const response = await API.post('/auth/signup', {
        name: data.name,
        email: data.email,
        password: data.passwordHash,
      });

      setSuccessMsg(response.data.message || 'Registration successful! Verification email has been sent.');
    } catch (error: any) {
      console.error('Registration error:', error);
      if (error.response && error.response.data) {
        setErrorMsg(error.response.data.error || 'Registration failed.');
      } else {
        setErrorMsg('Network error. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (successMsg) {
    return (
      <AuthLayout
        title="Check your email"
        subtitle="Verification link has been sent"
      >
        <GlassCard className="p-8 border-green/20 bg-white shadow-xl flex flex-col items-center text-center gap-6">
          <div className="p-4 bg-green/10 text-green rounded-full">
            <MailOpen className="h-12 w-12" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-navy mb-2">Confirm your email address</h3>
            <p className="text-text-secondary text-sm leading-relaxed mb-4">
              {successMsg}
            </p>
            <p className="text-xs text-text-secondary">
              If you don't receive it within a few minutes, please check your spam folder.
            </p>
          </div>
          <Link
            to="/login"
            className="w-full text-center py-4 bg-navy text-white hover:bg-green-dark rounded-xl font-bold transition-all shadow"
          >
            Go to Login
          </Link>
        </GlassCard>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Create account"
      subtitle="Start creating professional invoices in seconds"
    >
      <GlassCard className="p-8 border-navy/5 bg-white shadow-xl flex flex-col gap-6">

        {/* Error notification */}
        {errorMsg && (
          <div className="p-4 bg-danger/10 border border-danger/35 text-danger text-sm font-semibold rounded-2xl animate-float-fast">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">

          {/* Full Name field */}
          <Input
            label="Full Name"
            placeholder="Enter Your Full Name"
            error={errors.name?.message}
            {...register('name', { required: 'Name is required' })}
          />

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
            error={errors.passwordHash?.message}
            {...register('passwordHash', {
              required: 'Password is required',
              minLength: {
                value: 6,
                message: 'Password must be at least 6 characters',
              },
            })}
          />

          {/* Confirm Password field */}
          <Input
            label="Confirm Password"
            type="password"
            placeholder="••••••••"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword', {
              required: 'Please confirm your password',
              validate: (value) => value === passwordValue || 'Passwords do not match',
            })}
          />

          {/* Terms checkbox */}
          <div className="flex flex-col gap-1 select-none">
            <label className="flex items-start gap-2.5 cursor-pointer mt-1">
              <input
                type="checkbox"
                className="rounded border-navy/15 text-green focus:ring-green h-4.5 w-4.5 mt-0.5"
                {...register('termsAccepted', { required: 'You must accept the terms' })}
              />
              <span className="text-xs text-text-secondary leading-normal">
                I agree to the{' '}
                <Link to="/terms" className="text-green font-semibold hover:underline">Terms of Service</Link>{' '}
                and{' '}
                <Link to="/privacy" className="text-green font-semibold hover:underline">Privacy Policy</Link>
              </span>
            </label>
            {errors.termsAccepted && (
              <span className="text-xs font-medium text-danger mt-0.5">
                {errors.termsAccepted.message}
              </span>
            )}
          </div>

          {/* Submit Action */}
          <Button type="submit" variant="primary" className="w-full py-4 mt-2" isLoading={isLoading}>
            Create Account
          </Button>
        </form>

        {/* Redirect Login */}
        <p className="text-sm text-text-secondary font-semibold text-center mt-1">
          Already have an account?{' '}
          <Link to="/login" className="text-green hover:underline">
            Sign In
          </Link>
        </p>
      </GlassCard>
    </AuthLayout>
  );
};

export default Register;
