import { NextRequest } from 'next/server';
import { authenticateApiKey, createApiResponse, createApiErrorResponse } from 'app/utils/apiAuth';
import { getCitiesByUser, getUserByUsernameOrEmail, getCityImages, getCityLikes, getCityCommentCount } from 'app/db';

export async function GET(request: NextRequest) {
  try {
    // Authenticate API key
    const authUser = await authenticateApiKey(request);
    if (!authUser) {
      return createApiErrorResponse('Invalid or missing API key', 401);
    }

    // Get username from query parameters
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    if (!username) {
      return createApiErrorResponse('Username parameter is required', 400);
    }

    // Get user by username
    const users = await getUserByUsernameOrEmail(username);
    if (users.length === 0) {
      return createApiErrorResponse('User not found', 404);
    }

    const user = users[0];

    // Get cities for the user
    const cities = await getCitiesByUser(user.id);

    // Enhance cities with additional data
    const enhancedCities = await Promise.all(
      cities.map(async (city) => {
        // Get primary image
        const images = await getCityImages(city.id);
        const primaryImage = images.find(img => img.isPrimary) || images[0];

        // Get like count
        const likeCount = await getCityLikes(city.id);

        // Get comment count
        const commentCount = await getCityCommentCount(city.id);

        // Create download URL if downloadable
        const downloadUrl = city.downloadable 
          ? `https://citiescollective.space/api/cities/${city.id}/download`
          : null;

        return {
          id: city.id,
          cityName: city.cityName,
          mapName: city.mapName,
          population: city.population,
          money: city.money,
          xp: city.xp,
          theme: city.theme,
          gameMode: city.gameMode,
          downloadable: city.downloadable,
          downloadUrl,
          uploadedAt: city.uploadedAt,
          primaryImage: primaryImage ? {
            thumbnail: primaryImage.thumbnailPath,
            medium: primaryImage.mediumPath,
            large: primaryImage.largePath,
            original: primaryImage.originalPath
          } : null,
          stats: {
            likes: likeCount,
            comments: commentCount
          },
          user: {
            id: user.id,
            username: user.username,
            name: user.name
          }
        };
      })
    );

    return createApiResponse({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          name: user.name
        },
        cities: enhancedCities,
        total: enhancedCities.length
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