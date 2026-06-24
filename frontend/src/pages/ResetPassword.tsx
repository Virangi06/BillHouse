import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useSearchParams } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import GlassCard from '../components/common/GlassCard';
import API from '../utils/api';
import { CheckCircle2 } from 'lucide-react';

interface ResetFormInputs {
  passwordHash: string;
  confirmPassword: string;
}

import { usePopup } from '../context/PopupContext';

export const ResetPassword: React.FC = () => {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<ResetFormInputs>();
  const [searchParams] = useSearchParams();
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { showPopup } = usePopup();

  const token = searchParams.get('token');
  const passwordValue = watch('passwordHash');

  const onSubmit = async (data: ResetFormInputs) => {
    if (!token) {
      showPopup({
        title: 'Reset Link Invalid',
        message: 'Invalid or missing reset token. Please request a new link.',
        type: 'error'
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await API.post('/auth/reset-password', {
        token,
        password: data.passwordHash,
      });
      const msg = response.data.message || 'Password updated successfully!';
      showPopup({
        title: 'Password Updated',
        message: msg,
        type: 'success',
        onConfirm: () => {
          setSuccessMsg(msg);
        }
      });
    } catch (error: any) {
      console.error('Reset password error:', error);
      const msg = error.response?.data?.error || 'Password update failed. Please try again.';
      showPopup({
        title: 'Reset Failed',
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
        title="Password updated"
        subtitle="Your password has been changed"
        maxWidthClass="max-w-xl"
      >
        <GlassCard className="w-full p-5 sm:p-6 md:p-8 border-green/20 bg-white shadow-xl flex flex-col items-center text-center gap-6">
          <div className="p-4 bg-green/10 text-green rounded-full">
            <CheckCircle2 className="h-12 w-12" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-navy mb-2">Success!</h3>
            <p className="text-text-secondary text-xs leading-relaxed mb-4">
              Your password has been reset successfully. You can now use your new password to sign in.
            </p>
          </div>
          <Link
            to="/login"
            className="w-full text-center py-3 bg-navy text-white hover:bg-green-dark rounded-xl font-bold text-sm transition-all shadow"
          >
            Log In
          </Link>
        </GlassCard>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Create new password"
      subtitle="Password must be at least 8 characters with uppercase, lowercase, number & special character"
      maxWidthClass="max-w-xl"
    >
      <GlassCard className="w-full p-5 sm:p-6 md:p-8 border-navy/5 bg-white shadow-xl flex flex-col gap-6">

        {!token ? (
          <div className="flex flex-col gap-4">
            <p className="text-xs text-text-secondary leading-relaxed text-center font-semibold">
              The reset token is invalid or has expired. Please go back to recovery page and trigger a new email.
            </p>
            <Link
              to="/forgot-password"
              className="w-full text-center py-3 border border-navy/15 text-navy hover:bg-navy/5 rounded-xl font-bold text-xs transition-all"
            >
              Request New Link
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            
            {/* New Password field */}
            <div className="flex flex-col gap-1.5 w-full">
              <Input
                label="New Password"
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
                label="Confirm New Password"
                type="password"
                placeholder="••••••••"
                error={errors.confirmPassword?.message}
                required
                {...register('confirmPassword', {
                  required: 'Please confirm your new password',
                  validate: (value) => value === passwordValue || 'Passwords do not match',
                })}
              />
              <p className="text-[10px] text-text-secondary font-medium leading-normal px-1 mt-0.5">
                Confirm Password must be the same as the Password.
              </p>
            </div>

            {/* Submit Action */}
            <Button type="submit" variant="primary" className="w-full py-3 mt-1" isLoading={isLoading}>
              Reset Password
            </Button>
          </form>
        )}
      </GlassCard>
    </AuthLayout>
  );
};

export default ResetPassword;
