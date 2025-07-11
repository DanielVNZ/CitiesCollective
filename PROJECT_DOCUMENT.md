# Cities Collective

A web platform where users can upload and share Cities: Skylines 2 save files (.cok files) to showcase their cities. The website displays city statistics and information extracted from save files in an attractive card format.

## Features

### Core Features
- [x] User authentication (NextAuth.js already configured)
- [x] Database setup (Drizzle ORM with PostgreSQL)
- [x] File upload system for .cok files
- [x] File processing (rename to .zip, extract, parse .SaveGameMetadata)
- [x] City data storage in database
- [x] Home page with recently updated cities
- [x] City cards displaying statistics
- [x] Upload page (protected, requires login)

### Technical Implementation

#### Database Schema
```sql
-- Users table (already exists)
User (
  id SERIAL PRIMARY KEY,
  email VARCHAR(64),
  password VARCHAR(64)
)

-- Cities table (to be created)
City (
  id SERIAL PRIMARY KEY,
  userId INTEGER REFERENCES User(id),
  cityName VARCHAR(255),
  mapName VARCHAR(255),
  population INTEGER,
  money INTEGER,
  xp INTEGER,
  theme VARCHAR(100),
  preview VARCHAR(255),
  saveGameData VARCHAR(255),
  sessionGuid VARCHAR(255),
  gameMode VARCHAR(50),
  autoSave BOOLEAN,
  leftHandTraffic BOOLEAN,
  naturalDisasters BOOLEAN,
  unlockAll BOOLEAN,
  unlimitedMoney BOOLEAN,
  unlockMapTiles BOOLEAN,
  simulationDate JSON,
  contentPrerequisites TEXT[],
  modsEnabled TEXT[],
  fileName VARCHAR(255),
  uploadedAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
)
```

#### File Processing Flow
1. User uploads .cok file
2. Server renames file to .zip
3. Extract zip contents
4. Find and parse .SaveGameMetadata file
5. Store metadata in database
6. Store file in cloud storage (optional)
7. Display city card on home page

#### Pages Structure
- `/` - Home page with recently updated cities
- `/upload` - Protected upload page (requires login)
- `/login` - Login page (already exists)
- `/register` - Register page (already exists)
- `/protected` - Protected dashboard (already exists)

## Implementation Progress

### Phase 1: Database Setup
- [x] Create cities table schema
- [x] Add database migration
- [x] Create Drizzle schema definitions

### Phase 2: File Upload System
- [x] Create upload API endpoint
- [x] Implement file processing logic
- [ ] Add file validation
- [x] Create upload page UI
- [x] Store parsed city metadata in the database after upload

### Phase 3: Home Page
- [x] Create city card component
- [x] Implement home page layout
- [x] Add city listing with pagination (basic version - shows recent 12 cities)
- [x] Style city cards

### Phase 4: Additional Features (Next Priority)
- [x] City detail pages - Click on a city card to see full details
- [x] User profile pages - See all cities uploaded by a specific user
- [x] User settings/dashboard page (/protected) - Manage own cities, delete cities, quick upload
- [x] Search and filtering - Find cities by name, theme, population, etc.
- [x] Image upload for city previews - Multiple image support with automatic resizing and optimization

### Phase 5: Image Upload System ✅ COMPLETED
- [x] Database schema for city images - Add images table with foreign key to cities
- [x] Image upload API endpoint - Handle multiple image uploads with validation
- [x] Image processing pipeline - Automatic resizing, optimization, and thumbnail generation
- [x] Image storage system - Organized file storage with proper naming conventions
- [x] Upload page enhancement - Add image upload interface to city upload form
- [x] City cards enhancement - Display primary image thumbnail on city cards
- [x] City detail page enhancement - Image gallery with lightbox functionality
- [x] Image management - Allow users to add/remove images from existing cities

### Phase 6: Save File Download System ✅ COMPLETED
- [x] Database schema update - Add filePath field to store .cok file locations
- [x] Upload API enhancement - Save .cok files to organized directory structure
- [x] Download API endpoint - Secure file serving with proper headers and validation
- [x] City detail page enhancement - Add download button for save files
- [x] File management - Automatic cleanup on upload errors and proper file organization

