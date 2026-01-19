import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { uploadFile } from '@/lib/supabase-storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  // Protect endpoint with NextAuth (and middleware also guards /api/admin/*)
  const session = await auth();

  if (!session) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const slugHint = (formData.get('slugHint') as string | null) || 'post';

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Generate a safe filename
    const extension = file.name.split('.').pop() || 'png';
    const safeSlug = slugHint
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const filename = `posts/${safeSlug || 'post'}/${Date.now()}.${extension}`;

    // Upload to Supabase Storage
    const result = await uploadFile(file, filename, {
      contentType: file.type || `image/${extension}`,
    });

    return NextResponse.json({
      success: true,
      url: result.url,
      path: result.pathname,
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload image',
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, {
    status: 200,
    headers: {
      'Allow': 'POST, OPTIONS',
    },
  });
}

