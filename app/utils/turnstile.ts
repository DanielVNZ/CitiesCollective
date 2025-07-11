export async function validateTurnstileToken(token: string): Promise<boolean> {
  if (!token) {
    return false;
  }

  // Skip validation on localhost for development
  if (process.env.NODE_ENV === 'development') {
    return true;
  }

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        secret: process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY,
        response: token,
      }),
    });

    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.error('Error validating Turnstile token:', error);
    return false;
  }
} 