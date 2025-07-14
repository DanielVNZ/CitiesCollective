import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey, createApiResponse, createApiErrorResponse } from 'app/utils/apiAuth';
import { getCityById, getCityImages } from 'app/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate using API key
    const authenticatedUser = await authenticateApiKey(request);
    if (!authenticatedUser) {
      return createApiErrorResponse('Invalid or missing API key', 401);
    }

    const cityId = parseInt(params.id);
    if (isNaN(cityId)) {
      return createApiErrorResponse('Invalid city ID', 400);
    }

    // Get city information
    const city = await getCityById(cityId);
    if (!city) {
      return createApiErrorResponse('City not found', 404);
    }

    // Get city images
    const images = await getCityImages(cityId);

    // Return city information
    return createApiResponse({
      success: true,
      city: {
        id: city.id,
        cityName: city.cityName,
        mapName: city.mapName,
        population: city.population,
        money: city.money,
        xp: city.xp,
        theme: city.theme,
        gameMode: city.gameMode,
        simulationDate: city.simulationDate,
        description: city.description,
        downloadable: city.downloadable,
        uploadedAt: city.uploadedAt,
        imageCount: images.length,
        images: images.map(img => ({
          id: img.id,
          fileName: img.fileName,
          originalName: img.originalName,
          thumbnailPath: img.thumbnailPath,
          mediumPath: img.mediumPath,
          largePath: img.largePath,
          originalPath: img.originalPath,
          isPrimary: img.isPrimary,
          sortOrder: img.sortOrder
        }))
      },
      message: 'City information retrieved successfully'
    });

  } catch (error) {
    console.error('City API error:', error);
    return createApiErrorResponse('Internal server error', 500);
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
    },
  });
} 