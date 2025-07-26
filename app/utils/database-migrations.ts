import { client } from '../db';

interface Migration {
  id: string;
  description: string;
  up: () => Promise<void>;
  down: () => Promise<void>;
}

// Track applied migrations
const appliedMigrations = new Set<string>();

// Initialize migrations table
async function initializeMigrationsTable() {
  await client`
    CREATE TABLE IF NOT EXISTS database_migrations (
      id VARCHAR(255) PRIMARY KEY,
      description TEXT NOT NULL,
      applied_at TIMESTAMP DEFAULT NOW()
    )
  `;
  
  // Load applied migrations
  const applied = await client`SELECT id FROM database_migrations`;
  applied.forEach(row => appliedMigrations.add(row.id));
}

// Apply a migration
async function applyMigration(migration: Migration) {
  if (appliedMigrations.has(migration.id)) {
    // Only log in production or when explicitly debugging
    if (process.env.NODE_ENV === 'production' || process.env.DB_DEBUG === 'true') {
      console.log(`Migration ${migration.id} already applied, skipping...`);
    }
    return;
  }
  
  try {
    console.log(`Applying migration: ${migration.id} - ${migration.description}`);
    await migration.up();
    
    // Record migration as applied
    await client`
      INSERT INTO database_migrations (id, description) 
      VALUES (${migration.id}, ${migration.description})
    `;
    
    appliedMigrations.add(migration.id);
    console.log(`Migration ${migration.id} applied successfully`);
  } catch (error) {
    console.error(`Failed to apply migration ${migration.id}:`, error);
    throw error;
  }
}

