import api from './api';

export interface BookingData {
    professionalId: number;
    serviceType: string;
    preferredDate: string;
    location: string;
    notes: string;
    agreedPrice: number;
}

export interface Booking {
    id: number;
    clientId: number;
    professionalId: number;
    serviceType: string;
    preferredDate: string;
    location: string;
    notes: string;
    agreedPrice: number;
    primpFeeRate: number;
    primpFee: number;
    totalAmount: number;
    status: string;
    createdAt: string;
    updatedAt: string;
    paymentReference?: string;
}

export interface BookingStatusHistoryEntry {
    id: number;
    bookingId: number;
    status: string;
    changedAt: string;
    changedBy: number;
}

export interface FeesSummary {
    professionalId: number;
    totalPrimpFeesCollected: number;
}

export const createBooking = async (data: BookingData): Promise<Booking> => {
    const response = await api.post<Booking>('/api/bookings', data);
    return response.data;
};

export const getClientBookings = async (clientId: number): Promise<Booking[]> => {
    const response = await api.get<Booking[]>(`/api/bookings/client/${clientId}`);
    return response.data;
};

export const getProfessionalBookings = async (professionalId: number): Promise<Booking[]> => {
    const response = await api.get<Booking[]>(`/api/bookings/professional/${professionalId}`);
    return response.data;
};

export const getFeesSummary = async (professionalId: number): Promise<FeesSummary> => {
    const response = await api.get<FeesSummary>(`/api/bookings/professional/${professionalId}/fees-summary`);
    return response.data;
};

export const updateBookingStatus = async (bookingId: number, status: string): Promise<Booking> => {
    const response = await api.put<Booking>(`/api/bookings/${bookingId}/status?status=${status}`);
    return response.data;
};

export const closeBooking = async (bookingId: number): Promise<Booking> => {
    const response = await api.put<Booking>(`/api/bookings/${bookingId}/close`);
    return response.data;
};

export const getBookingHistory = async (bookingId: number): Promise<BookingStatusHistoryEntry[]> => {
    const response = await api.get<BookingStatusHistoryEntry[]>(`/api/bookings/${bookingId}/history`);
    return response.data;
};