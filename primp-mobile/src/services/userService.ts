import api from './api';

export interface Professional {
    id: number;
    name: string;
    location: string;
    role: string;
    phone: string;
    specialty: string;
    bio: string;
    profilePhotoUrl?: string;
    isAvailable?: boolean;
    averageRating?: number;
    totalReviews?: number;
    isPriorityListingActive?: boolean;
    hasExtendedPortfolio?: boolean;
    isVerifiedBadge?: boolean;
    workLatitude?: number;
    workLongitude?: number;
    serviceRadiusKm?: number;
}

export const getProfessionals = async (): Promise<Professional[]> => {
    const response = await api.get<Professional[]>('/api/auth/professionals');
    return response.data;
};