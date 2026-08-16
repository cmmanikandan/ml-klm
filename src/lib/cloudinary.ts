export const CLOUDINARY_CONFIG = {
  cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dughdt8sf',
  apiKey: import.meta.env.VITE_CLOUDINARY_API_KEY || '653356226116288',
  uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'qubink_uploads'
};

/**
 * Upload any file (image, PDF, video, etc.) to Cloudinary using the 'auto' resource type.
 * NOTE: Your upload preset must be set to "Unsigned" in the Cloudinary dashboard.
 * Go to: Cloudinary Console → Settings → Upload → Upload Presets → qubink_uploads → Mode = Unsigned
 */
export const uploadFileToCloudinary = async (
  file: File,
  onProgress?: (percent: number) => void
): Promise<{ url: string; resourceType: string; format: string }> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);

  // Detect resource type
  const isPdf = file.type === 'application/pdf';
  const isVideo = file.type.startsWith('video/');
  const resourceType = isVideo ? 'video' : 'auto'; // 'auto' handles both images and PDFs

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress(percent);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          if (data.error) {
            reject(new Error(data.error.message || 'Cloudinary upload failed'));
            return;
          }
          resolve({
            url: data.secure_url,
            resourceType: data.resource_type,
            format: data.format
          });
        } catch {
          reject(new Error('Invalid Cloudinary response'));
        }
      } else {
        let errMsg = 'Cloudinary upload failed';
        try {
          const errData = JSON.parse(xhr.responseText);
          if (errData?.error?.message) {
            errMsg = errData.error.message;
            // Common error: preset not set to unsigned
            if (errMsg.includes('unsigned')) {
              errMsg =
                'Upload preset must be set to "Unsigned" in Cloudinary dashboard. Go to: Cloudinary Console → Settings → Upload → Upload Presets → qubink_uploads → Mode = Unsigned';
            }
          }
        } catch {}
        reject(new Error(errMsg));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Network error during Cloudinary upload'));
    });

    xhr.open(
      'POST',
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/${resourceType}/upload`
    );
    xhr.send(formData);
  });
};

/**
 * Convenience wrapper for image uploads — returns just the secure URL.
 * @deprecated Use uploadFileToCloudinary for full control.
 */
export const uploadImageToCloudinary = async (file: File): Promise<string> => {
  const result = await uploadFileToCloudinary(file);
  return result.url;
};