### Phase 7: Username System ✅ COMPLETED
- [x] Database schema update - Add username field to User table with migration for existing users
- [x] Registration enhancement - Add username field to registration form with validation
- [x] Authentication update - Support login with either username or email
- [x] User display update - Replace email displays with usernames throughout the application
- [x] Privacy protection - Hide raw email addresses from public display

### Phase 8: Community Features ✅ COMPLETED
- [x] Database schema for community features - Add likes, comments, and favorites tables
- [x] Like system - Users can like/unlike cities with real-time count display
- [x] Comment system - Users can add, view, and delete comments on cities
- [x] Favorites system - Users can save cities to their personal favorites list
- [x] API endpoints - Complete REST API for all community interactions
- [x] UI components - LikeButton, FavoriteButton, and Comments components
- [x] City cards enhancement - Add like and favorite buttons to city cards
- [x] City detail enhancement - Add community interaction section with comments
- [x] Favorites page - Dedicated page for users to view their saved cities
- [x] Navigation updates - Add favorites links throughout the application

### Phase 9: User Profile Enhancement ✅ COMPLETED
- [x] Database schema update - Add pdxUsername and discordUsername fields to User table
- [x] Profile editing API - New endpoint for updating user profile information
- [x] Profile editor component - Form for users to edit their PDX and Discord usernames
- [x] Dashboard integration - Add profile editor to the protected dashboard page
- [x] Public profile display - Show PDX and Discord usernames on user profile pages
- [x] Privacy protection - Only display usernames, not emails or admin status publicly

### Phase 10: Image Management System ✅ COMPLETED
- [x] Image management component - Drag-and-drop reordering, deletion, and primary image selection
- [x] Image reordering API - Endpoint to update image order in database
- [x] Additional image upload API - Allow adding new images to existing cities
- [x] Owner-only access - Image management only visible to city owners
- [x] Visual feedback - Drag indicators, hover states, and confirmation dialogs
- [x] Safety features - Prevent deletion of only primary image, validation checks

### Phase 11: Comment System Enhancement ✅ COMPLETED
- [x] Comment likes database schema - Add commentLikes table with foreign key to comments
- [x] Comment like API endpoints - Toggle likes on comments with user authentication
- [x] Comment sorting functionality - Sort comments by "Most Liked" (default) or "Most Recent"
- [x] Frontend comment likes - Heart icon buttons with like counts and visual feedback
- [x] Sorting controls - Toggle buttons to switch between sorting modes
- [x] Real-time updates - Optimistic UI updates for immediate feedback
- [x] Authentication integration - Redirect to login if user not authenticated

### Phase 12: Password Reset System ✅ COMPLETED
- [x] Database schema for password reset tokens - Add passwordResetTokens table with secure token storage
- [x] Email service integration - Nodemailer setup with Google Workspace SMTP for support@citiescollective.space
- [x] Password reset API endpoints - Forgot password and reset password API routes
- [x] Email templates - Professional HTML and text email templates with branding
- [x] Forgot password page - User-friendly form to request password reset
- [x] Reset password page - Secure token validation and new password form
- [x] Security features - Token expiration (1 hour), secure token generation, and automatic cleanup
- [x] Login page integration - Added "Forgot Password?" link to login page
- [x] Error handling - Comprehensive error messages and user feedback

### Phase 13: External API System ✅ COMPLETED
- [x] Database schema for API keys - Add apiKeys table with secure key storage and user association
- [x] API key authentication middleware - Secure validation with last-used tracking
- [x] API endpoints for city retrieval - Get cities by username and by city ID with detailed information
- [x] Admin panel for API key management - Generate, view, activate/deactivate, and delete API keys
- [x] CORS support - Cross-origin requests enabled with proper headers
- [x] API documentation page - Comprehensive documentation with examples and error codes
- [x] Security features - API key validation, rate limiting considerations, and secure key generation
- [x] Download link integration - Include download URLs for cities when downloadable is enabled

### Phase 14: Follow System & Notifications ✅ COMPLETED
- [x] Database schema for follows - Add follows table with follower/following relationships
- [x] Database schema for notifications - Add notifications table with type, message, and related content
- [x] Follow/unfollow API endpoints - Toggle follow status with proper authentication
- [x] Notification system - Create notifications when followed users upload new cities
- [x] New follower notifications - Notify users when someone starts following them
- [x] Notifications API endpoints - Get, mark as read, and delete notifications
- [x] Notifications menu component - Dropdown menu in header with unread count badge
- [x] Follow button component - Interactive follow/unfollow button with real-time updates
- [x] User profile enhancement - Display follower/following counts and follow button
- [x] Upload notification trigger - Automatically notify followers when new cities are uploaded
- [x] Real-time UI updates - Optimistic updates for follow actions and notification management

