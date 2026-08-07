import api from './api';

export interface RegisterData {
    name: string;
    email: string;
    password: string;
    role: string;
    phone: string;
    location: string;
}

export interface LoginData {
    email: string;
    password: string;
}

export interface AuthResponse {
    profilePhotoUrl?: string;
    id: number;
    token: string;
    role: string;
    name: string;
}

export const register = async (data: RegisterData): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/api/auth/register', data);
    return response.data;
};

export const login = async (data: LoginData): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/api/auth/login', data);
    return response.data;
};