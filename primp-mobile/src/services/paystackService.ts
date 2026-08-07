import api from './api';
import { Booking } from './bookingService';

export interface PaymentInitializeData {
    professionalId: number;
    serviceType: string;
    preferredDate: string;
    location: string;
    notes: string;
    agreedPrice: number;
    email: string;
}

export interface PaymentInitializeResult {
    reference: string;
    accessCode: string;
    authorizationUrl: string;
    publicKey: string;
    amount: number;
    currency: string;
    email: string;
}

export const initializePayment = async (
    data: PaymentInitializeData
): Promise<PaymentInitializeResult> => {
    const response = await api.post<PaymentInitializeResult>(
        '/api/bookings/payments/initialize',
        data
    );
    return response.data;
};

export const verifyPayment = async (reference: string): Promise<Booking> => {
    const response = await api.post<Booking>('/api/bookings/payments/verify', {
        reference,
    });
    return response.data;
};