### Phase 15: City Description System ✅ COMPLETED
- [x] Database schema update - Add description field to City table with TEXT type for markdown support
- [x] Description update API endpoint - Secure PUT endpoint for updating city descriptions
- [x] City description component - Interactive editor with markdown support and preview
- [x] Markdown rendering - React-markdown with GitHub Flavored Markdown (GFM) support
- [x] Owner-only editing - Only city owners can edit descriptions, others can view

### Phase 16: OSM Map System ✅ COMPLETED
- [x] Database schema for OSM maps - Add osmMapPath field to City table for storing OSM file URLs
- [x] OSM map upload API endpoint - Handle .osm file uploads with validation and R2 storage
- [x] OSM data processing API - Parse XML data with caching for performance
- [x] OSM map viewer component - Canvas-based renderer with Leaflet integration
- [x] Map styling system - Color-coded rendering for buildings, roads, and land use
- [x] Performance optimizations - Handle large OSM files with size limits and chunked processing
- [x] Error handling - Stack overflow protection and user-friendly error messages
- [x] Data limitations - Automatic limiting of nodes/ways for very large maps with user warnings
- [x] Caching system - Database caching of processed OSM data for faster subsequent loads
- [x] Chunked/progressive processing - Process OSM data in 5000-item chunks to prevent browser freezing
- [x] Progressive rendering - Render map features in batches with progress indicators
- [x] Memory optimization - Use setImmediate between chunks to allow other operations
- [x] User feedback - Real-time progress bars and status indicators during processing/rendering
- [x] Typography styling - Tailwind CSS typography plugin for beautiful markdown rendering
- [x] Real-time editing - Inline editing with save/cancel functionality
- [x] Error handling - Comprehensive error messages and validation
- [x] City page integration - Description section prominently displayed on city detail pages

### Phase 16: OSM Map System ✅ COMPLETED
- [x] Database schema update - Add osmMapPath field to City table for storing OSM map file paths
- [x] OSM map upload API endpoint - Secure POST endpoint for uploading OSM map files
- [x] OSM map deletion API endpoint - Secure DELETE endpoint for removing OSM maps
- [x] OSM map manager component - Interactive upload/delete interface with file validation
- [x] OSM map viewer component - Interactive map display with Leaflet integration
- [x] Interactive map rendering - Full Leaflet map with pan, zoom, and click interactions
- [x] Road and path visualization - Colored polylines for different road types (motorways, primary, residential, etc.)
- [x] Point of interest markers - Interactive markers for amenities, shops, leisure areas, and landmarks
- [x] Map popups - Detailed information popups for roads and locations on click
- [x] File storage system - OSM maps stored in `/public/uploads/cities/osm-maps/` directory
- [x] File validation - Support for .osm files with 10MB size limit
- [x] Owner-only management - Only city owners can upload/delete OSM maps, others can view
- [x] City page integration - OSM map section displayed above city header on detail pages
- [x] Map data parsing - XML parsing of OSM data with bounds, nodes, ways, and important locations
- [x] Map statistics display - Show total points, important locations, roads, and zoom level
- [x] Automatic map centering - Smart calculation of map center and zoom based on OSM bounds
- [x] Performance optimization - Limited rendering of roads and markers to prevent performance issues
- [x] Error handling - Comprehensive error messages and validation feedback

### Phase 17: Content Creator System ✅ COMPLETED
- [x] Database schema update - Add isContentCreator boolean field to User table with migration
- [x] Admin panel enhancement - Add Content Creator status column and toggle button to user management
- [x] Content creator toggle API - Secure endpoint for admins to promote/demote content creators
- [x] Content creator cities function - Database function to retrieve cities from content creators
- [x] Home page Creator Spotlight - Dynamic section showing cities from content creators
- [x] Admin dashboard enhancement - Add Content Creator count to system overview statistics
- [x] User interface updates - Content Creator badge and status display in admin panel
- [x] Automatic spotlight system - Cities uploaded by content creators automatically appear in spotlight

