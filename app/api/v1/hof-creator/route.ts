import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey, createApiResponse, createApiErrorResponse } from 'app/utils/apiAuth';
import { getUserById, getCityById } from 'app/db';

export async function GET(request: NextRequest) {
  try {
    // Authenticate using API key
    const authenticatedUser = await authenticateApiKey(request);
    if (!authenticatedUser) {
      return createApiErrorResponse('Invalid or missing API key', 401);
    }

    // Get user information
    const user = await getUserById(authenticatedUser.userId);
    if (!user) {
      return createApiErrorResponse('User not found', 404);
    }

    // Return HoF Creator ID information
    return createApiResponse({
      success: true,
      hofCreatorId: user.hofCreatorId || authenticatedUser.userId.toString(),
      username: user.username || user.email,
      apiKeyName: authenticatedUser.apiKeyName,
      message: 'HoF Creator ID retrieved successfully'
    });

  } catch (error) {
    console.error('HoF Creator ID API error:', error);
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