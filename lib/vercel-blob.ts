import { put, list, del, head } from '@vercel/blob';

/**
 * Upload a file to Vercel Blob storage
 */
export async function uploadFile(
  file: File | Buffer,
  filename: string,
  options?: {
    contentType?: string;
    addRandomSuffix?: boolean;
  }
) {
  try {
    const blob = await put(filename, file, {
      access: 'public',
      contentType: options?.contentType,
      addRandomSuffix: options?.addRandomSuffix || false,
    });

    return blob;
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
export async function listFiles(prefix?: string) {
  try {
    const { blobs } = await list({ prefix });
    return blobs;
  } catch (error) {
    console.error('Error listing files:', error);
    return [];
  }
}

/**
 * Get file metadata
 */
export async function getFileInfo(url: string) {
  try {
    const blob = await head(url);
    return blob;
  } catch (error) {
    console.error('Error getting file info:', error);
    return null;
  }
}

/**
 * Delete a file
 */
export async function deleteFile(url: string) {
  try {
    await del(url);
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
}

/**
 * Delete all files for a post
 */
export async function deletePostFiles(postSlug: string) {
  try {
    const files = await listFiles(`posts/${postSlug}/`);
    for (const file of files) {
      await deleteFile(file.url);
    }
    return true;
  } catch (error) {
    console.error('Error deleting post files:', error);
    return false;
  }
}

