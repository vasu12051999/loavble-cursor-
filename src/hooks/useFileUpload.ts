import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export type StorageBucket = 'avatars' | 'job-photos' | 'message-attachments' | 'portfolio-images';

interface UseFileUploadOptions {
  bucket: StorageBucket;
  maxSizeMB?: number;
  allowedTypes?: string[];
  onSuccess?: (url: string) => void;
  onError?: (error: Error) => void;
}

interface UploadResult {
  url: string | null;
  error: Error | null;
}

export function useFileUpload(options: UseFileUploadOptions) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const {
    bucket,
    maxSizeMB = bucket === 'avatars' ? 5 : 10,
    allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    onSuccess,
    onError,
  } = options;

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    // Check file type
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
      };
    }

    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return {
        valid: false,
        error: `File too large. Maximum size: ${maxSizeMB}MB`,
      };
    }

    return { valid: true };
  };

  const uploadFile = async (file: File, userId: string): Promise<UploadResult> => {
    setUploading(true);
    setProgress(0);

    try {
      // Validate file
      const validation = validateFile(file);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 15);
      const fileName = `${userId}/${timestamp}-${randomStr}.${fileExt}`;

      // Upload file
      const { error: uploadError, data } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      setProgress(100);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      if (onSuccess) {
        onSuccess(publicUrl);
      }

      toast({
        title: 'Upload successful',
        description: 'Your file has been uploaded successfully.',
      });

      return { url: publicUrl, error: null };
    } catch (error: any) {
      const err = new Error(error.message || 'Failed to upload file');
      
      if (onError) {
        onError(err);
      }

      toast({
        title: 'Upload failed',
        description: err.message,
        variant: 'destructive',
      });

      return { url: null, error: err };
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const deleteFile = async (fileUrl: string): Promise<boolean> => {
    try {
      // Extract file path from URL
      const urlParts = fileUrl.split(`${bucket}/`);
      if (urlParts.length < 2) {
        throw new Error('Invalid file URL');
      }
      const filePath = urlParts[1];

      const { error } = await supabase.storage
        .from(bucket)
        .remove([filePath]);

      if (error) {
        throw error;
      }

      toast({
        title: 'File deleted',
        description: 'Your file has been deleted successfully.',
      });

      return true;
    } catch (error: any) {
      toast({
        title: 'Delete failed',
        description: error.message || 'Failed to delete file',
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    uploadFile,
    deleteFile,
    uploading,
    progress,
    validateFile,
  };
}
