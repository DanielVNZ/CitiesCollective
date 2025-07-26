import { revalidatePath, revalidateTag } from 'next/cache';

/**
 * Invalidate cache for city-related pages and data
 */
export async function invalidateCityCache(cityId: number) {
  try {
    // Revalidate the specific city detail page
    revalidatePath(`/city/${cityId}`);
    
    // Revalidate the home page (for recent cities and stats)
    revalidatePath('/');
    
    // Revalidate search page (for updated city data)
    revalidatePath('/search');
    
    // Revalidate API routes that might be cached
    revalidateTag('cities');
    revalidateTag('search');
    revalidateTag('recent-cities');
    revalidateTag(`city-${cityId}`);
    revalidateTag('api-v1');
    revalidateTag('user-cities');
    
    console.log(`Cache invalidated for city ${cityId}`);
  } catch (error) {
    console.error('Failed to invalidate cache for city:', cityId, error);
  }
}

/**
 * Invalidate cache for home page and general city listings
 */
export async function invalidateHomePageCache() {
  try {
    // Revalidate the home page
    revalidatePath('/');
    
    // Revalidate search page
    revalidatePath('/search');
    
    // Revalidate general city data and API routes
    revalidateTag('cities');
    revalidateTag('search');
    revalidateTag('recent-cities');
    revalidateTag('api-v1');
    revalidateTag('user-cities');
    
    console.log('Home page cache invalidated');
  } catch (error) {
    console.error('Failed to invalidate home page cache:', error);
  }
}

/**
 * Invalidate cache for user-related pages
 */
export async function invalidateUserCache(userId: number) {
  try {
    // Revalidate user profile page
    revalidatePath(`/user/${userId}`);
    
    // Revalidate protected page (for user's own cities)
    revalidatePath('/protected');
    
    console.log(`Cache invalidated for user ${userId}`);
  } catch (error) {
    console.error('Failed to invalidate cache for user:', userId, error);
  }
}