export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
          Cities Collective API Documentation
        </h1>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Overview
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            The Cities Collective API allows you to retrieve city data programmatically. 
            All API endpoints require authentication using API keys.
          </p>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
              🚀 New: HoF Creator API
            </h3>
            <p className="text-blue-700 dark:text-blue-300 mb-3">
              Upload images to your cities programmatically using API keys. Perfect for creators who want to automate their image upload process.
            </p>
            <a 
              href="/api-docs/hof-creator" 
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              View HoF Creator API Docs →
            </a>
          </div>
          
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
              🔑 API Key Required
            </h3>
            <p className="text-yellow-700 dark:text-yellow-300 text-sm">
              Contact an administrator to get an API key. API keys must be included in the 
              <code className="bg-yellow-100 dark:bg-yellow-800 px-1 rounded">X-API-Key</code> header 
              or as a Bearer token in the <code className="bg-yellow-100 dark:bg-yellow-800 px-1 rounded">Authorization</code> header.
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Authentication
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Include your API key in one of these ways:
          </p>
          
          <div className="space-y-3">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">X-API-Key Header</h4>
              <code className="block bg-gray-100 dark:bg-gray-700 p-2 rounded text-sm">
                X-API-Key: cc_your_api_key_here
              </code>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">Authorization Header</h4>
              <code className="block bg-gray-100 dark:bg-gray-700 p-2 rounded text-sm">
                Authorization: Bearer cc_your_api_key_here
              </code>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Endpoints
          </h2>

          <div className="space-y-8">
            {/* Get Cities by Username */}
            <div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                Get Cities by Username
              </h3>
              <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded mb-3">
                <code className="text-sm">
                  GET /api/v1/cities?username={'{username}'}
                </code>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-3">
                Retrieve all cities uploaded by a specific user.
              </p>
              
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Parameters:</h4>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 mb-3 space-y-1">
                <li><code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">username</code> (required) - The username or email of the user</li>
              </ul>

              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Response Fields:</h4>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 mb-3 space-y-1">
                <li><code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">user</code> - User information (id, username, name)</li>
                <li><code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">cities</code> - Array of city objects</li>
                <li><code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">total</code> - Total number of cities</li>
                <li><code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">downloadUrl</code> - Only included if city is downloadable</li>
                <li><code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">primaryImage</code> - Only included if city has images</li>
              </ul>

              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Example Response:</h4>
              <pre className="bg-gray-100 dark:bg-gray-700 p-3 rounded text-sm overflow-x-auto">
{`{
  "success": true,
  "data": {
    "user": {
      "id": 123,
      "username": "citybuilder"
    },
    "cities": [
      {
        "id": 456,
        "cityName": "New York",
        "mapName": "Manhattan",
        "population": 8500000,
        "money": 50000000,
        "xp": 150,
        "theme": "Modern",
        "gameMode": "Sandbox",
        "downloadable": true,
        "downloadUrl": "https://example.com/api/cities/456/download",
        "uploadedAt": "2024-01-15T10:30:00Z",
        "primaryImage": {
          "thumbnail": "https://...",
          "medium": "https://...",
          "large": "https://...",
          "original": "https://..."
        },
        "stats": {
          "likes": 25,
          "comments": 8
        }
      }
    ],
    "total": 1
  }
}`}
              </pre>
            </div>

            {/* Get City by ID */}
            <div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                Get City by ID
              </h3>
              <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded mb-3">
                <code className="text-sm">
                  GET /api/v1/cities/{'{cityId}'}
                </code>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-3">
                Retrieve detailed information about a specific city including all images, stats, and metadata.
              </p>

              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Response Fields:</h4>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 mb-3 space-y-1">
                <li><code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">downloadUrl</code> - Only included if city is downloadable</li>
                <li><code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">primaryImage</code> - Only included if city has images</li>
                <li><code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">images</code> - Array of all city images with metadata</li>
                <li><code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">stats</code> - Like count, comment count, and total images</li>
                <li><code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">user</code> - City owner information</li>
              </ul>

              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Example Response:</h4>
              <pre className="bg-gray-100 dark:bg-gray-700 p-3 rounded text-sm overflow-x-auto">
{`{
  "success": true,
  "data": {
    "id": 456,
    "cityName": "New York",
    "mapName": "Manhattan",
    "population": 8500000,
    "money": 50000000,
    "xp": 150,
    "theme": "Modern",
    "gameMode": "Sandbox",
    "autoSave": true,
    "leftHandTraffic": false,
    "naturalDisasters": true,
    "unlockAll": false,
    "unlimitedMoney": false,
    "unlockMapTiles": true,
    "simulationDate": {"year": 2024, "month": 6, "day": 15},
    "contentPrerequisites": ["DLC1", "DLC2"],
    "modsEnabled": ["mod1", "mod2"],
    "fileName": "newyork.cok",
    "downloadable": true,
    "downloadUrl": "https://example.com/api/cities/456/download",
    "uploadedAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z",
    "primaryImage": {
      "id": 789,
      "thumbnail": "https://...",
      "medium": "https://...",
      "large": "https://...",
      "original": "https://..."
    },
    "images": [
      {
        "id": 789,
        "fileName": "image1.webp",
        "originalName": "screenshot.jpg",
        "fileSize": 2048576,
        "mimeType": "image/webp",
        "width": 1920,
        "height": 1080,
        "isPrimary": true,
        "sortOrder": 0,
        "uploadedAt": "2024-01-15T10:30:00Z",
        "urls": {
          "thumbnail": "https://...",
          "medium": "https://...",
          "large": "https://...",
          "original": "https://..."
        }
      }
    ],
    "stats": {
      "likes": 25,
      "comments": 8,
      "totalImages": 3
    },
    "user": {
      "id": 123,
      "username": "citybuilder"
    }
  }
}`}
              </pre>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            CORS Support
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            The API supports Cross-Origin Resource Sharing (CORS) for browser-based applications. 
            All endpoints support OPTIONS preflight requests with the following headers:
          </p>
          
          <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded text-sm mb-4">
            <div><strong>Access-Control-Allow-Origin:</strong> *</div>
            <div><strong>Access-Control-Allow-Methods:</strong> GET, POST, PUT, DELETE, OPTIONS</div>
            <div><strong>Access-Control-Allow-Headers:</strong> Content-Type, Authorization, X-API-Key</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Error Responses
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            All error responses follow this format:
          </p>
          
          <pre className="bg-gray-100 dark:bg-gray-700 p-3 rounded text-sm">
{`{
  "error": "Error message description"
}`}
          </pre>

          <div className="mt-4 space-y-2">
            <div><strong>401 Unauthorized:</strong> Invalid or missing API key</div>
            <div><strong>400 Bad Request:</strong> Missing required parameters (e.g., username)</div>
            <div><strong>404 Not Found:</strong> User or city not found</div>
            <div><strong>500 Internal Server Error:</strong> Server error</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Rate Limiting
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            API requests are currently not rate limited, but please use the API responsibly. 
            If you need higher limits for production use, please contact an administrator.
          </p>
        </div>
      </div>
    </div>
  );
} 