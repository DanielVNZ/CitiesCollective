import { NextRequest, NextResponse } from 'next/server';
import { getApiKeyByKey, updateApiKeyLastUsed, getUserById } from 'app/db';

export interface AuthenticatedUser {
  userId: number;
  apiKeyId: number;
  apiKeyName: string;
}

export async function authenticateApiKey(request: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    // Get API key from headers
    const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!apiKey) {
      return null;
    }

    // Get API key from database
    const apiKeys = await getApiKeyByKey(apiKey);
    
    if (apiKeys.length === 0) {
      return null;
    }

    const apiKeyData = apiKeys[0];
    
    // Check if API key is active
    if (!apiKeyData.isActive) {
      return null;
    }

    // Update last used timestamp
    await updateApiKeyLastUsed(apiKey);

    return {
      userId: apiKeyData.userId,
      apiKeyId: apiKeyData.id,
      apiKeyName: apiKeyData.name
    };
  } catch (error) {
    console.error('API key authentication error:', error);
    return null;
  }
}

export function createApiResponse(data: any, status: number = 200) {
  return NextResponse.json(data, { 
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
    }
  });
}

export function createApiErrorResponse(message: string, status: number = 400) {
  return createApiResponse({ error: message }, status);
} 