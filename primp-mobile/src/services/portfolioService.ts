import api from './api';

export interface PortfolioPost {
    id: number;
    professionalId: number;
    professionalName: string;
    specialty: string;
    professionalPhotoUrl?: string;
    imageUrl: string;
    styleTag: string;
    caption: string;
    mediaType: string;
    createdAt: string;
}

export const createPortfolioPost = async (
    imageUrl: string,
    styleTag: string,
    caption: string,
    mediaType: string = 'image'
): Promise<PortfolioPost> => {
    const response = await api.post<PortfolioPost>('/api/auth/portfolio', {
        imageUrl,
        styleTag,
        caption,
        mediaType,
    });
    return response.data;
};

export const getPortfolioFeed = async (): Promise<PortfolioPost[]> => {
    const response = await api.get<PortfolioPost[]>('/api/auth/portfolio/feed');
    return response.data;
};

export const getProfessionalPortfolio = async (
    professionalId: number
): Promise<PortfolioPost[]> => {
    const response = await api.get<PortfolioPost[]>(
        `/api/auth/portfolio/${professionalId}`
    );
    return response.data;
};

export const deletePortfolioPost = async (postId: number): Promise<void> => {
    await api.delete(`/api/auth/portfolio/${postId}`);
};