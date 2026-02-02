import { supabase, isSupabaseConfigured } from './supabase';

/**
 * Upload a file to Supabase Storage
 */
export async function uploadFile(
  file: File | Buffer,
  filename: string,
  options?: {
    contentType?: string;
    bucket?: string;
  }
) {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured. Please set NEXT_PUBLIC_SUPABASE_URL and SERVICE_ROLE_KEY');
  }

  const bucket = options?.bucket || 'blog-images';
  const contentType = options?.contentType || 'image/*';

  try {
    // Convert File or Buffer to ArrayBuffer if needed
    let fileData: ArrayBuffer | Buffer;
    if (file instanceof File) {
      fileData = await file.arrayBuffer();
    } else {
      fileData = file;
    }

    const { data, error } = await supabase!
      .storage
      .from(bucket)
      .upload(filename, fileData, {
        contentType,
        upsert: true,
      });

    if (error) {
      // Check if bucket doesn't exist
      if (error.message?.includes('Bucket not found') || error.message?.includes('not found')) {
        throw new Error(
          `Storage bucket "${bucket}" does not exist. Please create it in your Supabase dashboard: ` +
          `Storage → Create bucket → Name: "${bucket}" → Set to Public`
        );
      }
      throw error;
    }

    if (!data) {
      throw new Error('Upload failed - no data returned');
    }

    // Get public URL
    const { data: urlData } = supabase!
      .storage
      .from(bucket)
      .getPublicUrl(filename);

    return {
      url: urlData.publicUrl,
      path: data.path,
      pathname: data.path,
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}

/**
 * Upload an image for a blog post
 */
export async function uploadPostImage(
  file: File | Buffer,
  postSlug: string,
  imageName: string
) {
  const filename = `posts/${postSlug}/${imageName}`;
  return uploadFile(file, filename, {
    contentType: 'image/*',
  });
}

/**
 * List all files in a directory
 */
export async function listFiles(prefix?: string, bucket: string = 'blog-images') {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    const { data, error } = await supabase!
      .storage
      .from(bucket)
      .list(prefix || '', {
        limit: 100,
        sortBy: { column: 'name', order: 'asc' },
      });

    if (error) {
      console.error('Error listing files:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error listing files:', error);
    return [];
  }
}

/**
 * Get file metadata
 */
export async function getFileInfo(url: string, bucket: string = 'blog-images') {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    // Extract path from URL
    const urlObj = new URL(url);
    const path = urlObj.pathname.split(`${bucket}/`)[1];

    if (!path) {
      return null;
    }

    const { data, error } = await supabase!
      .storage
      .from(bucket)
      .list(path.split('/').slice(0, -1).join('/'), {
        search: path.split('/').pop(),
      });

    if (error || !data || data.length === 0) {
      return null;
    }

    return data[0];
  } catch (error) {
    console.error('Error getting file info:', error);
    return null;
  }
}

/**
 * Delete a file
 */
export async function deleteFile(url: string, bucket: string = 'blog-images') {
  if (!isSupabaseConfigured()) {
    return false;
  }

  try {
    // Extract path from URL
    const urlObj = new URL(url);
    const path = urlObj.pathname.split(`${bucket}/`)[1];

    if (!path) {
      return false;
    }

    const { error } = await supabase!
      .storage
      .from(bucket)
      .remove([path]);

    if (error) {
      console.error('Error deleting file:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
}

/**
 * Rename a file in Supabase Storage
 * This is done by copying to new path and deleting the old one
 */
export async function renameFile(oldUrl: string, newFilename: string, bucket: string = 'blog-images'): Promise<{ url: string; path: string } | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    // Extract path from URL
    const urlObj = new URL(oldUrl);
    const oldPath = urlObj.pathname.split(`${bucket}/`)[1];

    if (!oldPath) {
      return null;
    }

    // Build new path with same directory but new filename
    const pathParts = oldPath.split('/');
    pathParts[pathParts.length - 1] = newFilename;
    const newPath = pathParts.join('/');

    // Download the file
    const { data: fileData, error: downloadError } = await supabase!
      .storage
      .from(bucket)
      .download(oldPath);

    if (downloadError || !fileData) {
      console.error('Error downloading file for rename:', downloadError);
      return null;
    }

    // Upload to new path
    const arrayBuffer = await fileData.arrayBuffer();
    const { data: uploadData, error: uploadError } = await supabase!
      .storage
      .from(bucket)
      .upload(newPath, arrayBuffer, {
        contentType: fileData.type,
        upsert: true,
      });

    if (uploadError) {
      console.error('Error uploading renamed file:', uploadError);
      return null;
    }

    // Delete old file
    const { error: deleteError } = await supabase!
      .storage
      .from(bucket)
      .remove([oldPath]);

    if (deleteError) {
      console.error('Error deleting old file:', deleteError);
      // Don't return null here - the new file was created successfully
    }

    // Get public URL for new file
    const { data: urlData } = supabase!
      .storage
      .from(bucket)
      .getPublicUrl(newPath);

    return {
      url: urlData.publicUrl,
      path: uploadData.path,
    };
  } catch (error) {
    console.error('Error renaming file:', error);
    return null;
  }
}

/**
 * Delete all files for a post
 */
export async function deletePostFiles(postSlug: string, bucket: string = 'blog-images') {
  if (!isSupabaseConfigured()) {
    return false;
  }

  try {
    const prefix = `posts/${postSlug}/`;
    const files = await listFiles(prefix, bucket);

    if (files.length === 0) {
      return true;
    }

    const paths = files.map(file => `${prefix}${file.name}`);
    const { error } = await supabase!
      .storage
      .from(bucket)
      .remove(paths);

    if (error) {
      console.error('Error deleting post files:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting post files:', error);
    return false;
  }
}

