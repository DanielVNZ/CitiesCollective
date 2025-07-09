import { NextRequest } from 'next/server';
import { authenticateApiKey, createApiResponse, createApiErrorResponse } from 'app/utils/apiAuth';
import { getCityById, getCityImages, getCityLikes, getCityCommentCount, getUserById } from 'app/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate API key
    const authUser = await authenticateApiKey(request);
    if (!authUser) {
      return createApiErrorResponse('Invalid or missing API key', 401);
    }

    // Parse city ID
    const cityId = parseInt(params.id);
    if (isNaN(cityId)) {
      return createApiErrorResponse('Invalid city ID', 400);
    }

    // Get city by ID
    const city = await getCityById(cityId);
    if (!city) {
      return createApiErrorResponse('City not found', 404);
    }

    // Get user information
    const user = await getUserById(city.userId!);
    if (!user) {
      return createApiErrorResponse('City owner not found', 404);
    }

    // Get all images for the city
    const images = await getCityImages(cityId);
    const primaryImage = images.find(img => img.isPrimary) || images[0];

    // Get like count
    const likeCount = await getCityLikes(cityId);

    // Get comment count
    const commentCount = await getCityCommentCount(cityId);

    // Create download URL if downloadable
    const downloadUrl = city.downloadable 
      ? `https://citiescollective.space/api/cities/${city.id}/download`
      : null;

    // Format images
    const formattedImages = images.map(img => ({
      id: img.id,
      fileName: img.fileName,
      originalName: img.originalName,
      fileSize: img.fileSize,
      mimeType: img.mimeType,
      width: img.width,
      height: img.height,
      isPrimary: img.isPrimary,
      sortOrder: img.sortOrder,
      uploadedAt: img.uploadedAt,
      urls: {
        thumbnail: img.thumbnailPath,
        medium: img.mediumPath,
        large: img.largePath,
        original: img.originalPath
      }
    }));

    return createApiResponse({
      success: true,
      data: {
        id: city.id,
        cityName: city.cityName,
        mapName: city.mapName,
        population: city.population,
        money: city.money,
        xp: city.xp,
        theme: city.theme,
        gameMode: city.gameMode,
        autoSave: city.autoSave,
        leftHandTraffic: city.leftHandTraffic,
        naturalDisasters: city.naturalDisasters,
        unlockAll: city.unlockAll,
        unlimitedMoney: city.unlimitedMoney,
        unlockMapTiles: city.unlockMapTiles,
        simulationDate: city.simulationDate,
        contentPrerequisites: city.contentPrerequisites,
        modsEnabled: city.modsEnabled,
        fileName: city.fileName,
        downloadable: city.downloadable,
        downloadUrl,
        uploadedAt: city.uploadedAt,
        updatedAt: city.updatedAt,
        primaryImage: primaryImage ? {
          id: primaryImage.id,
          thumbnail: primaryImage.thumbnailPath,
          medium: primaryImage.mediumPath,
          large: primaryImage.largePath,
          original: primaryImage.originalPath
        } : null,
        images: formattedImages,
        stats: {
          likes: likeCount,
          comments: commentCount,
          totalImages: images.length
        },
        user: {
          id: user.id,
          username: user.username
        }
      }
    });

  } catch (error) {
    console.error('API Error:', error);
    return createApiErrorResponse('Internal server error', 500);
  }
}

// Handle CORS preflight requests
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
    },
  });
} 