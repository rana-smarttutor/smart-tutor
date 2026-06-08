import {
  handleUpload,
  type HandleUploadBody,
} from '@vercel/blob/client';
import { NextResponse } from 'next/server';

import { getSessionUser } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type UploadPayload = {
  assetType?: 'book' | 'thumbnail';
  description?: string;
};

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await getSessionUser();
    const role = String(session?.role || 'student').toLowerCase();

    if (role !== 'admin' && role !== 'educator') {
      return NextResponse.json(
        {
          success: false,
          message: 'Only admins and educators can upload library materials.',
        },
        { status: 403 }
      );
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json(
        {
          success: false,
          message: 'BLOB_READ_WRITE_TOKEN is missing.',
        },
        { status: 500 }
      );
    }

    const body = (await request.json()) as HandleUploadBody;

    const jsonResponse = await handleUpload({
      request,
      body,

      onBeforeGenerateToken: async (pathname, clientPayload) => {
        let payload: UploadPayload = {};

        try {
          payload = clientPayload
            ? (JSON.parse(clientPayload) as UploadPayload)
            : {};
        } catch {
          throw new Error('Invalid upload information.');
        }

        const isBookUpload =
          payload.assetType === 'book' &&
          pathname.startsWith('digital-library/books/') &&
          pathname.toLowerCase().endsWith('.pdf');

        const isThumbnailUpload =
          payload.assetType === 'thumbnail' &&
          pathname.startsWith('digital-library/thumbnails/') &&
          /\.(png|jpg|jpeg|webp)$/i.test(pathname);

        if (!isBookUpload && !isThumbnailUpload) {
          throw new Error('Invalid digital library file type.');
        }

        return {
          access: 'public',
          addRandomSuffix: false,
          allowedContentTypes: isBookUpload
            ? ['application/pdf']
            : ['image/png', 'image/jpeg', 'image/webp'],
          maximumSizeInBytes: isBookUpload
            ? 200 * 1024 * 1024
            : 5 * 1024 * 1024,
          tokenPayload: JSON.stringify({
            assetType: payload.assetType,
            description: payload.description,
            pathname,
          }),
        };
      },

      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log('Digital library upload completed:', {
          pathname: blob.pathname,
          url: blob.url,
          tokenPayload,
        });
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error('Digital library client upload error:', error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to prepare digital library upload.',
      },
      { status: 400 }
    );
  }
}