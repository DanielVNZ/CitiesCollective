// Cloudflare Worker for Cities Collective
// This provides additional security and protection

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  
  // Security checks
  if (isMaliciousRequest(request)) {
    return new Response('Forbidden', { status: 403 })
  }
  
  // Rate limiting
  if (await isRateLimited(request)) {
    return new Response('Too Many Requests', { status: 429 })
  }
  
  // Add security headers
  const response = await fetch(request)
  const newResponse = new Response(response.body, response)
  
  // Security headers
  newResponse.headers.set('X-Content-Type-Options', 'nosniff')
  newResponse.headers.set('X-Frame-Options', 'DENY')
  newResponse.headers.set('X-XSS-Protection', '1; mode=block')
  newResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  newResponse.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  
  // HSTS header
  if (url.protocol === 'https:') {
    newResponse.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  }
  
  return newResponse
}

function isMaliciousRequest(request) {
  const url = new URL(request.url)
  const userAgent = request.headers.get('User-Agent') || ''
  
  // Block common malicious patterns
  const maliciousPatterns = [
    /\.\.\//, // Directory traversal
    /<script/i, // XSS attempts
    /union.*select/i, // SQL injection
    /eval\(/i, // JavaScript injection
    /document\.cookie/i, // Cookie theft attempts
  ]
  
  // Check URL for malicious patterns
  for (const pattern of maliciousPatterns) {
    if (pattern.test(url.pathname + url.search)) {
      return true
    }
  }
  
  // Block suspicious user agents
  const suspiciousUserAgents = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
  ]
  
  for (const pattern of suspiciousUserAgents) {
    if (pattern.test(userAgent)) {
      return true
    }
  }
  
  return false
}

async function isRateLimited(request) {
  const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown'
  const key = `rate_limit:${clientIP}`
  
  // This is a simplified rate limiting example
  // In production, you'd use Cloudflare's KV store or Durable Objects
  const currentTime = Math.floor(Date.now() / 1000)
  const windowSize = 60 // 1 minute window
  const maxRequests = 100 // Max requests per minute
  
  // This is a placeholder - implement actual rate limiting logic
  return false
} 