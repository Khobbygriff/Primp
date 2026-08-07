export const validateEmail = (email: string): string | null => {
    if (!email) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    return null;
};

export const validatePassword = (password: string): string | null => {
    if (!password) return 'Password is required';
    if (password.length < 6) return 'Password must be at least 6 characters';
    return null;
};

export const validateName = (name: string): string | null => {
    if (!name) return 'Name is required';
    if (name.trim().length < 2) return 'Name must be at least 2 characters';
    return null;
};

export const validatePhone = (phone: string): string | null => {
    if (!phone) return 'Phone number is required';
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone.replace(/\s/g, '')))
        return 'Please enter a valid 10-digit phone number';
    return null;
};

export const validateLocation = (location: string): string | null => {
    if (!location) return 'Location is required';
    if (location.trim().length < 3) return 'Please enter a valid location';
    return null;
};

export const validateRequired = (value: string, fieldName: string): string | null => {
    if (!value || !value.trim()) return `${fieldName} is required`;
    return null;
};