import { NextRequest, NextResponse } from 'next/server';
import { auth } from 'app/auth';
import { getUser, deleteCityImage } from 'app/db';
import { deleteImageFiles } from 'app/utils/imageProcessing';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate user
    const session = await auth();
    const userEmail = session?.user?.email;
    if (!userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user ID
    const users = await getUser(userEmail);
    const user = users && users[0];
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Parse image ID
    const imageId = parseInt(params.id);
    if (isNaN(imageId)) {
      return NextResponse.json({ error: 'Invalid image ID' }, { status: 400 });
    }

    // Delete image from database (includes ownership check)
    const result = await deleteCityImage(imageId, user.id);
    
    if (!result) {
      return NextResponse.json({ error: 'Image not found or access denied' }, { status: 404 });
    }

    // Delete image files from filesystem
    try {
      if (result.imagePaths.thumbnailPath && result.imagePaths.mediumPath && 
          result.imagePaths.largePath && result.imagePaths.originalPath) {
        await deleteImageFiles({
          thumbnailPath: result.imagePaths.thumbnailPath,
          mediumPath: result.imagePaths.mediumPath,
          largePath: result.imagePaths.largePath,
          originalPath: result.imagePaths.originalPath,
        });
      }
    } catch (fileError) {
      console.warn('Failed to delete image files:', fileError);
      // Don't fail the request if file deletion fails
    }

    return NextResponse.json({
      message: 'Image deleted successfully',
      imageId: result.deletedImage.id,
    });

  } catch (error) {
    console.error('Delete image error:', error);
    return NextResponse.json({ 
      error: 'Failed to delete image', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 