import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import GlassCard from '../components/common/GlassCard';
import API from '../utils/api';
import { MailCheck } from 'lucide-react';

interface ForgotFormInputs {
  email: string;
}

export const ForgotPassword: React.FC = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<ForgotFormInputs>();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (data: ForgotFormInputs) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);
    try {
      const response = await API.post('/auth/forgot-password', {
        email: data.email,
      });
      setSuccessMsg(response.data.message || 'If that email is registered, we have sent a password reset link.');
    } catch (error: any) {
      console.error('Forgot password error:', error);
      if (error.response && error.response.data) {
        setErrorMsg(error.response.data.error || 'Request failed.');
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
        subtitle="Password recovery sent"
        maxWidthClass="max-w-xl"
      >
        <GlassCard className="w-full p-5 sm:p-6 md:p-8 border-green/20 bg-white shadow-xl flex flex-col items-center text-center gap-6">
          <div className="p-4 bg-green/10 text-green rounded-full">
            <MailCheck className="h-12 w-12" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-navy mb-2">Check your inbox</h3>
            <p className="text-text-secondary text-xs leading-relaxed mb-4">
              We have dispatched a password recovery link to your email address if it is registered in our records.
            </p>
            <p className="text-xs text-text-secondary font-medium">
              Check your spam folder if you do not receive it shortly.
            </p>
          </div>
          <Link
            to="/login"
            className="w-full text-center py-3 bg-navy text-white hover:bg-green-dark rounded-xl font-bold text-sm transition-all shadow"
          >
            Go to Login
          </Link>
        </GlassCard>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Reset password"
      subtitle="Enter your email to receive recovery link"
      maxWidthClass="max-w-xl"
    >
      <GlassCard className="w-full p-5 sm:p-6 md:p-8 border-navy/5 bg-white shadow-xl flex flex-col gap-6">
        
        {/* Error notification */}
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
            required
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address',
              },
            })}
          />

          {/* Submit Action */}
          <Button type="submit" variant="primary" className="w-full py-3 mt-1" isLoading={isLoading}>
            Send Reset Link
          </Button>
        </form>

        {/* Back navigation */}
        <p className="text-xs text-text-secondary font-semibold text-center mt-1">
          Remember password?{' '}
          <Link to="/login" className="text-green hover:underline">
            Sign In
          </Link>
        </p>
      </GlassCard>
    </AuthLayout>
  );
};

export default ForgotPassword;
