import api from './api';

export type PremiumFeature =
    | 'PRIORITY_LISTING'
    | 'EXTENDED_PORTFOLIO'
    | 'VERIFIED_BADGE'
    | 'CLIENT_LOYALTY_TOOLS'
    | 'EARNINGS_ANALYTICS';

export type PremiumDuration = 'ONE_TIME' | 'WEEKLY' | 'MONTHLY';

export interface PremiumStatus {
    id: number;
    isPriorityListingActive?: boolean;
    hasExtendedPortfolio?: boolean;
    isVerifiedBadge?: boolean;
    hasClientLoyaltyTools?: boolean;
    hasEarningsAnalytics?: boolean;
    priorityListingExpiresAt?: string | null;
    clientLoyaltyToolsExpiresAt?: string | null;
    earningsAnalyticsExpiresAt?: string | null;
}

export interface PremiumPaymentInitializeResult {
    reference: string;
    accessCode: string;
    authorizationUrl: string;
    publicKey: string;
    amount: number;
    currency: string;
    email: string;
    feature: PremiumFeature;
    duration: PremiumDuration;
}

export const initializePremiumPayment = async (
    feature: PremiumFeature,
    email: string,
    duration?: PremiumDuration
): Promise<PremiumPaymentInitializeResult> => {
    const response = await api.post<PremiumPaymentInitializeResult>('/api/auth/premium/initialize', {
        feature,
        email,
        duration,
    });
    return response.data;
};

export const verifyPremiumPayment = async (reference: string): Promise<PremiumStatus> => {
    const response = await api.post<PremiumStatus>('/api/auth/premium/verify', { reference });
    return response.data;
};