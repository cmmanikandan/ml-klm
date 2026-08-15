export const CLOUDINARY_CONFIG = {
  cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dughdt8sf',
  apiKey: import.meta.env.VITE_CLOUDINARY_API_KEY || '653356226116288',
  uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'qubink_uploads'
};

export const uploadImageToCloudinary = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`,
    {
      method: 'POST',
      body: formData
    }
  );

  if (!response.ok) {
    throw new Error('Cloudinary image upload failed');
  }

  const data = await response.json();
  return data.secure_url;
};
