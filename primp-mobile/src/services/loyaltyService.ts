import api from './api';

export interface LoyaltyStamp {
    clientId: number;
    clientName: string;
    stampCount: number;
    stampsUntilNextReward: number;
    rewardMilestone: boolean;
    lastBookingClosedAt: string | null;
    lastMessageSentAt: string | null;
}

export const getLoyaltyBoard = async (professionalId: number): Promise<LoyaltyStamp[]> => {
    const response = await api.get<LoyaltyStamp[]>(`/api/bookings/professional/${professionalId}/loyalty`);
    return response.data;
};

export const sendRebookingReminder = async (professionalId: number, clientId: number): Promise<void> => {
    await api.post(`/api/bookings/professional/${professionalId}/loyalty/client/${clientId}/remind`);
};

export const sendPersonalizedOffer = async (
    professionalId: number,
    clientId: number,
    message: string
): Promise<void> => {
    await api.post(`/api/bookings/professional/${professionalId}/loyalty/client/${clientId}/offer`, { message });
};