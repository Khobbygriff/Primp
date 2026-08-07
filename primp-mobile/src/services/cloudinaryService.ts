const CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || '';
const UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '';

export const uploadImage = async (imageUri: string): Promise<string> => {
    const formData = new FormData();

    formData.append('file', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'portfolio.jpg',
    } as any);

    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('folder', 'primp/portfolio');

    const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        {
            method: 'POST',
            body: formData,
        }
    );

    const data = await response.json();

    if (!data.secure_url) {
        throw new Error('Image upload failed');
    }

    // Apply Cloudinary transformations for mobile optimization
    return optimizeUrl(data.secure_url);
};

export const uploadVideo = async (videoUri: string): Promise<string> => {
    const formData = new FormData();

    formData.append('file', {
        uri: videoUri,
        type: 'video/mp4',
        name: 'portfolio.mp4',
    } as any);

    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('folder', 'primp/portfolio');
    formData.append('resource_type', 'video');

    const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/video/upload`,
        {
            method: 'POST',
            body: formData,
        }
    );

    const data = await response.json();

    if (!data.secure_url) {
        throw new Error('Video upload failed');
    }

    return data.secure_url;
};

export const getVideoThumbnailUrl = (videoUrl: string): string => {
    return videoUrl
        .replace('/video/upload/', '/video/upload/q_auto,w_800,so_0/')
        .replace('.mp4', '.jpg');
};

export const optimizeUrl = (url: string, width: number = 800): string => {
    return url.replace(
        '/upload/',
        `/upload/q_auto,f_auto,w_${width},c_limit/`
    );
};

export const getThumbnailUrl = (url: string): string => {
    return url.replace(
        '/upload/',
        '/upload/q_auto,f_auto,w_400,h_400,c_fill,g_auto/'
    );
};

export const getProfilePhotoUrl = (url: string): string => {
    return url.replace(
        '/upload/',
        '/upload/q_auto,f_auto,w_200,h_200,c_fill,g_face,r_max/'
    );
};