// Performance optimization migrations
const performanceMigrations: Migration[] = [
  {
    id: '001_city_search_indexes',
    description: 'Add composite indexes for city search queries',
    up: async () => {
      // Composite index for city search (cityName, mapName, theme)
      await client`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_city_search_composite 
        ON "City" ("cityName", "mapName", "theme") 
        WHERE "cityName" IS NOT NULL AND "mapName" IS NOT NULL
      `;
      
      // Index for downloadable cities filter
      await client`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_city_downloadable 
        ON "City" ("downloadable", "uploadedAt" DESC) 
        WHERE "downloadable" = true
      `;
      
      // Index for city population sorting
      await client`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_city_population 
        ON "City" ("population" DESC NULLS LAST) 
        WHERE "population" IS NOT NULL
      `;
      
      // Index for recent cities
      await client`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_city_recent 
        ON "City" ("uploadedAt" DESC, "downloadable") 
        WHERE "downloadable" = true
      `;
    },
    down: async () => {
      await client`DROP INDEX IF EXISTS idx_city_search_composite`;
      await client`DROP INDEX IF EXISTS idx_city_downloadable`;
      await client`DROP INDEX IF EXISTS idx_city_population`;
      await client`DROP INDEX IF EXISTS idx_city_recent`;
    }
  },
  
  {
    id: '002_user_lookup_indexes',
    description: 'Add indexes for user lookups',
    up: async () => {
      // Index for username lookups
      await client`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_username 
        ON "User" ("username") 
        WHERE "username" IS NOT NULL
      `;
      
      // Index for email lookups (if not already unique)
      await client`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_email 
        ON "User" ("email") 
        WHERE "email" IS NOT NULL
      `;
      
      // Index for OAuth lookups
      await client`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_google_id 
        ON "User" ("googleId") 
        WHERE "googleId" IS NOT NULL
      `;
      
      await client`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_github_id 
        ON "User" ("githubId") 
        WHERE "githubId" IS NOT NULL
      `;
      
      // Index for content creators
      await client`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_content_creator 
        ON "User" ("isContentCreator") 
        WHERE "isContentCreator" = true
      `;
    },
    down: async () => {
      await client`DROP INDEX IF EXISTS idx_user_username`;
      await client`DROP INDEX IF EXISTS idx_user_email`;
      await client`DROP INDEX IF EXISTS idx_user_google_id`;
      await client`DROP INDEX IF EXISTS idx_user_github_id`;
      await client`DROP INDEX IF EXISTS idx_user_content_creator`;
    }
  },
  
  {
    id: '003_fulltext_search_indexes',
    description: 'Add GIN indexes for full-text search',
    up: async () => {
      // Enable pg_trgm extension for trigram similarity
      await client`CREATE EXTENSION IF NOT EXISTS pg_trgm`;
      
      // GIN index for city name full-text search
      await client`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_city_name_gin 
        ON "City" USING gin ("cityName" gin_trgm_ops) 
        WHERE "cityName" IS NOT NULL
      `;
      
      // GIN index for map name search
      await client`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_city_map_name_gin 
        ON "City" USING gin ("mapName" gin_trgm_ops) 
        WHERE "mapName" IS NOT NULL
      `;
      
      // GIN index for description full-text search
      await client`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_city_description_gin 
        ON "City" USING gin ("description" gin_trgm_ops) 
        WHERE "description" IS NOT NULL
      `;
      
      // Combined text search index
      await client`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_city_combined_text_search 
        ON "City" USING gin (
          (COALESCE("cityName", '') || ' ' || COALESCE("mapName", '') || ' ' || COALESCE("description", '')) gin_trgm_ops
        )
      `;
    },
    down: async () => {
      await client`DROP INDEX IF EXISTS idx_city_name_gin`;
      await client`DROP INDEX IF EXISTS idx_city_map_name_gin`;
      await client`DROP INDEX IF EXISTS idx_city_description_gin`;
      await client`DROP INDEX IF EXISTS idx_city_combined_text_search`;
    }
  },
  
  {
    id: '004_community_features_indexes',
    description: 'Add indexes for community features (likes, comments, favorites)',
    up: async () => {
      // Likes table indexes
      await client`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_likes_city_id 
        ON "likes" ("cityId", "createdAt" DESC)
      `;
      
      await client`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_likes_user_id 
        ON "likes" ("userId", "createdAt" DESC)
      `;
      
      await client`
        CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_likes_user_city_unique 
        ON "likes" ("userId", "cityId")
      `;
      
      // Comments table indexes
      await client`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comments_city_id 
        ON "comments" ("cityId", "createdAt" DESC)
      `;
      
      await client`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comments_user_id 
        ON "comments" ("userId", "createdAt" DESC)
      `;
      
      // Favorites table indexes
      await client`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_favorites_city_id 
        ON "favorites" ("cityId", "createdAt" DESC)
      `;
      
      await client`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_favorites_user_id 
        ON "favorites" ("userId", "createdAt" DESC)
      `;
      
      await client`
        CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_favorites_user_city_unique 
        ON "favorites" ("userId", "cityId")
      `;
    },
    down: async () => {
      await client`DROP INDEX IF EXISTS idx_likes_city_id`;
      await client`DROP INDEX IF EXISTS idx_likes_user_id`;
      await client`DROP INDEX IF EXISTS idx_likes_user_city_unique`;
      await client`DROP INDEX IF EXISTS idx_comments_city_id`;
      await client`DROP INDEX IF EXISTS idx_comments_user_id`;
      await client`DROP INDEX IF EXISTS idx_favorites_city_id`;
      await client`DROP INDEX IF EXISTS idx_favorites_user_id`;
      await client`DROP INDEX IF EXISTS idx_favorites_user_city_unique`;
    }
  },
  
  {
    id: '005_city_images_indexes',
    description: 'Add indexes for city images performance',
    up: async () => {
      // City images lookup
      await client`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_city_images_city_id 
        ON "cityImages" ("cityId", "sortOrder", "isPrimary")
      `;
      
      // Primary image lookup
      await client`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_city_images_primary 
        ON "cityImages" ("cityId", "isPrimary") 
        WHERE "isPrimary" = true
      `;
    },
    down: async () => {
      await client`DROP INDEX IF EXISTS idx_city_images_city_id`;
      await client`DROP INDEX IF EXISTS idx_city_images_primary`;
    }
  }
];

// Run all performance migrations
export async function runPerformanceMigrations() {
  try {
    await initializeMigrationsTable();
    
    for (const migration of performanceMigrations) {
      await applyMigration(migration);
    }
    
    console.log('All performance migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

// Export for manual migration management
export { performanceMigrations, applyMigration, initializeMigrationsTable };