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

export const ResetPassword: React.FC = () => {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<ResetFormInputs>();
  const [searchParams] = useSearchParams();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const token = searchParams.get('token');
  const passwordValue = watch('passwordHash');

  const onSubmit = async (data: ResetFormInputs) => {
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!token) {
      setErrorMsg('Invalid or missing reset token. Please request a new link.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await API.post('/auth/reset-password', {
        token,
        password: data.passwordHash,
      });
      setSuccessMsg(response.data.message || 'Password updated successfully!');
    } catch (error: any) {
      console.error('Reset password error:', error);
      if (error.response && error.response.data) {
        setErrorMsg(error.response.data.error || 'Password update failed.');
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
        title="Password updated"
        subtitle="Your password has been changed"
      >
        <GlassCard className="p-5 sm:p-6 md:p-8 border-green/20 bg-white shadow-xl flex flex-col items-center text-center gap-6">
          <div className="p-4 bg-green/10 text-green rounded-full">
            <CheckCircle2 className="h-12 w-12" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-navy mb-2">Success!</h3>
            <p className="text-text-secondary text-sm leading-relaxed mb-4">
              Your password has been reset successfully. You can now use your new password to sign in.
            </p>
          </div>
          <Link
            to="/login"
            className="w-full text-center py-4 bg-navy text-white hover:bg-green-dark rounded-xl font-bold transition-all shadow"
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
    >
      <GlassCard className="p-5 sm:p-6 md:p-8 border-navy/5 bg-white shadow-xl flex flex-col gap-6">
        
        {/* Error notification */}
        {errorMsg && (
          <div className="p-4 bg-danger/10 border border-danger/35 text-danger text-sm font-semibold rounded-2xl animate-float-fast">
            {errorMsg}
          </div>
        )}

        {!token ? (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-text-secondary leading-relaxed text-center">
              The reset token is invalid or has expired. Please go back to recovery page and trigger a new email.
            </p>
            <Link
              to="/forgot-password"
              className="w-full text-center py-3 border border-navy/15 text-navy hover:bg-navy/5 rounded-xl font-bold transition-all"
            >
              Request New Link
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            
            {/* New Password field */}
            <Input
              label="New Password"
              type="password"
              placeholder="••••••••"
              error={errors.passwordHash?.message}
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

            {/* Confirm Password field */}
            <Input
              label="Confirm New Password"
              type="password"
              placeholder="••••••••"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword', {
                required: 'Please confirm your new password',
                validate: (value) => value === passwordValue || 'Passwords do not match',
              })}
            />

            {/* Submit Action */}
            <Button type="submit" variant="primary" className="w-full py-4 mt-2" isLoading={isLoading}>
              Reset Password
            </Button>
          </form>
        )}
      </GlassCard>
    </AuthLayout>
  );
};

export default ResetPassword;