### Current Status
✅ **CONTENT CREATOR SYSTEM COMPLETE!** The platform now includes a comprehensive content creator system that allows admins to designate special users as content creators, with their cities automatically featured in the Creator Spotlight section.

**Content Creator Features:**
- **Admin Management**: Admins can promote/demote users to content creator status via admin panel
- **Content Creator Badge**: Special purple "Creator" badge displayed in admin user management
- **Automatic Spotlight**: Cities uploaded by content creators automatically appear in Creator Spotlight section
- **Dynamic Home Page**: Creator Spotlight section shows actual content creator cities instead of static message
- **Admin Dashboard**: Content Creator count displayed in admin system overview statistics
- **Database Integration**: Secure API endpoints with proper authentication and authorization
- **User Interface**: Dedicated toggle buttons and status indicators in admin panel
- **Fallback Display**: Shows encouragement message when no content creator cities are available

✅ **INTERACTIVE OSM MAP SYSTEM COMPLETE!** The Cities: Skylines 2 sharing platform now includes a fully interactive OSM map system that renders maps directly on the website, allowing creators to upload and display city layout maps with full interactivity.

**OSM Map Features:**
- **Interactive Map Display**: Full Leaflet-powered maps rendered directly on the city page with pan, zoom, and click interactions
- **Road Visualization**: Colored polylines showing different road types (motorways in red, primary roads in orange, residential in white, etc.)
- **Point of Interest Markers**: Interactive markers for amenities, shops, leisure areas, tourism spots, and landmarks
- **Information Popups**: Detailed popups showing road names/types and location information on click
- **Map Upload System**: Secure file upload with validation for .osm files
- **File Management**: Upload, replace, and delete OSM map files with intuitive interface
- **Storage Integration**: OSM files stored in organized directory structure alongside city images
- **Download Functionality**: Users can download OSM files for use in mapping applications
- **Owner-Only Management**: Only city owners can upload/delete maps, while everyone can view them
- **City Page Integration**: OSM map section prominently displayed above city header
- **Smart Map Centering**: Automatic calculation of optimal map center and zoom level based on OSM bounds
- **Performance Optimization**: Limited rendering of roads (50) and markers (20) to ensure smooth performance
- **Map Statistics**: Display total points, important locations, roads count, and current zoom level
- **Error Handling**: Comprehensive validation and user-friendly error messages
- **Database Integration**: Secure API endpoints with proper authentication and authorization

✅ **CITY DESCRIPTION SYSTEM COMPLETE!** The platform also includes a comprehensive city description system with markdown support, allowing creators to share detailed information about their cities.

**City Description Features:**
- **Markdown Support**: Full GitHub Flavored Markdown (GFM) support for rich text formatting
- **Interactive Editor**: Inline editing with real-time preview and save/cancel functionality
- **Owner-Only Editing**: Only city owners can edit descriptions, while everyone can view them
- **Beautiful Typography**: Tailwind CSS typography plugin for professional markdown rendering
- **Error Handling**: Comprehensive validation and user-friendly error messages
- **City Page Integration**: Description section prominently displayed on city detail pages
- **Database Integration**: Secure API endpoint with proper authentication and authorization

✅ **FOLLOW SYSTEM & NOTIFICATIONS COMPLETE!** The platform also includes a comprehensive follow system and notification features for enhanced community engagement, including new follower notifications.

**Core Features:**
- Complete user authentication with username system
- File upload and management (save files + images)
- Advanced search and filtering
- User profiles and dashboards with profile editing
- Community interactions (likes, comments, favorites)
- Optional PDX and Discord username display
- Full image management system for city owners
- Enhanced comment system with likes and sorting
- **NEW**: Complete password reset system with email notifications

**Follow System & Notification Features:**
- **Follow System**: Users can follow/unfollow other users with real-time UI updates
- **Notification System**: Automatic notifications when followed users upload new cities
- **New Follower Notifications**: Users are notified when someone starts following them
- **Notifications Menu**: Dropdown menu in header with unread count badge and notification management
- **Follow Button Component**: Interactive follow/unfollow button with loading states and follower count
- **User Profile Enhancement**: Display follower/following counts and follow functionality
- **Real-time Updates**: Optimistic UI updates for immediate feedback on follow actions
- **Notification Management**: Mark notifications as read, delete notifications, and mark all as read
- **Upload Integration**: Automatic notification triggers when users upload new cities

