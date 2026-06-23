import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import API from '../utils/api';
import { useAuth } from './AuthContext';

export interface BusinessProfile {
  _id?: string;
  tenantId: string;
  name: string;
  type: 'freelancer' | 'agency' | 'business';
  email?: string;
  phone?: string;
  legalName?: string;
  website?: string;
  industry?: string;
  // Address
  address?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
  // Tax
  gstNumber?: string;
  panNumber?: string;
  taxRegistrationNumber?: string;
  // Branding
  logoBase64?: string;
  bannerBase64?: string;
  // Invoice config
  invoicePrefix: string;
  invoiceNextNumber: number;
  currency: string;
  timeZone?: string;
  invoiceNumberFormat?: string;
  // Bank details
  bankName?: string;
  bankAccount?: string;
  bankIfsc?: string;
  bankUpi?: string;
  // Notification config
  remindersEnabled?: boolean;
  remindersIntervals?: number[];
  // Pro subscription details
  isPro?: boolean;
  subscriptionPlan?: 'monthly' | 'annual' | 'none';
  subscriptionExpiresAt?: string;
}

interface BusinessContextType {
  businessProfile: BusinessProfile | null;
  isLoadingBusiness: boolean;
  hasCompletedOnboarding: boolean;
  refreshBusinessProfile: () => Promise<void>;
  setOnboardingComplete: (profile: BusinessProfile) => void;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export const BusinessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading: authLoading } = useAuth();
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [isLoadingBusiness, setIsLoadingBusiness] = useState<boolean>(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean>(false);

  const fetchBusinessProfile = useCallback(async () => {
    if (!user) {
      setBusinessProfile(null);
      setHasCompletedOnboarding(false);
      setIsLoadingBusiness(false);
      return;
    }
    try {
      setIsLoadingBusiness(true);
      const response = await API.get('/business');
      const profile = response.data?.business;
      setBusinessProfile(profile || null);
      setHasCompletedOnboarding(!!profile);
    } catch (error) {
      console.error('Failed to fetch business profile:', error);
      setBusinessProfile(null);
      setHasCompletedOnboarding(false);
    } finally {
      setIsLoadingBusiness(false);
    }
  }, [user]);

  // Fetch business profile when user auth is resolved
  useEffect(() => {
    if (!authLoading) {
      fetchBusinessProfile();
    }
  }, [authLoading, fetchBusinessProfile]);

  const refreshBusinessProfile = async () => {
    await fetchBusinessProfile();
  };

  const setOnboardingComplete = (profile: BusinessProfile) => {
    setBusinessProfile(profile);
    setHasCompletedOnboarding(true);
  };

  return (
    <BusinessContext.Provider
      value={{
        businessProfile,
        isLoadingBusiness,
        hasCompletedOnboarding,
        refreshBusinessProfile,
        setOnboardingComplete
      }}
    >
      {children}
    </BusinessContext.Provider>
  );
};

export const useBusinessProfile = () => {
  const context = useContext(BusinessContext);
  if (context === undefined) {
    throw new Error('useBusinessProfile must be used within a BusinessProvider');
  }
  return context;
};

// Helper function to resolve static logo path urls or fallback to base64 strings
export const getLogoUrl = (pathOrBase64?: string): string => {
  if (!pathOrBase64) return '';
  if (pathOrBase64.startsWith('/uploads')) {
    const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const backendUrl = rawApiUrl.replace(/\/api$/, '');
    return `${backendUrl}${pathOrBase64}`;
  }
  return pathOrBase64;
};
