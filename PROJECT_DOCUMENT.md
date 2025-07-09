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

### Current Status
✅ **EXTERNAL API SYSTEM COMPLETE!** The Cities: Skylines 2 sharing platform now includes a comprehensive external API system with secure API key authentication.

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
- **Validation**: Max 10MB per image, up to 5 images per city, supports JPEG/PNG/WebP/GIF

## File Storage System ✅
- **Save Files**: Stored in `/uploads/saves/` with UUID-based naming for uniqueness
- **Images**: Stored in `/public/uploads/cities/` with size-specific subdirectories
- **Security**: Proper file validation, cleanup on errors, and secure download endpoints
- **Organization**: Systematic file naming and directory structure for easy management