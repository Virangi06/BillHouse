import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import GlassCard from '../components/common/GlassCard';
import API from '../utils/api';
import { MailOpen } from 'lucide-react';

import { usePopup } from '../context/PopupContext';

interface RegisterFormInputs {
  name: string;
  businessName?: string;
  email: string;
  passwordHash: string;
  confirmPassword: string;
  termsAccepted: boolean;
}

export const Register: React.FC = () => {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterFormInputs>();
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { showPopup } = usePopup();

  const passwordValue = watch('passwordHash');

  const onSubmit = async (data: RegisterFormInputs) => {
    setIsLoading(true);
    try {
      const response = await API.post('/auth/signup', {
        name: data.name,
        email: data.email,
        password: data.passwordHash,
        businessName: data.businessName,
      });

      showPopup({
        title: 'Account Created!',
        message: response.data.message || 'Registration successful! Verification email has been sent.',
        type: 'success',
        onConfirm: () => {
          setSuccessMsg(response.data.message || 'Registration successful! Verification email has been sent.');
        }
      });
    } catch (error: any) {
      console.error('Registration error:', error);
      const msg = error.response?.data?.error || 'Registration failed. Please try again.';
      showPopup({
        title: 'Registration Failed',
        message: msg,
        type: 'error'
      });
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
        <GlassCard className="p-5 sm:p-6 md:p-8 border-green/20 bg-white shadow-xl flex flex-col items-center text-center gap-6">
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
      maxWidthClass="max-w-2xl"
    >
      <GlassCard className="p-5 sm:p-6 md:p-8 border-navy/5 bg-white shadow-xl flex flex-col gap-6">

        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">

          {/* Full Name field */}
          <Input
            label="Full Name"
            placeholder="Enter Your Full Name"
            error={errors.name?.message}
            required
            {...register('name', { required: 'Name is required' })}
          />

          {/* Business / Company Name field */}
          <Input
            label="Business / Company Name"
            placeholder="Your company or freelance brand name (optional)"
            error={errors.businessName?.message}
            {...register('businessName')}
          />

          {/* Email field */}
          <div className="sm:col-span-2">
            <Input
              label="Email Address"
              type="email"
              placeholder="you@company.com"
              error={errors.email?.message}
              required
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address',
                },
              })}
            />
          </div>

          {/* Password field */}
          <div className="flex flex-col gap-1.5 w-full">
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              error={errors.passwordHash?.message}
              required
              {...register('passwordHash', {
                required: 'Password is required',
                validate: {
                  minLength: (v) => v.length >= 8 || 'Password must be at least 8 characters',
                  uppercase: (v) => /[A-Z]/.test(v) || 'Password must contain at least one uppercase letter',
                  lowercase: (v) => /[a-z]/.test(v) || 'Password must contain at least one lowercase letter',
                  number: (v) => /[0-9]/.test(v) || 'Password must contain at least one number',
                  special: (v) => /[^A-Za-z0-9]/.test(v) || 'Password must contain at least one special character',
                }
              })}
            />
            <p className="text-[10px] text-text-secondary font-medium leading-normal px-1 mt-0.5">
              Must be 8+ chars: 1 uppercase, 1 lowercase, 1 number, 1 symbol.
            </p>
          </div>

          {/* Confirm Password field */}
          <div className="flex flex-col gap-1.5 w-full">
            <Input
              label="Confirm Password"
              type="password"
              placeholder="••••••••"
              error={errors.confirmPassword?.message}
              required
              {...register('confirmPassword', {
                required: 'Please confirm your password',
                validate: (value) => value === passwordValue || 'Passwords do not match',
              })}
            />
            <p className="text-[10px] text-text-secondary font-medium leading-normal px-1 mt-0.5">
              Confirm Password must be the same as the Password.
            </p>
          </div>

          {/* Terms checkbox */}
          <div className="flex flex-col gap-1 select-none sm:col-span-2">
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
          <div className="sm:col-span-2">
            <Button type="submit" variant="primary" className="w-full py-3 mt-1" isLoading={isLoading}>
              Create Account
            </Button>
          </div>
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
