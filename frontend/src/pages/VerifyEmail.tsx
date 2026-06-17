import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import GlassCard from '../components/common/GlassCard';
import API from '../utils/api';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('Verifying your email...');

  const token = searchParams.get('token');

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Missing verification token. Please sign up again or check your email.');
        return;
      }

      try {
        const response = await API.post('/auth/verify-email', { token });
        setStatus('success');
        setMessage(response.data.message || 'Email verified successfully! You can now log in.');
      } catch (error: any) {
        console.error('Email verification error:', error);
        setStatus('error');
        if (error.response && error.response.data) {
          setMessage(error.response.data.error || 'Verification failed. Token may have expired.');
        } else {
          setMessage('Network error verifying email. Please try again.');
        }
      }
    };

    verifyToken();
  }, [token]);

  return (
    <AuthLayout
      title="Verify account"
      subtitle="Connecting you to BillHouse"
    >
      <GlassCard className="p-5 sm:p-6 md:p-8 border-navy/5 bg-white shadow-xl flex flex-col items-center text-center gap-6">
        {status === 'loading' && (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-green" />
            <div>
              <h3 className="text-xl font-bold text-navy mb-2">Verifying your email</h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                Please hold on while we secure your account credentials.
              </p>
            </div>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="p-4 bg-green/10 text-green rounded-full">
              <CheckCircle2 className="h-12 w-12" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-navy mb-2">Verification Success!</h3>
              <p className="text-text-secondary text-sm leading-relaxed mb-4">
                {message}
              </p>
            </div>
            <Link
              to="/login"
              className="w-full text-center py-4 bg-navy text-white hover:bg-green-dark rounded-xl font-bold transition-all shadow"
            >
              Sign In to Account
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="p-4 bg-danger/10 text-danger rounded-full">
              <XCircle className="h-12 w-12" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-navy mb-2">Verification Failed</h3>
              <p className="text-text-secondary text-sm leading-relaxed mb-4">
                {message}
              </p>
            </div>
            <Link
              to="/register"
              className="w-full text-center py-4 bg-navy text-white hover:bg-green-dark rounded-xl font-bold transition-all shadow"
            >
              Back to Registration
            </Link>
          </>
        )}
      </GlassCard>
    </AuthLayout>
  );
};

export default VerifyEmail;