**External API Features:**
- **Secure API Key System**: Cryptographically secure API keys with user association and last-used tracking
- **Comprehensive Endpoints**: Get cities by username and detailed city information by ID
- **Admin Management**: Full admin panel for generating, managing, and monitoring API keys
- **CORS Support**: Cross-origin requests enabled for external applications
- **Complete Documentation**: Comprehensive API documentation with examples and error codes
- **Security Features**: API key validation, rate limiting considerations, and secure key generation
- **Download Integration**: Include download URLs for cities when downloadable is enabled

**Password Reset Features:**
- **Secure Token System**: Cryptographically secure tokens with 1-hour expiration
- **Email Integration**: Professional email templates sent via Google Workspace SMTP
- **User-Friendly Flow**: Simple forgot password form and secure reset process
- **Security Best Practices**: Token validation, automatic cleanup, and password strength requirements
- **Professional Branding**: Cities Collective branded email templates with clear instructions
- **Error Handling**: Comprehensive error messages and user feedback throughout the process
- **Login Integration**: "Forgot Password?" link seamlessly integrated into login page

**Community Features:**
- **Like System**: Users can like cities with heart icons and real-time counts
- **Comment System**: Full commenting with user attribution, timestamps, and delete functionality
- **Comment Likes**: Users can like/unlike individual comments with visual feedback
- **Comment Sorting**: Sort comments by "Most Liked" (default) or "Most Recent"
- **Favorites System**: Personal favorites collection with dedicated page
- **Interactive UI**: Client-side components with proper authentication handling
- **Social Navigation**: Easy access to community features throughout the app
- **Profile Enhancement**: Users can optionally display their PDX and Discord usernames

**Image Management Features:**
- **Drag & Drop Reordering**: Intuitive drag-and-drop interface to reorder images
- **Primary Image Selection**: Set any image as the main thumbnail for the city
- **Image Deletion**: Remove unwanted images with safety checks
- **Additional Uploads**: Add new images to existing cities anytime
- **Owner-Only Access**: Image management only available to city owners
- **Visual Feedback**: Clear indicators for drag states, hover effects, and confirmations
- **Safety Features**: Prevents deletion of the only primary image, validates ownership

**Technical Implementation:**
- Comprehensive database schema with proper foreign keys and constraints
- RESTful API endpoints for all community interactions and profile management
- Client-side React components with loading states and error handling
- Secure user authorization for all community actions and profile updates
- Real-time UI updates without page refreshes
- Profile editing with form validation and success/error feedback
- Comment like system with optimistic updates and proper state management
- **NEW**: Email service integration with nodemailer and Google Workspace SMTP
- **NEW**: Password reset token management with automatic expiration and cleanup

**Next Priority:** The platform is now feature-complete with robust community features and enhanced user profiles. Future enhancements could include:
- Advanced community features (user following, notifications)
- City comparison tools and analytics
- Community challenges and contests
- Advanced moderation tools
- Performance optimizations and caching
- Mobile app development

## Dependencies Added ✅
- `adm-zip` - For extracting .cok files
- `sharp` - For image processing and resizing
- `multer` - For handling multipart/form-data uploads
- `uuid` - For generating unique file names

## Image Processing Specifications ✅
- **Thumbnail**: 300x200px (for city cards) - Cropped to fit
- **Medium**: 800x600px (for gallery view) - Resized to fit
- **Large**: 1200x900px (for lightbox/full view) - Resized to fit
- **Original**: Preserved for download - WebP optimized + original format backup
- **Formats**: All images converted to WebP for optimization, original format kept as backup
- **Quality**: 85% for WebP thumbnails/medium/large, 90% for original WebP
- **Storage**: Organized in `/public/uploads/cities/` with subdirectories for each size
- **Validation**: Max 10MB per image, up to 15 images per city, supports JPEG/PNG/WebP/GIF

## File Storage System ✅
- **Save Files**: Stored in `/uploads/saves/` with UUID-based naming for uniqueness
- **Images**: Stored in `/public/uploads/cities/` with size-specific subdirectories
- **Security**: Proper file validation, cleanup on errors, and secure download endpoints
- **Organization**: Systematic file naming and directory structure for easy management