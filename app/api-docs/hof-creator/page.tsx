'use client';

import { useState } from 'react';

export default function HoFCreatorApiDocs() {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'authentication', label: 'Authentication' },
    { id: 'endpoints', label: 'Endpoints' },
    { id: 'examples', label: 'Examples' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              HoF Creator API
            </h1>
            <p className="text-blue-100 text-lg">
              API for uploading images to Cities Collective using API keys
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Overview
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    The HoF Creator API allows you to programmatically upload images to your cities on Cities Collective using API keys. 
                    This API is designed for creators who want to automate their image upload process.
                  </p>
                  
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                      Key Features
                    </h3>
                    <ul className="text-blue-700 dark:text-blue-300 space-y-1">
                      <li>• API key-based authentication</li>
                      <li>• Upload multiple images to your cities</li>
                      <li>• Retrieve your HoF Creator ID</li>
                      <li>• Get detailed city information</li>
                      <li>• CORS enabled for cross-origin requests</li>
                    </ul>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    Base URL
                  </h3>
                  <code className="bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded text-sm font-mono">
                    https://yourdomain.com/api/v1/hof-creator
                  </code>
                </div>
              </div>
            )}

            {activeTab === 'authentication' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Authentication
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    All API requests require authentication using an API key. You can obtain an API key from the admin dashboard.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    API Key Header
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-2">
                    Include your API key in the request headers:
                  </p>
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                    <code className="text-sm font-mono">
                      X-API-Key: cc_your_api_key_here
                    </code>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    Alternative Authorization Header
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-2">
                    You can also use the Authorization header:
                  </p>
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                    <code className="text-sm font-mono">
                      Authorization: Bearer cc_your_api_key_here
                    </code>
                  </div>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                    Security Note
                  </h3>
                  <p className="text-yellow-700 dark:text-yellow-300">
                    Keep your API key secure and never share it publicly. API keys are tied to your account and can be used to upload images to your cities.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'endpoints' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                    API Endpoints
                  </h2>
                </div>

                {/* Get HoF Creator ID */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-green-900 dark:text-green-300">
                      GET
                    </span>
                    <code className="ml-3 text-sm font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                      /api/v1/hof-creator
                    </code>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Get HoF Creator ID
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Retrieve your HoF Creator ID and user information.
                  </p>
                  
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Response</h4>
                    <pre className="text-sm text-gray-600 dark:text-gray-300 overflow-x-auto">
{`{
  "success": true,
  "hofCreatorId": 123,
  "username": "your_username",
  "apiKeyName": "My API Key",
  "message": "HoF Creator ID retrieved successfully"
}`}
                    </pre>
                  </div>
                </div>

                {/* Get City Information */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-blue-900 dark:text-blue-300">
                      GET
                    </span>
                    <code className="ml-3 text-sm font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                      /api/v1/hof-creator/city/{'{cityId}'}
                    </code>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Get City Information
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Retrieve detailed information about a specific city.
                  </p>
                  
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Response</h4>
                    <pre className="text-sm text-gray-600 dark:text-gray-300 overflow-x-auto">
{`{
  "success": true,
  "city": {
    "id": 456,
    "cityName": "My Amazing City",
    "mapName": "Waterway Pass",
    "population": 50000,
    "money": 1000000,
    "xp": 1500,
    "theme": "European",
    "gameMode": "Creative",
    "simulationDate": {...},
    "description": "A beautiful city...",
    "downloadable": true,
    "uploadedAt": "2024-01-15T10:30:00Z",
    "imageCount": 5,
    "images": [...]
  },
  "message": "City information retrieved successfully"
}`}
                    </pre>
                  </div>
                </div>

                {/* Upload Images */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-orange-900 dark:text-orange-300">
                      POST
                    </span>
                    <code className="ml-3 text-sm font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                      /api/v1/hof-creator/city/{'{cityId}'}/images
                    </code>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Upload Images
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Upload images to a specific city. You can only upload images to cities you own.
                  </p>
                  
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Request</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                      Content-Type: multipart/form-data
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Form field: images (multiple files allowed, max 15 per upload, 10MB per file)
                    </p>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Response</h4>
                    <pre className="text-sm text-gray-600 dark:text-gray-300 overflow-x-auto">
{`{
  "success": true,
  "images": [
    {
      "id": 789,
      "fileName": "image_123.webp",
      "originalName": "screenshot.png",
      "thumbnailPath": "https://...",
      "mediumPath": "https://...",
      "largePath": "https://...",
      "originalPath": "https://...",
      "isPrimary": true,
      "sortOrder": 0
    }
  ],
  "message": "Successfully uploaded 1 images to city 456"
}`}
                    </pre>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'examples' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Code Examples
                  </h2>
                </div>

                {/* JavaScript/Node.js Example */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    JavaScript/Node.js
                  </h3>
                  <pre className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 text-sm overflow-x-auto">
{`// Get HoF Creator ID
const response = await fetch('/api/v1/hof-creator', {
  headers: {
    'X-API-Key': 'cc_your_api_key_here'
  }
});

const data = await response.json();
console.log('HoF Creator ID:', data.hofCreatorId);

// Upload images
const formData = new FormData();
formData.append('images', imageFile1);
formData.append('images', imageFile2);

const uploadResponse = await fetch('/api/v1/hof-creator/city/123/images', {
  method: 'POST',
  headers: {
    'X-API-Key': 'cc_your_api_key_here'
  },
  body: formData
});

const uploadData = await uploadResponse.json();
console.log('Uploaded images:', uploadData.images);`}
                  </pre>
                </div>

                {/* Python Example */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Python
                  </h3>
                  <pre className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 text-sm overflow-x-auto">
{`import requests

# Get HoF Creator ID
response = requests.get(
    'https://yourdomain.com/api/v1/hof-creator',
    headers={'X-API-Key': 'cc_your_api_key_here'}
)
data = response.json()
print('HoF Creator ID:', data['hofCreatorId'])

# Upload images
files = [
    ('images', open('image1.jpg', 'rb')),
    ('images', open('image2.png', 'rb'))
]

upload_response = requests.post(
    'https://yourdomain.com/api/v1/hof-creator/city/123/images',
    headers={'X-API-Key': 'cc_your_api_key_here'},
    files=files
)

upload_data = upload_response.json()
print('Uploaded images:', upload_data['images'])`}
                  </pre>
                </div>

                {/* cURL Example */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    cURL
                  </h3>
                  <pre className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 text-sm overflow-x-auto">
{`# Get HoF Creator ID
curl -X GET "https://yourdomain.com/api/v1/hof-creator" \\
  -H "X-API-Key: cc_your_api_key_here"

# Upload images
curl -X POST "https://yourdomain.com/api/v1/hof-creator/city/123/images" \\
  -H "X-API-Key: cc_your_api_key_here" \\
  -F "images=@image1.jpg" \\
  -F "images=@image2.png"`}
                  </pre>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                    Rate Limits
                  </h3>
                  <p className="text-green-700 dark:text-green-300">
                    The API has reasonable rate limits to ensure fair usage. If you need higher limits for your use case, please contact the administrators.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 