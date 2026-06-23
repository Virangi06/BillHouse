import React, { useState, useEffect } from 'react';
import API from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useBusinessProfile } from '../../context/BusinessContext';
import Button from './Button';
import { X, Check, ShieldCheck, Zap, Sparkles, CreditCard } from 'lucide-react';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const { refreshBusinessProfile } = useBusinessProfile();
  
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [mockOrder, setMockOrder] = useState<any | null>(null); // For Mock Checkout Flow

  // Load Razorpay Script dynamically on mount
  useEffect(() => {
    if (isOpen) {
      const scriptId = 'razorpay-checkout-script';
      if (!document.getElementById(scriptId)) {
        const script = document.createElement('script');
        script.id = scriptId;
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleUpgrade = async () => {
    setErrorMsg(null);
    setLoading(true);
    setMockOrder(null);
    
    try {
      // 1. Create order on the backend
      const response = await API.post('/subscription/razorpay/create-order', {
        planType: billingCycle
      });

      const { isMock, key_id, order_id, amount, currency } = response.data;

      if (isMock) {
        // If backend is running in mock mode, load the mock checkout panel
        setMockOrder(response.data);
        setLoading(false);
      } else {
        // Run actual Razorpay Checkout SDK
        const options = {
          key: key_id,
          amount,
          currency,
          name: 'BillHouse Invoicing',
          description: `Professional Plan - ${billingCycle === 'monthly' ? 'Monthly' : 'Annual'} Subscription`,
          image: '/Logo.png',
          order_id,
          handler: async function (paymentRes: any) {
            try {
              setLoading(true);
              // Verify signature
              await API.post('/subscription/razorpay/verify-payment', {
                razorpay_order_id: paymentRes.razorpay_order_id,
                razorpay_payment_id: paymentRes.razorpay_payment_id,
                razorpay_signature: paymentRes.razorpay_signature,
                planType: billingCycle
              });
              
              await refreshBusinessProfile();
              if (onSuccess) onSuccess();
              onClose();
            } catch (err: any) {
              console.error(err);
              setErrorMsg(err.response?.data?.error || 'Verification failed. Please contact support.');
            } finally {
              setLoading(false);
            }
          },
          prefill: {
            name: user?.name || '',
            email: user?.email || '',
          },
          theme: {
            color: '#0c4737', // Brand Forest Green
          },
          modal: {
            ondismiss: function () {
              setLoading(false);
            }
          }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.error || 'Failed to initialize payment process.');
      setLoading(false);
    }
  };

  // Mock checkout handler
  const handleMockCheckoutSubmit = async () => {
    if (!mockOrder) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      await API.post('/subscription/razorpay/verify-payment', {
        razorpay_order_id: mockOrder.order_id,
        razorpay_payment_id: `pay_mock_${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        razorpay_signature: 'mock_signature_approved',
        planType: billingCycle,
        isMockBypass: true
      });
      await refreshBusinessProfile();
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.error || 'Mock upgrade failed.');
    } finally {
      setLoading(false);
    }
  };

  const planFeatures = [
    'Unlock Module 6 Reports & Advanced Analytics',
    'Automated email reminders scan (Day 7, 14, 30 overdue)',
    'Unlimited active client profiles registration',
    'Premium branding (remove watermarks, custom PDF banner)',
    'Export reports to CSV and Microsoft Excel format',
    'Remittance instructions listed on invoices',
  ];

  return (
    <div className="fixed inset-0 bg-[#06121E]/65 backdrop-blur-md z-[1000] flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white rounded-3xl border border-navy/5 shadow-2xl p-6 md:p-8 flex flex-col gap-6 animate-float-fast max-h-[95vh] overflow-y-auto relative">
        {/* Blur backgrounds */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-green-mint/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-green/5 rounded-full blur-3xl pointer-events-none" />

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 bg-navy/5 hover:bg-navy/10 rounded-full text-text-secondary transition-colors cursor-pointer"
        >
          <X className="h-4.5 w-4.5" />
        </button>

        {mockOrder ? (
          /* ==========================================
             MOCK CHECKOUT SCREEN
             ========================================== */
          <div className="flex flex-col gap-6 items-center text-center py-4">
            <div className="p-4 bg-green/10 text-green rounded-2xl">
              <CreditCard className="h-10 w-10" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-navy">Mock Checkout Sandbox</h3>
              <p className="text-xs text-text-secondary font-semibold mt-1">
                Razorpay API keys are not configured. Testing premium billing bypass.
              </p>
            </div>

            {/* Mock Credit Card Graphics */}
            <div className="w-full max-w-xs h-44 bg-gradient-to-br from-[#0c4737] to-[#061b2d] rounded-2xl p-5 text-white flex flex-col justify-between shadow-lg relative overflow-hidden text-left font-mono select-none">
              <div className="absolute right-0 bottom-0 w-32 h-32 bg-white/5 rounded-full translate-x-12 translate-y-12 blur-xl" />
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-black tracking-widest uppercase opacity-75">BillHouse Test Card</span>
                <span className="text-sm font-extrabold">₹{billingCycle === 'monthly' ? '299' : '2,499'}</span>
              </div>
              <div className="text-base font-bold tracking-widest">
                ••••  ••••  ••••  1234
              </div>
              <div className="flex justify-between items-end">
                <div>
                  <span className="text-[8px] uppercase opacity-50 block leading-none">Holder</span>
                  <span className="text-[10px] font-black uppercase tracking-wider">{user?.name || 'Alex Johnson'}</span>
                </div>
                <div>
                  <span className="text-[8px] uppercase opacity-50 block leading-none">Expires</span>
                  <span className="text-[10px] font-black tracking-wider">12 / 30</span>
                </div>
              </div>
            </div>

            <div className="w-full bg-[#FAFCFB] border border-navy/5 p-4 rounded-2xl text-left text-xs font-semibold text-text-secondary flex flex-col gap-1.5">
              <div className="flex justify-between text-navy">
                <span>Selected Plan</span>
                <span className="font-extrabold capitalize">{billingCycle} Premium</span>
              </div>
              <div className="flex justify-between text-navy">
                <span>Price</span>
                <span className="font-black text-green-dark">₹{billingCycle === 'monthly' ? '299.00 / mo' : '2,499.00 / yr'}</span>
              </div>
            </div>

            {errorMsg && (
              <div className="w-full p-3 bg-danger/10 border border-danger/30 text-danger text-xs font-bold rounded-xl text-left">
                {errorMsg}
              </div>
            )}

            <div className="flex w-full gap-3 mt-2">
              <Button
                variant="outline"
                onClick={() => setMockOrder(null)}
                className="flex-1 py-3 text-xs font-bold border-navy/15 text-navy hover:bg-navy/5"
              >
                Back
              </Button>
              <Button
                variant="primary"
                onClick={handleMockCheckoutSubmit}
                isLoading={loading}
                className="flex-1 py-3 text-xs font-black bg-green hover:bg-green-dark text-white rounded-xl shadow-md"
              >
                Mock Upgrade Confirm
              </Button>
            </div>
          </div>
        ) : (
          /* ==========================================
             SUBSCRIPTION SELECTION SCREEN
             ========================================== */
          <>
            {/* Header */}
            <div className="text-center flex flex-col items-center gap-2">
              <div className="p-3 bg-green/10 text-green rounded-full flex items-center justify-center animate-pulse">
                <Sparkles className="h-6 w-6 text-green" />
              </div>
              <h3 className="text-xl md:text-2xl font-black text-navy mt-1">Upgrade to Professional</h3>
              <p className="text-xs text-text-secondary max-w-sm font-semibold">
                Unlock automated email schedules, financial charts, and print-ready PDF statements.
              </p>
            </div>

            {/* Toggle Billing Cycle */}
            <div className="flex justify-center mt-2">
              <div className="bg-navy/5 border border-navy/5 rounded-2xl p-1 flex gap-1 shadow-inner max-w-xs w-full">
                <button
                  type="button"
                  onClick={() => setBillingCycle('monthly')}
                  className={`flex-1 py-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
                    billingCycle === 'monthly'
                      ? 'bg-white text-navy shadow-sm'
                      : 'text-text-secondary hover:text-navy'
                  }`}
                >
                  Monthly (₹299/mo)
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle('annual')}
                  className={`flex-1 py-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer relative ${
                    billingCycle === 'annual'
                      ? 'bg-white text-navy shadow-sm'
                      : 'text-text-secondary hover:text-navy'
                  }`}
                >
                  Annual (₹2,499/yr)
                  <span className="absolute -top-3 -right-2 bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full shadow">
                    SAVE 30%
                  </span>
                </button>
              </div>
            </div>

            {/* Features list */}
            <div className="flex flex-col gap-3 bg-[#FAFCFB] border border-navy/5 p-5 rounded-2xl">
              <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-text-secondary mb-1">
                Included in Professional Plan:
              </h4>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                {planFeatures.map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs font-semibold text-navy/85 leading-normal">
                    <Check className="h-4 w-4 text-green shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            {errorMsg && (
              <div className="p-3.5 bg-danger/10 border border-danger/35 text-danger text-xs font-bold rounded-xl">
                {errorMsg}
              </div>
            )}

            {/* Remittance Compliance / Checkout Protection */}
            <div className="flex items-center gap-2 text-[10px] text-text-secondary/80 font-semibold justify-center">
              <ShieldCheck className="h-4 w-4 text-green" />
              <span>Secured by Razorpay. Cancel subscription anytime from dashboard settings.</span>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 border-t border-navy/5 pt-5 mt-1">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={loading}
                className="flex-1 py-3.5 text-xs font-bold border-navy/15 text-navy hover:bg-navy/5"
              >
                Close
              </Button>
              <Button
                variant="primary"
                onClick={handleUpgrade}
                isLoading={loading}
                className="flex-1 py-3.5 text-xs font-black bg-[#0C4737] hover:bg-[#0A3B2F] text-white shadow-md rounded-xl flex items-center justify-center gap-2"
              >
                <Zap className="h-4 w-4 text-white fill-white shrink-0" />
                <span>Upgrade (₹{billingCycle === 'monthly' ? '299' : '2,499'})</span>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default UpgradeModal;
