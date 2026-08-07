import api from './api';

export interface EarningsAnalytics {
    professionalId: number;
    totalClosedBookings: number;
    totalRevenue: number;
    totalPrimpFees: number;
    totalNetEarnings: number;
    averageBookingValue: number;
    revenueByMonth: Record<string, number>;
    bookingCountByMonth: Record<string, number>;
    revenueByServiceType: Record<string, number>;
    bookingCountByServiceType: Record<string, number>;
}

export const getEarningsAnalytics = async (professionalId: number): Promise<EarningsAnalytics> => {
    const response = await api.get<EarningsAnalytics>(`/api/bookings/professional/${professionalId}/analytics`);
    return response.data;
};