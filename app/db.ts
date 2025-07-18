import { drizzle } from 'drizzle-orm/postgres-js';
import { pgTable, serial, varchar, integer, boolean, json, text, timestamp } from 'drizzle-orm/pg-core';
import { eq, desc, and, ilike, gte, lte, or, asc, sql } from 'drizzle-orm';
import postgres from 'postgres';
import { genSaltSync, hashSync } from 'bcrypt-ts';
import { getDownloadUrl } from 'app/utils/r2';

// Optionally, if not using email/pass login, you can
// use the Drizzle adapter for Auth.js / NextAuth
// https://authjs.dev/reference/adapter/drizzle
let client = postgres(process.env.POSTGRES_URL!, {
  ssl: false, // Keep SSL disabled for local development
  max: process.env.NODE_ENV === 'production' ? 10 : 10, // Reduced for local
  idle_timeout: 20,
  connect_timeout: 10,
  // Add connection pooling optimizations
  prepare: true, // Enable prepared statements
  max_lifetime: 60 * 30, // 30 minutes
  // Better error handling
  onnotice: () => {}, // Suppress notice messages
});
let db = drizzle(client);

// Export client for use in other files
export { client };

// Cache to track which tables have been initialized to prevent repeated checks
const tableInitCache = new Set<string>();

// Utility function to generate random IDs
function generateRandomId(): number {
  // Generate a random number between 100000000 and 999999999 (9 digits)
  return Math.floor(Math.random() * 900000000) + 100000000;
}

// Utility function to ensure unique ID
export async function generateUniqueId(table: any, column: any): Promise<number> {
  let id = generateRandomId();
  let maxAttempts = 10;
  
  while (maxAttempts > 0) {
    try {
      const existing = await db.select().from(table).where(eq(column, id)).limit(1);
      if (existing.length === 0) {
        return id;
      }
      id = generateRandomId();
      maxAttempts--;
    } catch (error) {
      // If table doesn't exist yet, return the generated ID
      return id;
    }
  }
  
  throw new Error('Could not generate unique ID after multiple attempts');
}

// City table schema
export const cityTable = pgTable('City', {
  id: integer('id').primaryKey(),
  userId: integer('userId'),
  cityName: varchar('cityName', { length: 255 }),
  mapName: varchar('mapName', { length: 255 }),
  population: integer('population'),
  money: integer('money'),
  xp: integer('xp'),
  theme: varchar('theme', { length: 100 }),
  preview: varchar('preview', { length: 255 }),
  saveGameData: varchar('saveGameData', { length: 255 }),
  sessionGuid: varchar('sessionGuid', { length: 255 }),
  gameMode: varchar('gameMode', { length: 50 }),
  autoSave: boolean('autoSave'),
  leftHandTraffic: boolean('leftHandTraffic'),
  naturalDisasters: boolean('naturalDisasters'),
  unlockAll: boolean('unlockAll'),
  unlimitedMoney: boolean('unlimitedMoney'),
  unlockMapTiles: boolean('unlockMapTiles'),
  simulationDate: json('simulationDate'),
  contentPrerequisites: text('contentPrerequisites').array(),
  modsEnabled: text('modsEnabled').array(),
  modsNotes: text('modsNotes'), // JSON string containing mod notes
  fileName: varchar('fileName', { length: 255 }),
  filePath: varchar('filePath', { length: 500 }),
  downloadable: boolean('downloadable').default(true),
  description: text('description'),
  osmMapPath: varchar('osmMapPath', { length: 500 }),
  uploadedAt: timestamp('uploadedAt', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).defaultNow(),
});

const cityImagesTable = pgTable('cityImages', {
  id: serial('id').primaryKey(),
  cityId: integer('cityId').references(() => cityTable.id, { onDelete: 'cascade' }),
  fileName: varchar('fileName', { length: 255 }),
  originalName: varchar('originalName', { length: 255 }),
  fileSize: integer('fileSize'),
  mimeType: varchar('mimeType', { length: 100 }),
  width: integer('width'),
  height: integer('height'),
  thumbnailPath: varchar('thumbnailPath', { length: 255 }),
  mediumPath: varchar('mediumPath', { length: 255 }),
  largePath: varchar('largePath', { length: 255 }),
  originalPath: varchar('originalPath', { length: 255 }),
  isPrimary: boolean('isPrimary').default(false),
  sortOrder: integer('sortOrder').default(0),
  uploadedAt: timestamp('uploadedAt').defaultNow(),
});

// Community features tables
const likesTable = pgTable('likes', {
  id: integer('id').primaryKey(),
  userId: integer('userId'),
  cityId: integer('cityId').references(() => cityTable.id, { onDelete: 'cascade' }),
  createdAt: timestamp('createdAt').defaultNow(),
});

const commentsTable = pgTable('comments', {
  id: integer('id').primaryKey(),
  userId: integer('userId'),
  cityId: integer('cityId').references(() => cityTable.id, { onDelete: 'cascade' }),
  content: text('content'),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow(),
});

const favoritesTable = pgTable('favorites', {
  id: integer('id').primaryKey(),
  userId: integer('userId'),
  cityId: integer('cityId').references(() => cityTable.id, { onDelete: 'cascade' }),
  createdAt: timestamp('createdAt').defaultNow(),
});

const commentLikesTable = pgTable('commentLikes', {
  id: integer('id').primaryKey(),
  userId: integer('userId'),
  commentId: integer('commentId').references(() => commentsTable.id, { onDelete: 'cascade' }),
  createdAt: timestamp('createdAt').defaultNow(),
});

const moderationSettingsTable = pgTable('moderationSettings', {
  id: serial('id').primaryKey(),
  key: varchar('key', { length: 100 }).unique().notNull(),
  value: json('value'),
  updatedAt: timestamp('updatedAt').defaultNow(),
});

const passwordResetTokensTable = pgTable('passwordResetTokens', {
  id: serial('id').primaryKey(),
  userId: integer('userId').notNull(),
  token: varchar('token', { length: 255 }).unique().notNull(),
  expiresAt: timestamp('expiresAt').notNull(),
  createdAt: timestamp('createdAt').defaultNow(),
});

const apiKeysTable = pgTable('apiKeys', {
  id: serial('id').primaryKey(),
  userId: integer('userId').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  key: varchar('key', { length: 255 }).unique().notNull(),
  isActive: boolean('isActive').default(true),
  lastUsed: timestamp('lastUsed'),
  createdAt: timestamp('createdAt').defaultNow(),
});

// Follows table for user following relationships
const followsTable = pgTable('follows', {
  id: serial('id').primaryKey(),
  followerId: integer('followerId').notNull(),
  followingId: integer('followingId').notNull(),
  createdAt: timestamp('createdAt').defaultNow(),
});

// Notifications table for user notifications
const notificationsTable = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: integer('userId').notNull(),
  type: varchar('type', { length: 50 }).notNull(), // 'new_city', 'like', 'comment', etc.
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  relatedUserId: integer('relatedUserId'), // User who triggered the notification
  relatedCityId: integer('relatedCityId'), // City related to the notification
  relatedCommentId: integer('relatedCommentId'), // Comment related to the notification
  metadata: text('metadata'), // Additional metadata as JSON string
  isRead: boolean('isRead').default(false),
  createdAt: timestamp('createdAt').defaultNow(),
});

// User social links table
const userSocialLinksTable = pgTable('userSocialLinks', {
  id: serial('id').primaryKey(),
  userId: integer('userId').notNull(),
  platform: varchar('platform', { length: 50 }).notNull(), // 'facebook', 'twitter', 'instagram', etc.
  url: varchar('url', { length: 500 }).notNull(),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow(),
});

// Mod compatibility cache table
const modCompatibilityTable = pgTable('modCompatibility', {
  id: serial('id').primaryKey(),
  modId: varchar('modId', { length: 50 }).unique().notNull(), // Steam Workshop ID
  name: varchar('name', { length: 255 }).notNull(),
  notes: json('notes').$type<string[]>(), // Array of compatibility notes
  lastUpdated: timestamp('lastUpdated').defaultNow(),
  createdAt: timestamp('createdAt').defaultNow(),
});

// Hall of Fame cache table
const hallOfFameCacheTable = pgTable('hallOfFameCache', {
  id: serial('id').primaryKey(),
  cityId: integer('cityId').references(() => cityTable.id, { onDelete: 'cascade' }),
  hofImageId: varchar('hofImageId', { length: 255 }).notNull(), // Hall of Fame image ID
  cityName: varchar('cityName', { length: 255 }).notNull(),
  cityPopulation: integer('cityPopulation'),
  cityMilestone: integer('cityMilestone'),
  imageUrlThumbnail: varchar('imageUrlThumbnail', { length: 500 }).notNull(),
  imageUrlFHD: varchar('imageUrlFHD', { length: 500 }).notNull(),
  imageUrl4K: varchar('imageUrl4K', { length: 500 }).notNull(),
  isPrimary: boolean('isPrimary').default(false),
  createdAt: timestamp('createdAt').defaultNow(),
  lastUpdated: timestamp('lastUpdated').defaultNow(),
});

// OSM Map Cache table removed - now using client-side caching with IndexedDB

export async function getUser(email: string) {
  const users = await ensureTableExists();
  return await db.select().from(users).where(eq(users.email, email));
}

export async function getUserByUsernameOrEmail(identifier: string) {
  const users = await ensureTableExists();
  return await db.select().from(users).where(
    or(
      eq(users.email, identifier),
      eq(users.username, identifier)
    )
  );
}

export async function createUser(email: string, password: string, username?: string) {
  const users = await ensureTableExists();
  let salt = genSaltSync(10);
  let hash = hashSync(password, salt);

  const userId = await generateUniqueId(users, users.id);
  const isAdmin = email === 'danielveerkamp@live.com'; // Always admin
  
  return await db.insert(users).values({ id: userId, email, password: hash, username, isAdmin });
}

export async function createOAuthUser(email: string, name: string, avatar?: string, googleId?: string, githubId?: string) {
  const users = await ensureTableExists();
  
  const userId = await generateUniqueId(users, users.id);
  const isAdmin = email === 'danielveerkamp@live.com'; // Always admin
  
  // Generate username from email if not provided
  const baseUsername = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  let username = baseUsername;
  let counter = 1;
  
  // Ensure username is unique
  while (true) {
    const existingUsername = await db.select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);
    
    if (existingUsername.length === 0) break;
    username = `${baseUsername}${counter}`;
    counter++;
  }
  
  const result = await db.insert(users).values({ 
    id: userId, 
    email, 
    name, 
    avatar, 
    googleId, 
    githubId,
    username, 
    isAdmin 
  }).returning();
  
  return result[0];
}

export async function getUserByGoogleId(googleId: string) {
  const users = await ensureTableExists();
  return await db.select().from(users).where(eq(users.googleId, googleId));
}

export async function getUserByGithubId(githubId: string) {
  const users = await ensureTableExists();
  return await db.select().from(users).where(eq(users.githubId, githubId));
}

export async function linkGoogleAccount(userId: number, googleId: string, name?: string, avatar?: string) {
  const users = await ensureTableExists();
  
  const updateData: any = { googleId };
  if (name) updateData.name = name;
  if (avatar) updateData.avatar = avatar;
  
  const result = await db.update(users)
    .set(updateData)
    .where(eq(users.id, userId))
    .returning();
  
  return result[0];
}

export async function linkGithubAccount(userId: number, githubId: string, name?: string, avatar?: string) {
  const users = await ensureTableExists();
  
  const updateData: any = { githubId };
  if (name) updateData.name = name;
  if (avatar) updateData.avatar = avatar;
  
  const result = await db.update(users)
    .set(updateData)
    .where(eq(users.id, userId))
    .returning();
  
  return result[0];
}

export async function updateUser(userId: number, data: { username?: string; isAdmin?: boolean; isContentCreator?: boolean; hofCreatorId?: string }) {
  const users = await ensureTableExists();
  
  if (data.username) {
    // Check if username already exists (excluding current user)
    const existingUser = await db.select()
      .from(users)
      .where(and(
        eq(users.username, data.username),
        sql`id != ${userId}`
      ))
      .limit(1);
    
    if (existingUser.length > 0) {
      throw new Error('Username already exists');
    }
  }

  const result = await db.update(users)
    .set(data)
    .where(eq(users.id, userId))
    .returning();

  return result[0];
}

export async function isUserAdmin(email: string): Promise<boolean> {
  const users = await ensureTableExists();
  
  const user = await db.select({ isAdmin: users.isAdmin })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  
  return user[0]?.isAdmin || false;
}

export async function isUserContentCreator(email: string): Promise<boolean> {
  const users = await ensureTableExists();
  
  const user = await db.select({ isContentCreator: users.isContentCreator })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  
  return user[0]?.isContentCreator || false;
}

export async function getAllUsersWithStats() {
  const users = await ensureTableExists();
  await ensureCityTableExists();
  
  const userStats = await db.select({
    id: users.id,
    email: users.email,
    username: users.username,
    isAdmin: users.isAdmin,
    isContentCreator: users.isContentCreator,
    cityCount: sql<number>`COALESCE(COUNT(CASE WHEN ${cityTable.id} IS NOT NULL THEN 1 END), 0)`.as('cityCount'),
    totalPopulation: sql<number>`COALESCE(SUM(${cityTable.population}), 0)`.as('totalPopulation'),
    totalMoney: sql<number>`COALESCE(SUM(${cityTable.money}), 0)`.as('totalMoney'),
    totalXP: sql<number>`COALESCE(SUM(${cityTable.xp}), 0)`.as('totalXP'),
    lastUpload: sql<Date | null>`MAX(${cityTable.uploadedAt})`.as('lastUpload'),
  })
    .from(users)
    .leftJoin(cityTable, eq(cityTable.userId, users.id))
    .groupBy(users.id, users.email, users.username, users.isAdmin, users.isContentCreator)
    .orderBy(desc(sql`COALESCE(COUNT(CASE WHEN ${cityTable.id} IS NOT NULL THEN 1 END), 0)`));
  
  return userStats;
}

export async function getTotalCityCount() {
  await ensureCityTableExists();
  
  const result = await db.select({ count: sql<number>`COUNT(*)` })
    .from(cityTable);
  
  return result[0]?.count || 0;
}

async function ensureTableExists() {
  const cacheKey = 'User';
  
  // Return cached table if already initialized
  if (tableInitCache.has(cacheKey)) {
    return pgTable('User', {
      id: integer('id').primaryKey(),
      email: varchar('email', { length: 64 }),
      password: varchar('password', { length: 64 }),
      username: varchar('username', { length: 32 }),
      name: varchar('name', { length: 100 }),
      avatar: varchar('avatar', { length: 255 }),
      googleId: varchar('googleId', { length: 100 }),
      githubId: varchar('githubId', { length: 100 }),
      pdxUsername: varchar('pdxUsername', { length: 50 }),
      discordUsername: varchar('discordUsername', { length: 50 }),
      isAdmin: boolean('isAdmin').default(false),
      isContentCreator: boolean('isContentCreator').default(false),
      hofCreatorId: varchar('hofCreatorId', { length: 100 }),
    });
  }
  
  const result = await client`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'User'
    );`;

  if (!result[0].exists) {
    await client`
      CREATE TABLE "User" (
        id INTEGER PRIMARY KEY,
        email VARCHAR(64) UNIQUE,
        password VARCHAR(64),
        username VARCHAR(32) UNIQUE,
        name VARCHAR(100),
        avatar VARCHAR(255),
        "googleId" VARCHAR(100) UNIQUE,
        "githubId" VARCHAR(100) UNIQUE,
        "pdxUsername" VARCHAR(50),
        "discordUsername" VARCHAR(50),
        "isAdmin" BOOLEAN DEFAULT FALSE
      );`;
  } else {
    // Check if username column exists, if not add it
    const usernameColumnExists = await client`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'User'
        AND column_name = 'username'
      );`;
    
    if (!usernameColumnExists[0].exists) {
      console.log('Adding username column to existing User table...');
      await client`
        ALTER TABLE "User" ADD COLUMN username VARCHAR(32) UNIQUE;`;
      console.log('Username column added successfully');
      
      // Generate usernames for existing users
      const existingUsers = await client`SELECT id, email FROM "User" WHERE username IS NULL;`;
      for (const user of existingUsers) {
        const baseUsername = user.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        let username = baseUsername;
        let counter = 1;
        
        // Ensure username is unique
        while (true) {
          const existingUsername = await client`SELECT id FROM "User" WHERE username = ${username};`;
          if (existingUsername.length === 0) break;
          username = `${baseUsername}${counter}`;
          counter++;
        }
        
        await client`UPDATE "User" SET username = ${username} WHERE id = ${user.id};`;
        console.log(`Generated username '${username}' for user ${user.email}`);
      }
    }
    
    // Check if name column exists, if not add it
    const nameColumnExists = await client`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'User'
        AND column_name = 'name'
      );`;
    
    if (!nameColumnExists[0].exists) {
      console.log('Adding name column to existing User table...');
      await client`
        ALTER TABLE "User" ADD COLUMN name VARCHAR(100);`;
      console.log('Name column added successfully');
    }

    // Check if avatar column exists, if not add it
    const avatarColumnExists = await client`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'User'
        AND column_name = 'avatar'
      );`;
    
    if (!avatarColumnExists[0].exists) {
      console.log('Adding avatar column to existing User table...');
      await client`
        ALTER TABLE "User" ADD COLUMN avatar VARCHAR(255);`;
      console.log('Avatar column added successfully');
    }

    // Check if googleId column exists, if not add it
    const googleIdColumnExists = await client`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'User'
        AND column_name = 'googleId'
      );`;
    
    if (!googleIdColumnExists[0].exists) {
      console.log('Adding googleId column to existing User table...');
      await client`
        ALTER TABLE "User" ADD COLUMN "googleId" VARCHAR(100) UNIQUE;`;
      console.log('GoogleId column added successfully');
    }

    // Check if githubId column exists, if not add it
    const githubIdColumnExists = await client`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'User'
        AND column_name = 'githubId'
      );`;
    
    if (!githubIdColumnExists[0].exists) {
      console.log('Adding githubId column to existing User table...');
      await client`
        ALTER TABLE "User" ADD COLUMN "githubId" VARCHAR(100) UNIQUE;`;
      console.log('GithubId column added successfully');
    }

    // Check if isAdmin column exists, if not add it
    const isAdminColumnExists = await client`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'User'
        AND column_name = 'isAdmin'
      );`;
    
    if (!isAdminColumnExists[0].exists) {
      console.log('Adding isAdmin column to existing User table...');
      await client`
        ALTER TABLE "User" ADD COLUMN "isAdmin" BOOLEAN DEFAULT FALSE;`;
      console.log('isAdmin column added successfully');
      
      // Set danielveerkamp@live.com as admin
      await client`
        UPDATE "User" SET "isAdmin" = TRUE WHERE email = 'danielveerkamp@live.com';`;
      console.log('Set danielveerkamp@live.com as admin');
    }

    // Check if pdxUsername column exists, if not add it
    const pdxUsernameColumnExists = await client`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'User'
        AND column_name = 'pdxUsername'
      );`;
    
    if (!pdxUsernameColumnExists[0].exists) {
      console.log('Adding pdxUsername column to existing User table...');
      await client`
        ALTER TABLE "User" ADD COLUMN "pdxUsername" VARCHAR(50);`;
      console.log('pdxUsername column added successfully');
    }

    // Check if discordUsername column exists, if not add it
    const discordUsernameColumnExists = await client`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'User'
        AND column_name = 'discordUsername'
      );`;
    
    if (!discordUsernameColumnExists[0].exists) {
      console.log('Adding discordUsername column to existing User table...');
      await client`
        ALTER TABLE "User" ADD COLUMN "discordUsername" VARCHAR(50);`;
      console.log('discordUsername column added successfully');
    }

    // Check if isContentCreator column exists, if not add it
    const isContentCreatorColumnExists = await client`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'User'
        AND column_name = 'isContentCreator'
      );`;
    
    if (!isContentCreatorColumnExists[0].exists) {
      console.log('Adding isContentCreator column to existing User table...');
      await client`
        ALTER TABLE "User" ADD COLUMN "isContentCreator" BOOLEAN DEFAULT FALSE;`;
      console.log('isContentCreator column added successfully');
    }

    // Check if hofCreatorId column exists, if not add it
    const hofCreatorIdColumnExists = await client`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'User'
        AND column_name = 'hofCreatorId'
      );`;
    
    if (!hofCreatorIdColumnExists[0].exists) {
      console.log('Adding hofCreatorId column to existing User table...');
      await client`
        ALTER TABLE "User" ADD COLUMN "hofCreatorId" VARCHAR(100);`;
      console.log('hofCreatorId column added successfully');
    }
  }

  // Mark as initialized
  tableInitCache.add(cacheKey);

  const table = pgTable('User', {
    id: integer('id').primaryKey(),
    email: varchar('email', { length: 64 }),
    password: varchar('password', { length: 64 }),
    username: varchar('username', { length: 32 }),
    name: varchar('name', { length: 100 }),
    avatar: varchar('avatar', { length: 255 }),
    googleId: varchar('googleId', { length: 100 }),
    githubId: varchar('githubId', { length: 100 }),
    pdxUsername: varchar('pdxUsername', { length: 50 }),
    discordUsername: varchar('discordUsername', { length: 50 }),
    isAdmin: boolean('isAdmin').default(false),
    isContentCreator: boolean('isContentCreator').default(false),
    hofCreatorId: varchar('hofCreatorId', { length: 100 }),
  });

  return table;
}
async function ensureCityTableExists() {
  const cacheKey = 'City';
  
  // Return if already initialized
  if (tableInitCache.has(cacheKey)) {
    return cityTable;
  }
  
  const result = await client`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'City'
    );`;

  if (!result[0].exists) {
    await client`
      CREATE TABLE "City" (
        id INTEGER PRIMARY KEY,
        "userId" INTEGER,
        "cityName" VARCHAR(255),
        "mapName" VARCHAR(255),
        population INTEGER,
        money INTEGER,
        xp INTEGER,
        theme VARCHAR(100),
        preview VARCHAR(255),
        "saveGameData" VARCHAR(255),
        "sessionGuid" VARCHAR(255),
        "gameMode" VARCHAR(50),
        "autoSave" BOOLEAN,
        "leftHandTraffic" BOOLEAN,
        "naturalDisasters" BOOLEAN,
        "unlockAll" BOOLEAN,
        "unlimitedMoney" BOOLEAN,
        "unlockMapTiles" BOOLEAN,
        "simulationDate" JSONB,
              "contentPrerequisites" TEXT[],
      "modsEnabled" TEXT[],
      "modsNotes" TEXT,
      "fileName" VARCHAR(255),
        "filePath" VARCHAR(500),
        "downloadable" BOOLEAN DEFAULT TRUE,
        description TEXT,
        "osmMapPath" VARCHAR(500),
        "uploadedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );`;
  } else {
    // Check if filePath column exists, if not add it
    const filePathColumnExists = await client`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'City'
        AND column_name = 'filePath'
      );`;
    
    if (!filePathColumnExists[0].exists) {
      console.log('Adding filePath column to existing City table...');
      await client`
        ALTER TABLE "City" ADD COLUMN "filePath" VARCHAR(500);`;
      console.log('filePath column added successfully');
    }

    // Check if downloadable column exists, if not add it
    const downloadableColumnExists = await client`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'City'
        AND column_name = 'downloadable'
      );`;
    
    if (!downloadableColumnExists[0].exists) {
      console.log('Adding downloadable column to existing City table...');
      await client`
        ALTER TABLE "City" ADD COLUMN "downloadable" BOOLEAN DEFAULT TRUE;`;
      console.log('downloadable column added successfully');
    }

    // Check if description column exists, if not add it
    const descriptionColumnExists = await client`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'City'
        AND column_name = 'description'
      );`;
    
    if (!descriptionColumnExists[0].exists) {
      console.log('Adding description column to existing City table...');
      await client`
        ALTER TABLE "City" ADD COLUMN description TEXT;`;
      console.log('description column added successfully');
    }

    // Check if osmMapPath column exists, if not add it
    const osmMapPathColumnExists = await client`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'City'
        AND column_name = 'osmMapPath'
      );`;
    
    if (!osmMapPathColumnExists[0].exists) {
      console.log('Adding osmMapPath column to existing City table...');
      await client`
        ALTER TABLE "City" ADD COLUMN "osmMapPath" VARCHAR(500);`;
      console.log('osmMapPath column added successfully');
    }

    // Check if modsNotes column exists, if not add it
    const modsNotesColumnExists = await client`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'City'
        AND column_name = 'modsNotes'
      );`;
    
    if (!modsNotesColumnExists[0].exists) {
      console.log('Adding modsNotes column to existing City table...');
      await client`
        ALTER TABLE "City" ADD COLUMN "modsNotes" TEXT;`;
      console.log('modsNotes column added successfully');
    }
  }

  // Mark as initialized
  tableInitCache.add(cacheKey);

  return cityTable;
}

export async function getRecentCities(limit: number = 12, offset: number = 0) {
  await ensureCityTableExists();
  await ensureCityImagesTableExists();
  await ensureHallOfFameCacheTableExists();
  const users = await ensureTableExists();

  // Get ALL cities with their images (if any) and sort by upload date
  const allCities = await db
    .select({
      id: cityTable.id,
      userId: cityTable.userId,
      cityName: cityTable.cityName,
      mapName: cityTable.mapName,
      population: cityTable.population,
      money: cityTable.money,
      xp: cityTable.xp,
      unlimitedMoney: cityTable.unlimitedMoney,
      uploadedAt: cityTable.uploadedAt,
      user: {
        id: users.id,
        username: users.username,
      },
      images: sql<Array<{ id: number; fileName: string; isPrimary: boolean; mediumPath: string; largePath: string; thumbnailPath: string; isHallOfFame?: boolean }>>`
        (
          SELECT COALESCE(json_agg(json_build_object('id', i.id, 'fileName', i."fileName", 'isPrimary', i."isPrimary", 'mediumPath', i."mediumPath", 'largePath', i."largePath", 'thumbnailPath', i."thumbnailPath", 'isHallOfFame', false)), '[]'::json)
          FROM "cityImages" i
          WHERE i."cityId" = "City".id AND i."isPrimary" = true
        )
      `,
      commentCount: sql<number>`(SELECT COUNT(*) FROM "comments" WHERE "cityId" = "City".id)`.as('commentCount'),
    })
    .from(cityTable)
    .leftJoin(users, eq(cityTable.userId, users.id))
    .orderBy(desc(cityTable.uploadedAt))
    .limit(limit)
    .offset(offset);

  // For cities without primary screenshots, check if they have Hall of Fame images
  const citiesWithHallOfFame = await db
    .select({
      id: cityTable.id,
      userId: cityTable.userId,
      cityName: cityTable.cityName,
      mapName: cityTable.mapName,
      population: cityTable.population,
      money: cityTable.money,
      xp: cityTable.xp,
      unlimitedMoney: cityTable.unlimitedMoney,
      uploadedAt: cityTable.uploadedAt,
      user: {
        id: users.id,
        username: users.username,
      },
      images: sql<Array<{ id: number; fileName: string; isPrimary: boolean; mediumPath: string; largePath: string; thumbnailPath: string; isHallOfFame?: boolean }>>`
        (
          SELECT COALESCE(json_agg(json_build_object('id', h."hofImageId", 'fileName', h."cityName", 'isPrimary', h."isPrimary", 'mediumPath', h."imageUrlFHD", 'largePath', h."imageUrl4K", 'thumbnailPath', h."imageUrlThumbnail", 'isHallOfFame', true) ORDER BY h."isPrimary" DESC, h."createdAt" ASC), '[]'::json)
          FROM "hallOfFameCache" h
          WHERE h."cityName" = "City"."cityName"
        )
      `,
      commentCount: sql<number>`(SELECT COUNT(*) FROM "comments" WHERE "cityId" = "City".id)`.as('commentCount'),
    })
    .from(cityTable)
    .leftJoin(users, eq(cityTable.userId, users.id))
    .innerJoin(hallOfFameCacheTable, eq(hallOfFameCacheTable.cityName, cityTable.cityName))
    .where(
      sql`NOT EXISTS (SELECT 1 FROM "cityImages" WHERE "cityId" = "City".id AND "isPrimary" = true)`
    )
    .groupBy(cityTable.id, users.id);

  // Create a map of cities with Hall of Fame images for quick lookup
  const hofCitiesMap = new Map(citiesWithHallOfFame.map(city => [city.id, city]));

  // Update cities that have Hall of Fame images
  const updatedCities = allCities.map(city => {
    const hofCity = hofCitiesMap.get(city.id);
    if (hofCity && city.images.length === 0) {
      return { ...city, images: hofCity.images };
    }
    return city;
  });

  return updatedCities;
}

export async function getTopCitiesByMoney(limit: number = 3) {
  await ensureCityTableExists();
  await ensureCityImagesTableExists();
  await ensureHallOfFameCacheTableExists();
  const users = await ensureTableExists();
  
  // Get cities with primary screenshots
  const citiesWithScreenshots = await db
    .select({
      id: cityTable.id,
      userId: cityTable.userId,
      cityName: cityTable.cityName,
      mapName: cityTable.mapName,
      population: cityTable.population,
      money: cityTable.money,
      xp: cityTable.xp,
      uploadedAt: cityTable.uploadedAt,
      user: {
        id: users.id,
        username: users.username,
      },
      images: sql<Array<{ id: number; fileName: string; isPrimary: boolean; mediumPath: string; largePath: string; thumbnailPath: string; isHallOfFame?: boolean }>>`
        (
          SELECT COALESCE(json_agg(json_build_object('id', i.id, 'fileName', i."fileName", 'isPrimary', i."isPrimary", 'mediumPath', i."mediumPath", 'largePath', i."largePath", 'thumbnailPath', i."thumbnailPath", 'isHallOfFame', false)), '[]'::json)
          FROM "cityImages" i
          WHERE i."cityId" = "City".id AND i."isPrimary" = true
        )
      `,
      commentCount: sql<number>`(SELECT COUNT(*) FROM "comments" WHERE "cityId" = "City".id)`.as('commentCount'),
    })
    .from(cityTable)
    .leftJoin(users, eq(cityTable.userId, users.id))
    .innerJoin(cityImagesTable, eq(cityTable.id, cityImagesTable.cityId))
    .where(eq(cityImagesTable.isPrimary, true))
    .groupBy(cityTable.id, users.id)
    .orderBy(desc(cityTable.money))
    .limit(limit);

  // Get cities with Hall of Fame images (that don't have primary screenshots)
  const citiesWithHallOfFame = await db
    .select({
      id: cityTable.id,
      userId: cityTable.userId,
      cityName: cityTable.cityName,
      mapName: cityTable.mapName,
      population: cityTable.population,
      money: cityTable.money,
      xp: cityTable.xp,
      uploadedAt: cityTable.uploadedAt,
      user: {
        id: users.id,
        username: users.username,
      },
      images: sql<Array<{ id: number; fileName: string; isPrimary: boolean; mediumPath: string; largePath: string; thumbnailPath: string; isHallOfFame?: boolean }>>`
        (
          SELECT COALESCE(json_agg(json_build_object('id', h."hofImageId", 'fileName', h."cityName", 'isPrimary', h."isPrimary", 'mediumPath', h."imageUrlFHD", 'largePath', h."imageUrl4K", 'thumbnailPath', h."imageUrlThumbnail", 'isHallOfFame', true) ORDER BY h."isPrimary" DESC, h."createdAt" ASC), '[]'::json)
          FROM "hallOfFameCache" h
          WHERE h."cityName" = "City"."cityName"
        )
      `,
      commentCount: sql<number>`(SELECT COUNT(*) FROM "comments" WHERE "cityId" = "City".id)`.as('commentCount'),
    })
    .from(cityTable)
    .leftJoin(users, eq(cityTable.userId, users.id))
    .innerJoin(hallOfFameCacheTable, eq(hallOfFameCacheTable.cityName, cityTable.cityName))
    .where(
      sql`NOT EXISTS (SELECT 1 FROM "cityImages" WHERE "cityId" = "City".id AND "isPrimary" = true)`
    )
    .groupBy(cityTable.id, users.id)
    .orderBy(desc(cityTable.money))
    .limit(limit);

  // Combine and sort by money
  const allCities = [...citiesWithScreenshots, ...citiesWithHallOfFame];
  allCities.sort((a, b) => (b.money || 0) - (a.money || 0));

  return allCities.slice(0, limit);
}

export async function getTopCitiesByLikes(limit: number = 3) {
  await ensureCityTableExists();
  await ensureLikesTableExists();
  await ensureCityImagesTableExists();
  await ensureHallOfFameCacheTableExists();
  const users = await ensureTableExists();

  // Get cities with primary screenshots
  const citiesWithScreenshots = await db
    .select({
      id: cityTable.id,
      userId: cityTable.userId,
      cityName: cityTable.cityName,
      mapName: cityTable.mapName,
      population: cityTable.population,
      money: cityTable.money,
      xp: cityTable.xp,
      unlimitedMoney: cityTable.unlimitedMoney,
      uploadedAt: cityTable.uploadedAt,
      likeCount: sql<number>`count(${likesTable.id})`,
      user: {
        id: users.id,
        username: users.username,
      },
      images: sql<Array<{ id: number; fileName: string; isPrimary: boolean; mediumPath: string; largePath: string; thumbnailPath: string; isHallOfFame?: boolean }>>`
        (
          SELECT COALESCE(json_agg(json_build_object('id', i.id, 'fileName', i."fileName", 'isPrimary', i."isPrimary", 'mediumPath', i."mediumPath", 'largePath', i."largePath", 'thumbnailPath', i."thumbnailPath", 'isHallOfFame', false)), '[]'::json)
          FROM "cityImages" i
          WHERE i."cityId" = "City".id AND i."isPrimary" = true
        )
      `,
      commentCount: sql<number>`(SELECT COUNT(*) FROM "comments" WHERE "cityId" = "City".id)`.as('commentCount'),
    })
    .from(cityTable)
    .leftJoin(likesTable, eq(cityTable.id, likesTable.cityId))
    .leftJoin(users, eq(cityTable.userId, users.id))
    .innerJoin(cityImagesTable, eq(cityTable.id, cityImagesTable.cityId))
    .where(eq(cityImagesTable.isPrimary, true))
    .groupBy(cityTable.id, users.id)
    .orderBy(desc(sql`count(${likesTable.id})`))
    .limit(limit);

  // Get cities with Hall of Fame images (that don't have primary screenshots)
  const citiesWithHallOfFame = await db
    .select({
      id: cityTable.id,
      userId: cityTable.userId,
      cityName: cityTable.cityName,
      mapName: cityTable.mapName,
      population: cityTable.population,
      money: cityTable.money,
      xp: cityTable.xp,
      unlimitedMoney: cityTable.unlimitedMoney,
      uploadedAt: cityTable.uploadedAt,
      likeCount: sql<number>`count(${likesTable.id})`,
      user: {
        id: users.id,
        username: users.username,
      },
      images: sql<Array<{ id: number; fileName: string; isPrimary: boolean; mediumPath: string; largePath: string; thumbnailPath: string; isHallOfFame?: boolean }>>`
        (
          SELECT COALESCE(json_agg(json_build_object('id', h."hofImageId", 'fileName', h."cityName", 'isPrimary', h."isPrimary", 'mediumPath', h."imageUrlFHD", 'largePath', h."imageUrl4K", 'thumbnailPath', h."imageUrlThumbnail", 'isHallOfFame', true) ORDER BY h."isPrimary" DESC, h."createdAt" ASC), '[]'::json)
          FROM "hallOfFameCache" h
          WHERE h."cityName" = "City"."cityName"
        )
      `,
      commentCount: sql<number>`(SELECT COUNT(*) FROM "comments" WHERE "cityId" = "City".id)`.as('commentCount'),
    })
    .from(cityTable)
    .leftJoin(likesTable, eq(cityTable.id, likesTable.cityId))
    .leftJoin(users, eq(cityTable.userId, users.id))
    .innerJoin(hallOfFameCacheTable, eq(hallOfFameCacheTable.cityName, cityTable.cityName))
    .where(
      sql`NOT EXISTS (SELECT 1 FROM "cityImages" WHERE "cityId" = "City".id AND "isPrimary" = true)`
    )
    .groupBy(cityTable.id, users.id)
    .orderBy(desc(sql`count(${likesTable.id})`))
    .limit(limit);

  // Combine and sort by like count
  const allCities = [...citiesWithScreenshots, ...citiesWithHallOfFame];
  allCities.sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0));

  return allCities.slice(0, limit);
}

export async function getTopCitiesWithImages(limit: number = 25) {
  await ensureCityTableExists();
  await ensureLikesTableExists();
  await ensureCityImagesTableExists();
  await ensureHallOfFameCacheTableExists();
  const users = await ensureTableExists();

  // First get cities with primary screenshots
  const citiesWithScreenshots = await db
    .select({
      id: cityTable.id,
      userId: cityTable.userId,
      cityName: cityTable.cityName,
      mapName: cityTable.mapName,
      population: cityTable.population,
      money: cityTable.money,
      xp: cityTable.xp,
      unlimitedMoney: cityTable.unlimitedMoney,
      uploadedAt: cityTable.uploadedAt,
      likeCount: sql<number>`(SELECT COUNT(*) FROM "likes" WHERE "cityId" = "City".id)`.as('likeCount'),
      user: {
        id: users.id,
        username: users.username,
      },
      images: sql<Array<{ id: number; fileName: string; isPrimary: boolean; mediumPath: string; largePath: string; originalPath: string; thumbnailPath: string; isHallOfFame?: boolean }>>`
        (
          SELECT COALESCE(json_agg(json_build_object(
            'id', i.id,
            'fileName', i."fileName",
            'isPrimary', i."isPrimary",
            'mediumPath', i."mediumPath",
            'largePath', i."largePath",
            'originalPath', i."originalPath",
            'thumbnailPath', i."thumbnailPath",
            'isHallOfFame', false
          )), '[]'::json)
          FROM "cityImages" i
          WHERE i."cityId" = "City".id AND i."isPrimary" = true
        )
      `,
      commentCount: sql<number>`(SELECT COUNT(*) FROM "comments" WHERE "cityId" = "City".id)`.as('commentCount'),
    })
    .from(cityTable)
    .leftJoin(users, eq(cityTable.userId, users.id))
    .innerJoin(cityImagesTable, eq(cityTable.id, cityImagesTable.cityId))
    .where(eq(cityImagesTable.isPrimary, true))
    .groupBy(cityTable.id, users.id);

  // Then get cities with Hall of Fame images (that don't have primary screenshots)
  const citiesWithHallOfFame = await db
    .select({
      id: cityTable.id,
      userId: cityTable.userId,
      cityName: cityTable.cityName,
      mapName: cityTable.mapName,
      population: cityTable.population,
      money: cityTable.money,
      xp: cityTable.xp,
      unlimitedMoney: cityTable.unlimitedMoney,
      uploadedAt: cityTable.uploadedAt,
      likeCount: sql<number>`(SELECT COUNT(*) FROM "likes" WHERE "cityId" = "City".id)`.as('likeCount'),
      user: {
        id: users.id,
        username: users.username,
      },
      images: sql<Array<{ id: number; fileName: string; isPrimary: boolean; mediumPath: string; largePath: string; originalPath: string; thumbnailPath: string; isHallOfFame?: boolean }>>`
        (
          SELECT COALESCE(json_agg(json_build_object(
            'id', h."hofImageId",
            'fileName', h."cityName",
            'isPrimary', h."isPrimary",
            'mediumPath', h."imageUrlFHD",
            'largePath', h."imageUrl4K",
            'originalPath', h."imageUrl4K",
            'thumbnailPath', h."imageUrlThumbnail",
            'isHallOfFame', true
          ) ORDER BY h."isPrimary" DESC, h."createdAt" ASC), '[]'::json)
          FROM "hallOfFameCache" h
          WHERE h."cityName" = "City"."cityName"
        )
      `,
      commentCount: sql<number>`(SELECT COUNT(*) FROM "comments" WHERE "cityId" = "City".id)`.as('commentCount'),
    })
    .from(cityTable)
    .leftJoin(users, eq(cityTable.userId, users.id))
    .innerJoin(hallOfFameCacheTable, eq(hallOfFameCacheTable.cityName, cityTable.cityName))
    .where(
      sql`NOT EXISTS (SELECT 1 FROM "cityImages" WHERE "cityId" = "City".id AND "isPrimary" = true)`
    )
    .groupBy(cityTable.id, users.id);

  // Combine and sort by like count
  const allCities = [...citiesWithScreenshots, ...citiesWithHallOfFame];
  allCities.sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0));

  return allCities.slice(0, limit);
}

export async function getContentCreatorCities(limit: number = 6) {
  await ensureCityTableExists();
  const users = await ensureTableExists();
  
  // Get current date as seed for daily randomization
  const today = new Date();
  const dateSeed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  
  const cities = await db
    .select({
      id: cityTable.id,
      userId: cityTable.userId,
      cityName: cityTable.cityName,
      mapName: cityTable.mapName,
      population: cityTable.population,
      money: cityTable.money,
      xp: cityTable.xp,
      unlimitedMoney: cityTable.unlimitedMoney,
      uploadedAt: cityTable.uploadedAt,
      user: {
        id: users.id,
        username: users.username,
      },
      images: sql<Array<{ id: number; fileName: string; isPrimary: boolean; mediumPath: string; largePath: string; thumbnailPath: string }>>`
        (
          SELECT COALESCE(json_agg(json_build_object('id', i.id, 'fileName', i."fileName", 'isPrimary', i."isPrimary", 'mediumPath', i."mediumPath", 'largePath', i."largePath", 'thumbnailPath', i."thumbnailPath")), '[]'::json)
          FROM "cityImages" i
          WHERE i."cityId" = "City".id
        )
      `,
      commentCount: sql<number>`(SELECT COUNT(*) FROM "comments" WHERE "cityId" = "City".id)`.as('commentCount'),
    })
    .from(cityTable)
    .leftJoin(users, eq(cityTable.userId, users.id))
    .where(eq(users.isContentCreator, true))
    .orderBy(sql`RANDOM() * ${dateSeed}`)
    .limit(limit);

  return cities;
}

export async function getCitiesByUser(userId: number) {
  await ensureCityTableExists();
  await ensureCityImagesTableExists();
  await ensureHallOfFameCacheTableExists();
  await ensureCommentsTableExists();
  const users = await ensureTableExists();
  
  // Get cities with primary screenshots
  const citiesWithScreenshots = await db.select({
    id: cityTable.id,
    userId: cityTable.userId,
    cityName: cityTable.cityName,
    mapName: cityTable.mapName,
    population: cityTable.population,
    money: cityTable.money,
    xp: cityTable.xp,
    unlimitedMoney: cityTable.unlimitedMoney,
    theme: cityTable.theme,
    gameMode: cityTable.gameMode,
    fileName: cityTable.fileName,
    filePath: cityTable.filePath,
    downloadable: cityTable.downloadable,
    uploadedAt: cityTable.uploadedAt,
    modsEnabled: cityTable.modsEnabled,
    user: {
      id: users.id,
      username: users.username,
    },
    images: sql<Array<{ id: number; fileName: string; isPrimary: boolean; mediumPath: string; largePath: string; thumbnailPath: string; isHallOfFame?: boolean }>>`
      (
        SELECT COALESCE(json_agg(json_build_object('id', i.id, 'fileName', i."fileName", 'isPrimary', i."isPrimary", 'mediumPath', i."mediumPath", 'largePath', i."largePath", 'thumbnailPath', i."thumbnailPath", 'isHallOfFame', false)), '[]'::json)
        FROM "cityImages" i
        WHERE i."cityId" = "City".id AND i."isPrimary" = true
      )
    `,
    commentCount: sql<number>`(SELECT COUNT(*) FROM "comments" WHERE "cityId" = "City".id)`.as('commentCount'),
  })
    .from(cityTable)
    .leftJoin(users, eq(cityTable.userId, users.id))
    .where(eq(cityTable.userId, userId))
    .orderBy(desc(cityTable.uploadedAt));

  // Get cities with Hall of Fame images (that don't have primary screenshots)
  const citiesWithHallOfFame = await db.select({
    id: cityTable.id,
    userId: cityTable.userId,
    cityName: cityTable.cityName,
    mapName: cityTable.mapName,
    population: cityTable.population,
    money: cityTable.money,
    xp: cityTable.xp,
    unlimitedMoney: cityTable.unlimitedMoney,
    theme: cityTable.theme,
    gameMode: cityTable.gameMode,
    fileName: cityTable.fileName,
    filePath: cityTable.filePath,
    downloadable: cityTable.downloadable,
    uploadedAt: cityTable.uploadedAt,
    modsEnabled: cityTable.modsEnabled,
    user: {
      id: users.id,
      username: users.username,
    },
    images: sql<Array<{ id: number; fileName: string; isPrimary: boolean; mediumPath: string; largePath: string; thumbnailPath: string; isHallOfFame?: boolean }>>`
      (
        SELECT COALESCE(json_agg(json_build_object('id', h."hofImageId", 'fileName', h."cityName", 'isPrimary', h."isPrimary", 'mediumPath', h."imageUrlFHD", 'largePath', h."imageUrl4K", 'thumbnailPath', h."imageUrlThumbnail", 'isHallOfFame', true) ORDER BY h."isPrimary" DESC, h."createdAt" ASC), '[]'::json)
        FROM "hallOfFameCache" h
        WHERE h."cityName" = "City"."cityName"
      )
    `,
    commentCount: sql<number>`(SELECT COUNT(*) FROM "comments" WHERE "cityId" = "City".id)`.as('commentCount'),
  })
    .from(cityTable)
    .leftJoin(users, eq(cityTable.userId, users.id))
    .innerJoin(hallOfFameCacheTable, eq(hallOfFameCacheTable.cityName, cityTable.cityName))
    .where(
      and(
        eq(cityTable.userId, userId),
        sql`NOT EXISTS (SELECT 1 FROM "cityImages" WHERE "cityId" = "City".id AND "isPrimary" = true)`
      )
    )
    .groupBy(cityTable.id, users.id)
    .orderBy(desc(cityTable.uploadedAt));

  // Create a map of cities with Hall of Fame images for quick lookup
  const hofCitiesMap = new Map(citiesWithHallOfFame.map(city => [city.id, city]));

  // Update cities that have Hall of Fame images
  const updatedCities = citiesWithScreenshots.map(city => {
    const hofCity = hofCitiesMap.get(city.id);
    if (hofCity && city.images.length === 0) {
      return { ...city, images: hofCity.images };
    }
    return city;
  });

  // Add cities that only have Hall of Fame images
  const citiesOnlyWithHof = citiesWithHallOfFame.filter(city => !hofCitiesMap.has(city.id) || citiesWithScreenshots.every(c => c.id !== city.id));

  return [...updatedCities, ...citiesOnlyWithHof].sort((a, b) => {
    const dateA = a.uploadedAt ? new Date(a.uploadedAt).getTime() : 0;
    const dateB = b.uploadedAt ? new Date(b.uploadedAt).getTime() : 0;
    return dateB - dateA;
  });
}

export async function getCityCountByUser(userId: number) {
  await ensureCityTableExists();
  
  const result = await db.select({
    count: sql<number>`cast(count(*) as integer)`
  })
    .from(cityTable)
    .where(eq(cityTable.userId, userId));
  
  return result[0]?.count || 0;
}

export async function getCityById(id: number) {
  await ensureCityTableExists();
  const result = await db.select({
    id: cityTable.id,
    userId: cityTable.userId,
    cityName: cityTable.cityName,
    mapName: cityTable.mapName,
    population: cityTable.population,
    money: cityTable.money,
    xp: cityTable.xp,
    theme: cityTable.theme,
    preview: cityTable.preview,
    saveGameData: cityTable.saveGameData,
    sessionGuid: cityTable.sessionGuid,
    gameMode: cityTable.gameMode,
    autoSave: cityTable.autoSave,
    leftHandTraffic: cityTable.leftHandTraffic,
    naturalDisasters: cityTable.naturalDisasters,
    unlockAll: cityTable.unlockAll,
    unlimitedMoney: cityTable.unlimitedMoney,
    unlockMapTiles: cityTable.unlockMapTiles,
    simulationDate: cityTable.simulationDate,
    contentPrerequisites: cityTable.contentPrerequisites,
    modsEnabled: cityTable.modsEnabled,
    modsNotes: cityTable.modsNotes,
    fileName: cityTable.fileName,
    filePath: cityTable.filePath,
    downloadable: cityTable.downloadable,
    description: cityTable.description,
    osmMapPath: cityTable.osmMapPath,
    uploadedAt: cityTable.uploadedAt,
    updatedAt: cityTable.updatedAt,
  }).from(cityTable).where(eq(cityTable.id, id)).limit(1);
  return result[0] || null;
}

export async function getUserById(id: number) {
  const users = await ensureTableExists();
  const result = await db.select({
    id: users.id,
    email: users.email,
    username: users.username,
    name: users.name,
    avatar: users.avatar,
    isAdmin: users.isAdmin,
    isContentCreator: users.isContentCreator,
    hofCreatorId: users.hofCreatorId,
  }).from(users).where(eq(users.id, id)).limit(1);
  return result[0] || null;
}

export async function deleteCityById(cityId: number, userId: number) {
  await ensureCityTableExists();
  // Only allow users to delete their own cities
  const result = await db.delete(cityTable)
    .where(and(eq(cityTable.id, cityId), eq(cityTable.userId, userId)))
    .returning();
  return result[0] || null;
}

export async function adminDeleteCityById(cityId: number) {
  await ensureCityTableExists();
  // Admin can delete any city without ownership check
  const result = await db.delete(cityTable)
    .where(eq(cityTable.id, cityId))
    .returning();
  return result[0] || null;
}

export async function updateCityDownloadable(cityId: number, userId: number, downloadable: boolean) {
  await ensureCityTableExists();
  // Only allow users to update their own cities
  const result = await db.update(cityTable)
    .set({ downloadable, updatedAt: new Date() })
    .where(and(eq(cityTable.id, cityId), eq(cityTable.userId, userId)))
    .returning();
  return result[0] || null;
}

export async function updateCityDescription(cityId: number, userId: number, description: string) {
  await ensureCityTableExists();
  // Only allow users to update their own cities
  const result = await db.update(cityTable)
    .set({ description, updatedAt: new Date() })
    .where(and(eq(cityTable.id, cityId), eq(cityTable.userId, userId)))
    .returning();
  return result[0] || null;
}

export async function updateCityOsmMap(cityId: number, userId: number, osmMapPath: string) {
  await ensureCityTableExists();
  // Only allow users to update their own cities
  const result = await db.update(cityTable)
    .set({ osmMapPath, updatedAt: new Date() })
    .where(and(eq(cityTable.id, cityId), eq(cityTable.userId, userId)))
    .returning();
  return result[0] || null;
}

export interface SearchFilters {
  query?: string;
  theme?: string;
  gameMode?: string;
  minPopulation?: number;
  maxPopulation?: number;
  minMoney?: number;
  maxMoney?: number;
  sortBy?: 'newest' | 'oldest' | 'population' | 'money' | 'xp' | 'name';
  sortOrder?: 'asc' | 'desc';
}

export async function searchCities(
  filters: SearchFilters = {},
  limit: number = 12,
  offset: number = 0
) {
  await ensureCityTableExists();
  const userTable = await ensureTableExists();
  const conditions = [];

  // Build filter conditions
  if (filters.query) {
    const searchTerm = filters.query.toLowerCase().trim();
    if (searchTerm) {
      const words = searchTerm.split(/\s+/);
      const wordConditions = words.map(word => 
        or(
          ilike(cityTable.cityName, `%${word}%`),
          ilike(cityTable.mapName, `%${word}%`),
          ilike(userTable.username, `%${word}%`)
        )
      );
      conditions.push(and(...wordConditions));
    }
  }
  if (filters.theme) conditions.push(eq(cityTable.theme, filters.theme));
  if (filters.gameMode) conditions.push(eq(cityTable.gameMode, filters.gameMode));
  if (filters.minPopulation) conditions.push(gte(cityTable.population, filters.minPopulation));
  if (filters.maxPopulation) conditions.push(lte(cityTable.population, filters.maxPopulation));
  if (filters.minMoney) conditions.push(gte(cityTable.money, filters.minMoney));
  if (filters.maxMoney) conditions.push(lte(cityTable.money, filters.maxMoney));

  // Determine sorting
  const sortBy = filters.sortBy || 'newest';
  const sortOrder = filters.sortOrder || 'desc';
  let orderByClause;
  switch (sortBy) {
    case 'population': orderByClause = sortOrder === 'desc' ? desc(cityTable.population) : asc(cityTable.population); break;
    case 'money': orderByClause = sortOrder === 'desc' ? desc(cityTable.money) : asc(cityTable.money); break;
    case 'xp': orderByClause = sortOrder === 'desc' ? desc(cityTable.xp) : asc(cityTable.xp); break;
    case 'name': orderByClause = sortOrder === 'desc' ? desc(cityTable.cityName) : asc(cityTable.cityName); break;
    default: orderByClause = sortOrder === 'desc' ? desc(cityTable.uploadedAt) : asc(cityTable.uploadedAt);
  }

  // Base query with subqueries to prevent row duplication
  const query = db
    .select({
      id: cityTable.id,
      userId: cityTable.userId,
      cityName: cityTable.cityName,
      mapName: cityTable.mapName,
      population: cityTable.population,
      money: cityTable.money,
      xp: cityTable.xp,
      unlimitedMoney: cityTable.unlimitedMoney,
      theme: cityTable.theme,
      gameMode: cityTable.gameMode,
      uploadedAt: cityTable.uploadedAt,
      modsEnabled: cityTable.modsEnabled,
      authorUsername: userTable.username,
      user: {
        id: userTable.id,
        username: userTable.username,
      },
      // Subquery for images to prevent row duplication
      images: sql<Array<{ id: number; fileName: string; isPrimary: boolean; mediumPath: string; largePath: string; thumbnailPath: string }>>`
        (
          SELECT COALESCE(json_agg(json_build_object('id', i.id, 'fileName', i."fileName", 'isPrimary', i."isPrimary", 'mediumPath', i."mediumPath", 'largePath', i."largePath", 'thumbnailPath', i."thumbnailPath")), '[]'::json)
          FROM "cityImages" i
          WHERE i."cityId" = "City".id
        )
      `,
      // Subquery for comment count
      commentCount: sql<number>`(SELECT COUNT(*) FROM "comments" WHERE "cityId" = "City".id)`.as('commentCount'),
    })
    .from(cityTable)
    .leftJoin(userTable, eq(cityTable.userId, userTable.id))
    .orderBy(orderByClause)
    .limit(limit)
    .offset(offset);

  // Apply conditions if they exist
  if (conditions.length > 0) {
    return await query.where(and(...conditions));
  }
  
  return await query;
}

export async function getSearchCitiesCount(filters: SearchFilters = {}) {
  await ensureCityTableExists();
  
  const userTable = await ensureTableExists();
  
  const conditions = [];
  
  // Text search in city name, map name, and username (case-insensitive with better partial matching)
  if (filters.query) {
    const searchTerm = filters.query.toLowerCase().trim();
    
    if (searchTerm) {
      // Split the search term into words and create conditions for each
      const words = searchTerm.split(/\s+/);
      const wordConditions = words.map(word => 
        or(
          ilike(cityTable.cityName, `%${word}%`),
          ilike(cityTable.mapName, `%${word}%`),
          ilike(userTable.username, `%${word}%`),
          ilike(userTable.email, `%${word}%`)
        )
      );
      
      // All words must match (AND logic)
      if (wordConditions.length > 1) {
        conditions.push(and(...wordConditions));
      } else {
        conditions.push(wordConditions[0]);
      }
    }
  }
  
  // Theme filter (case-insensitive)
  if (filters.theme) {
    conditions.push(eq(cityTable.theme, filters.theme));
  }
  
  // Game mode filter (case-insensitive)
  if (filters.gameMode) {
    conditions.push(eq(cityTable.gameMode, filters.gameMode));
  }
  
  // Population range
  if (filters.minPopulation !== undefined) {
    conditions.push(gte(cityTable.population, filters.minPopulation));
  }
  if (filters.maxPopulation !== undefined) {
    conditions.push(lte(cityTable.population, filters.maxPopulation));
  }
  
  // Money range
  if (filters.minMoney !== undefined) {
    conditions.push(gte(cityTable.money, filters.minMoney));
  }
  if (filters.maxMoney !== undefined) {
    conditions.push(lte(cityTable.money, filters.maxMoney));
  }
  
  // Build and execute the count query
  if (conditions.length > 0) {
    const result = await db.select({ count: cityTable.id })
      .from(cityTable)
      .leftJoin(userTable, eq(cityTable.userId, userTable.id))
      .where(and(...conditions));
    return result.length;
  } else {
    const result = await db.select({ count: cityTable.id })
      .from(cityTable)
      .leftJoin(userTable, eq(cityTable.userId, userTable.id));
    return result.length;
  }
}

export async function getUniqueThemes() {
  await ensureCityTableExists();
  const result = await db.select({ theme: cityTable.theme })
    .from(cityTable)
    .groupBy(cityTable.theme)
    .orderBy(asc(cityTable.theme));
  return result.map(row => row.theme).filter(theme => theme);
}

export async function getUniqueGameModes() {
  await ensureCityTableExists();
  const result = await db.select({ gameMode: cityTable.gameMode })
    .from(cityTable)
    .groupBy(cityTable.gameMode)
    .orderBy(asc(cityTable.gameMode));
  return result.map(row => row.gameMode).filter(gameMode => gameMode);
}

async function ensureCityImagesTableExists() {
  if (tableInitCache.has('cityImages')) {
    return cityImagesTable;
  }

  const result = await client`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'cityImages'
    );`;

  if (!result[0].exists) {
    await client`
      CREATE TABLE "cityImages" (
        "id" SERIAL PRIMARY KEY,
        "cityId" INTEGER REFERENCES "City"("id") ON DELETE CASCADE,
        "fileName" VARCHAR(255),
        "originalName" VARCHAR(255),
        "fileSize" INTEGER,
        "mimeType" VARCHAR(100),
        "width" INTEGER,
        "height" INTEGER,
        "thumbnailPath" VARCHAR(255),
        "mediumPath" VARCHAR(255),
        "largePath" VARCHAR(255),
        "originalPath" VARCHAR(255),
        "isPrimary" BOOLEAN DEFAULT FALSE,
        "sortOrder" INTEGER DEFAULT 0,
        "uploadedAt" TIMESTAMP DEFAULT NOW()
      );`;
  } else {
    // Check if sortOrder column exists, if not add it
    const sortOrderColumnExists = await client`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'cityImages'
        AND column_name = 'sortOrder'
      );`;
    
    if (!sortOrderColumnExists[0].exists) {
      await client`
        ALTER TABLE "cityImages" ADD COLUMN "sortOrder" INTEGER DEFAULT 0;`;
    }
  }

  tableInitCache.add('cityImages');
  return cityImagesTable;
}

export async function createCityImage(imageData: {
  cityId: number;
  fileName: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  width: number;
  height: number;
  thumbnailPath: string;
  mediumPath: string;
  largePath: string;
  originalPath: string;
  isPrimary?: boolean;
}) {
  await ensureCityImagesTableExists();
  
  const imageId = await generateUniqueId(cityImagesTable, cityImagesTable.id);
  
  // Get the current max sortOrder for this city to set the new image at the end
  const maxSortOrderResult = await db.select({ maxSortOrder: sql<number>`COALESCE(MAX("sortOrder"), -1)` })
    .from(cityImagesTable)
    .where(eq(cityImagesTable.cityId, imageData.cityId));
  
  const newSortOrder = (maxSortOrderResult[0]?.maxSortOrder || -1) + 1;
  
  const result = await db.insert(cityImagesTable).values({
    id: imageId,
    cityId: imageData.cityId,
    fileName: imageData.fileName,
    originalName: imageData.originalName,
    fileSize: imageData.fileSize,
    mimeType: imageData.mimeType,
    width: imageData.width,
    height: imageData.height,
    thumbnailPath: imageData.thumbnailPath,
    mediumPath: imageData.mediumPath,
    largePath: imageData.largePath,
    originalPath: imageData.originalPath,
    isPrimary: imageData.isPrimary || false,
    sortOrder: newSortOrder,
  }).returning();
  
  return result[0];
}

export async function getCityImages(cityId: number) {
  await ensureCityImagesTableExists();
  
  // Initialize sortOrder for existing images if needed
  await initializeSortOrderForCity(cityId);
  
  const images = await db.select()
    .from(cityImagesTable)
    .where(eq(cityImagesTable.cityId, cityId))
    .orderBy(desc(cityImagesTable.isPrimary), asc(cityImagesTable.sortOrder));
  

  
  return images;
}

async function initializeSortOrderForCity(cityId: number) {
  // Check if any images don't have sortOrder set (only NULL values, 0 is valid)
  const imagesWithoutSortOrder = await db.select()
    .from(cityImagesTable)
    .where(and(
      eq(cityImagesTable.cityId, cityId),
      sql`"sortOrder" IS NULL`
    ));
  
  if (imagesWithoutSortOrder.length > 0) {
    // Get all images for this city ordered by uploadedAt (newest first, then assign ascending sortOrder)
    const allImages = await db.select()
      .from(cityImagesTable)
      .where(eq(cityImagesTable.cityId, cityId))
      .orderBy(desc(cityImagesTable.isPrimary), desc(cityImagesTable.uploadedAt));
    
    // Update sortOrder for each image
    for (let i = 0; i < allImages.length; i++) {
      await db.update(cityImagesTable)
        .set({ sortOrder: i })
        .where(eq(cityImagesTable.id, allImages[i].id));
    }
  }
}

export async function deleteCityImage(imageId: number, userId: number) {
  await ensureCityImagesTableExists();
  
  // First verify the user owns the city that this image belongs to
  const imageWithCity = await db.select({
    imageId: cityImagesTable.id,
    cityId: cityImagesTable.cityId,
    userId: cityTable.userId,
    thumbnailPath: cityImagesTable.thumbnailPath,
    mediumPath: cityImagesTable.mediumPath,
    largePath: cityImagesTable.largePath,
    originalPath: cityImagesTable.originalPath,
  })
    .from(cityImagesTable)
    .innerJoin(cityTable, eq(cityImagesTable.cityId, cityTable.id))
    .where(and(eq(cityImagesTable.id, imageId), eq(cityTable.userId, userId)));
  
  if (imageWithCity.length === 0) {
    return null; // Image not found or user doesn't own it
  }
  
  // Delete the image record
  const result = await db.delete(cityImagesTable)
    .where(eq(cityImagesTable.id, imageId))
    .returning();
  
  return { deletedImage: result[0], imagePaths: imageWithCity[0] };
}

export async function setPrimaryImage(imageId: number, cityId: number, userId: number) {
  await ensureCityImagesTableExists();
  await ensureHallOfFameCacheTableExists();
  
  // First, verify the user owns the city
  const cityOwner = await db.select({ userId: cityTable.userId, cityName: cityTable.cityName })
    .from(cityTable)
    .where(eq(cityTable.id, cityId))
    .limit(1);
  
  if (!cityOwner[0] || cityOwner[0].userId !== userId) {
    throw new Error('Unauthorized');
  }
  
  // Verify the image belongs to this city
  const imageOwner = await db.select({ cityId: cityImagesTable.cityId })
    .from(cityImagesTable)
    .where(eq(cityImagesTable.id, imageId))
    .limit(1);
  
  if (!imageOwner[0] || imageOwner[0].cityId !== cityId) {
    throw new Error('Image not found or does not belong to this city');
  }
  
  // Remove primary status from ALL images (both screenshots and Hall of Fame) for this city
  await db.update(cityImagesTable)
    .set({ isPrimary: false })
    .where(eq(cityImagesTable.cityId, cityId));
  
  if (cityOwner[0].cityName) {
    await db.update(hallOfFameCacheTable)
      .set({ isPrimary: false })
      .where(eq(hallOfFameCacheTable.cityName, cityOwner[0].cityName));
  }
  
  // Set this screenshot as primary
  await db.update(cityImagesTable)
    .set({ isPrimary: true })
    .where(eq(cityImagesTable.id, imageId));
  
  return { success: true };
}

export { ensureCityTableExists };

export { db };

// Community features table creation functions
async function ensureLikesTableExists() {
  if (tableInitCache.has('likes')) {
    return likesTable;
  }
  
  const result = await client`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'likes'
    );`;

  if (!result[0].exists) {
    await client`
      CREATE TABLE "likes" (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER,
        "cityId" INTEGER REFERENCES "City"(id) ON DELETE CASCADE,
        "createdAt" TIMESTAMP DEFAULT NOW()
      );`;
    
    // Create unique constraint to prevent duplicate likes
    await client`
      CREATE UNIQUE INDEX likes_user_city_unique ON "likes"("userId", "cityId");`;
  }
  
  tableInitCache.add('likes');
  return likesTable;
}

async function ensureCommentsTableExists() {
  if (tableInitCache.has('comments')) {
    return commentsTable;
  }
  
  const result = await client`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'comments'
    );`;

  if (!result[0].exists) {
    await client`
      CREATE TABLE "comments" (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER,
        "cityId" INTEGER REFERENCES "City"(id) ON DELETE CASCADE,
        content TEXT,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );`;
  }
  
  tableInitCache.add('comments');
  return commentsTable;
}

async function ensureFavoritesTableExists() {
  if (tableInitCache.has('favorites')) {
    return favoritesTable;
  }
  
  const result = await client`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'favorites'
    );`;

  if (!result[0].exists) {
    await client`
      CREATE TABLE "favorites" (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER,
        "cityId" INTEGER REFERENCES "City"(id) ON DELETE CASCADE,
        "createdAt" TIMESTAMP DEFAULT NOW()
      );`;
    
    // Create unique constraint to prevent duplicate favorites
    await client`
      CREATE UNIQUE INDEX favorites_user_city_unique ON "favorites"("userId", "cityId");`;
  }
  
  tableInitCache.add('favorites');
  return favoritesTable;
}

async function ensureCommentLikesTableExists() {
  if (tableInitCache.has('commentLikes')) {
    return commentLikesTable;
  }
  
  const result = await client`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'commentLikes'
    );`;

  if (!result[0].exists) {
    await client`
      CREATE TABLE "commentLikes" (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER,
        "commentId" INTEGER REFERENCES "comments"(id) ON DELETE CASCADE,
        "createdAt" TIMESTAMP DEFAULT NOW()
      );`;
    
    // Create unique constraint to prevent duplicate likes
    await client`
      CREATE UNIQUE INDEX commentLikes_user_comment_unique ON "commentLikes"("userId", "commentId");`;
  }
  
  tableInitCache.add('commentLikes');
  return commentLikesTable;
}

// Community features functions
export async function toggleLike(userId: number, cityId: number) {
  await ensureLikesTableExists();
  
  // Check if like already exists
  const existingLike = await db.select()
    .from(likesTable)
    .where(and(eq(likesTable.userId, userId), eq(likesTable.cityId, cityId)))
    .limit(1);
  
  if (existingLike.length > 0) {
    // Unlike
    await db.delete(likesTable)
      .where(and(eq(likesTable.userId, userId), eq(likesTable.cityId, cityId)));
    return { liked: false };
  } else {
    // Like
    const likeId = await generateUniqueId(likesTable, likesTable.id);
    await db.insert(likesTable).values({ id: likeId, userId, cityId });
    return { liked: true };
  }
}

export async function getCityLikes(cityId: number) {
  await ensureLikesTableExists();
  
  const likes = await db.select({ count: sql<number>`count(*)` })
    .from(likesTable)
    .where(eq(likesTable.cityId, cityId));
  
  return likes[0]?.count || 0;
}

export async function isLikedByUser(userId: number, cityId: number) {
  await ensureLikesTableExists();
  
  const like = await db.select()
    .from(likesTable)
    .where(and(eq(likesTable.userId, userId), eq(likesTable.cityId, cityId)))
    .limit(1);
  
  return like.length > 0;
}

export async function addComment(userId: number, cityId: number, content: string) {
  await ensureCommentsTableExists();
  
  const commentId = await generateUniqueId(commentsTable, commentsTable.id);
  
  const comment = await db.insert(commentsTable)
    .values({ id: commentId, userId, cityId, content })
    .returning();
  
  return comment[0];
}

export async function getCityComments(cityId: number, requestUserId?: number, sortBy: 'recent' | 'likes' = 'likes') {
  await ensureCommentsTableExists();
  await ensureCommentLikesTableExists();
  await ensureTableExists();
  
  const userTable = await ensureTableExists();
  
  const comments = await db.select({
    id: commentsTable.id,
    content: commentsTable.content,
    createdAt: commentsTable.createdAt,
    updatedAt: commentsTable.updatedAt,
    userId: commentsTable.userId,
    username: userTable.username,
    userEmail: userTable.email,
    likesCount: sql<number>`COALESCE(COUNT(${commentLikesTable.id}), 0)`.as('likesCount'),
  })
    .from(commentsTable)
    .leftJoin(userTable, eq(commentsTable.userId, userTable.id))
    .leftJoin(commentLikesTable, eq(commentLikesTable.commentId, commentsTable.id))
    .where(eq(commentsTable.cityId, cityId))
    .groupBy(commentsTable.id, userTable.id)
    .orderBy(
      sortBy === 'likes' 
        ? desc(sql<number>`COALESCE(COUNT(${commentLikesTable.id}), 0)`)
        : desc(commentsTable.createdAt)
    );
  
  // If user is provided, check which comments they've liked
  if (requestUserId) {
    const userLikes = await db.select({
      commentId: commentLikesTable.commentId,
    })
      .from(commentLikesTable)
      .where(eq(commentLikesTable.userId, requestUserId));
    
    const likedCommentIds = new Set(userLikes.map(like => like.commentId));
    
    return comments.map(comment => ({
      ...comment,
      isLikedByUser: likedCommentIds.has(comment.id),
    }));
  }
  
  return comments.map(comment => ({
    ...comment,
    isLikedByUser: false,
  }));
}

export async function getAllComments() {
  await ensureCommentsTableExists();
  await ensureTableExists();
  await ensureCityTableExists();
  
  const userTable = await ensureTableExists();
  
  const comments = await db.select({
    id: commentsTable.id,
    content: commentsTable.content,
    createdAt: commentsTable.createdAt,
    updatedAt: commentsTable.updatedAt,
    userId: commentsTable.userId,
    username: userTable.username,
    userEmail: userTable.email,
    cityId: commentsTable.cityId,
    cityName: cityTable.cityName,
  })
    .from(commentsTable)
    .leftJoin(userTable, eq(commentsTable.userId, userTable.id))
    .leftJoin(cityTable, eq(commentsTable.cityId, cityTable.id))
    .orderBy(desc(commentsTable.createdAt));
  
  return comments;
}

export async function deleteComment(commentId: number, userId: number) {
  await ensureCommentsTableExists();
  
  // Only allow users to delete their own comments
  const result = await db.delete(commentsTable)
    .where(and(eq(commentsTable.id, commentId), eq(commentsTable.userId, userId)))
    .returning();
  
  return result[0] || null;
}

export async function deleteCommentAsAdmin(commentId: number) {
  await ensureCommentsTableExists();
  
  // Allow admins to delete any comment
  const result = await db.delete(commentsTable)
    .where(eq(commentsTable.id, commentId))
    .returning();
  
  return result[0] || null;
}

// Comment like functions
export async function toggleCommentLike(userId: number, commentId: number) {
  await ensureCommentLikesTableExists();
  
  // Check if like already exists
  const existingLike = await db.select()
    .from(commentLikesTable)
    .where(and(eq(commentLikesTable.userId, userId), eq(commentLikesTable.commentId, commentId)))
    .limit(1);
  
  if (existingLike.length > 0) {
    // Unlike
    await db.delete(commentLikesTable)
      .where(and(eq(commentLikesTable.userId, userId), eq(commentLikesTable.commentId, commentId)));
    return { liked: false };
  } else {
    // Like
    const likeId = await generateUniqueId(commentLikesTable, commentLikesTable.id);
    await db.insert(commentLikesTable).values({ id: likeId, userId, commentId });
    return { liked: true };
  }
}

export async function getCommentLikes(commentId: number) {
  await ensureCommentLikesTableExists();
  
  const likes = await db.select({ count: sql<number>`count(*)` })
    .from(commentLikesTable)
    .where(eq(commentLikesTable.commentId, commentId));
  
  return likes[0]?.count || 0;
}

export async function isCommentLikedByUser(userId: number, commentId: number) {
  await ensureCommentLikesTableExists();
  
  const like = await db.select()
    .from(commentLikesTable)
    .where(and(eq(commentLikesTable.userId, userId), eq(commentLikesTable.commentId, commentId)))
    .limit(1);
  
  return like.length > 0;
}

export async function getCityCommentCount(cityId: number) {
  await ensureCommentsTableExists();
  
  const result = await db.select({ count: sql<number>`count(*)` })
    .from(commentsTable)
    .where(eq(commentsTable.cityId, cityId));
  
  return result[0]?.count || 0;
}

// Moderation settings functions
async function ensureModerationSettingsTableExists() {
  if (tableInitCache.has('moderationSettings')) {
    return moderationSettingsTable;
  }
  
  const result = await client`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'moderationSettings'
    );`;

  if (!result[0].exists) {
    await client`
      CREATE TABLE "moderationSettings" (
        id SERIAL PRIMARY KEY,
        "key" VARCHAR(100) UNIQUE NOT NULL,
        value JSONB,
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );`;
  }
  
  tableInitCache.add('moderationSettings');
  return moderationSettingsTable;
}

async function ensurePasswordResetTokensTableExists() {
  if (tableInitCache.has('passwordResetTokens')) {
    return passwordResetTokensTable;
  }
  
  const result = await client`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'passwordResetTokens'
    );`;

  if (!result[0].exists) {
    await client`
      CREATE TABLE "passwordResetTokens" (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL,
        token VARCHAR(255) UNIQUE NOT NULL,
        "expiresAt" TIMESTAMP NOT NULL,
        "createdAt" TIMESTAMP DEFAULT NOW()
      );`;
  }
  
  tableInitCache.add('passwordResetTokens');
  return passwordResetTokensTable;
}

export async function getModerationSetting(key: string) {
  await ensureModerationSettingsTableExists();
  
  const setting = await db.select()
    .from(moderationSettingsTable)
    .where(eq(moderationSettingsTable.key, key))
    .limit(1);
  
  return setting[0]?.value || null;
}

export async function setModerationSetting(key: string, value: any) {
  await ensureModerationSettingsTableExists();
  
  const result = await db.insert(moderationSettingsTable)
    .values({ key, value })
    .onConflictDoUpdate({
      target: moderationSettingsTable.key,
      set: { value, updatedAt: new Date() }
    })
    .returning();
  
  return result[0];
}

export async function getAllModerationSettings() {
  await ensureModerationSettingsTableExists();
  
  const settings = await db.select()
    .from(moderationSettingsTable)
    .orderBy(moderationSettingsTable.key);
  
  return settings;
}

export async function toggleFavorite(userId: number, cityId: number) {
  await ensureFavoritesTableExists();
  
  // Check if favorite already exists
  const existingFavorite = await db.select()
    .from(favoritesTable)
    .where(and(eq(favoritesTable.userId, userId), eq(favoritesTable.cityId, cityId)))
    .limit(1);
  
  if (existingFavorite.length > 0) {
    // Remove from favorites
    await db.delete(favoritesTable)
      .where(and(eq(favoritesTable.userId, userId), eq(favoritesTable.cityId, cityId)));
    return { favorited: false };
  } else {
    // Add to favorites
    const favoriteId = await generateUniqueId(favoritesTable, favoritesTable.id);
    await db.insert(favoritesTable).values({ id: favoriteId, userId, cityId });
    return { favorited: true };
  }
}

export async function isFavoritedByUser(userId: number, cityId: number) {
  await ensureFavoritesTableExists();
  
  const favorite = await db.select()
    .from(favoritesTable)
    .where(and(eq(favoritesTable.userId, userId), eq(favoritesTable.cityId, cityId)))
    .limit(1);
  
  return favorite.length > 0;
}

export async function getUserFavorites(userId: number, limit: number = 12, offset: number = 0) {
  await ensureFavoritesTableExists();
  await ensureCityTableExists();
  await ensureCityImagesTableExists();
  await ensureCommentsTableExists();
  
  const users = await ensureTableExists();

  const favorites = await db
    .select({
      id: cityTable.id,
      userId: cityTable.userId,
      cityName: cityTable.cityName,
      mapName: cityTable.mapName,
      population: cityTable.population,
      money: cityTable.money,
      xp: cityTable.xp,
      unlimitedMoney: cityTable.unlimitedMoney,
      theme: cityTable.theme,
      gameMode: cityTable.gameMode,
      uploadedAt: cityTable.uploadedAt,
      favoritedAt: favoritesTable.createdAt,
      modsEnabled: cityTable.modsEnabled,
      user: {
        id: users.id,
        username: users.username,
      },
      images: sql<Array<{ id: number; fileName: string; isPrimary: boolean; mediumPath: string; largePath: string; thumbnailPath: string }>>`
        (
          SELECT COALESCE(json_agg(json_build_object('id', i.id, 'fileName', i."fileName", 'isPrimary', i."isPrimary", 'mediumPath', i."mediumPath", 'largePath', i."largePath", 'thumbnailPath', i."thumbnailPath")), '[]'::json)
          FROM "cityImages" i
          WHERE i."cityId" = "City".id
        )
      `,
      commentCount: sql<number>`(SELECT COUNT(*) FROM "comments" WHERE "cityId" = "City".id)`.as('commentCount'),
    })
    .from(favoritesTable)
    .innerJoin(cityTable, eq(favoritesTable.cityId, cityTable.id))
    .leftJoin(users, eq(cityTable.userId, users.id))
    .where(eq(favoritesTable.userId, userId))
    .orderBy(desc(favoritesTable.createdAt))
    .limit(limit)
    .offset(offset);

  return favorites;
}

// Password reset functions
export async function createPasswordResetToken(userId: number) {
  await ensurePasswordResetTokensTableExists();
  
  // Generate a secure random token
  const token = require('crypto').randomBytes(32).toString('hex');
  
  // Set expiration to 1 hour from now
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  
  // Delete any existing tokens for this user
  await db.delete(passwordResetTokensTable)
    .where(eq(passwordResetTokensTable.userId, userId));
  
  // Create new token
  const tokenId = await generateUniqueId(passwordResetTokensTable, passwordResetTokensTable.id);
  const result = await db.insert(passwordResetTokensTable)
    .values({ id: tokenId, userId, token, expiresAt })
    .returning();
  
  return result[0];
}

export async function getPasswordResetToken(token: string) {
  await ensurePasswordResetTokensTableExists();
  
  const result = await db.select()
    .from(passwordResetTokensTable)
    .where(eq(passwordResetTokensTable.token, token))
    .limit(1);
  
  if (result.length === 0) {
    return null;
  }
  
  const resetToken = result[0];
  
  // Check if token is expired
  if (new Date() > resetToken.expiresAt) {
    // Delete expired token
    await db.delete(passwordResetTokensTable)
      .where(eq(passwordResetTokensTable.id, resetToken.id));
    return null;
  }
  
  return resetToken;
}

export async function deletePasswordResetToken(token: string) {
  await ensurePasswordResetTokensTableExists();
  
  await db.delete(passwordResetTokensTable)
    .where(eq(passwordResetTokensTable.token, token));
}

export async function updateUserPassword(userId: number, newPassword: string) {
  const users = await ensureTableExists();
  
  // Hash the new password
  const salt = genSaltSync(10);
  const hash = hashSync(newPassword, salt);
  
  // Update user's password
  const result = await db.update(users)
    .set({ password: hash })
    .where(eq(users.id, userId))
    .returning();
  
  return result[0];
}

  // API Key Management Functions
  async function ensureApiKeysTableExists() {
    if (tableInitCache.has('apiKeys')) {
      return apiKeysTable;
    }

    const result = await client`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'apiKeys'
      );`;

    if (!result[0].exists) {
      await client`
        CREATE TABLE "apiKeys" (
          "id" serial PRIMARY KEY,
          "userId" integer NOT NULL,
          "name" varchar(255) NOT NULL,
          "key" varchar(255) UNIQUE NOT NULL,
          "isActive" boolean DEFAULT true,
          "lastUsed" timestamp,
          "createdAt" timestamp DEFAULT now()
        );`;
    }

    tableInitCache.add('apiKeys');
    return apiKeysTable;
  }

export async function createApiKey(userId: number, name: string) {
  const apiKeys = await ensureApiKeysTableExists();
  
  // Generate a secure API key
  const crypto = await import('crypto');
  const key = `cc_${crypto.randomBytes(32).toString('hex')}`;
  
  return await db.insert(apiKeys).values({
    userId,
    name,
    key,
    isActive: true
  }).returning();
}

export async function getUserApiKeys(userId: number) {
  const apiKeys = await ensureApiKeysTableExists();
  
  return await db.select({
    id: apiKeys.id,
    name: apiKeys.name,
    key: apiKeys.key,
    isActive: apiKeys.isActive,
    lastUsed: apiKeys.lastUsed,
    createdAt: apiKeys.createdAt
  }).from(apiKeys).where(eq(apiKeys.userId, userId));
}

export async function getApiKeyByKey(key: string) {
  const apiKeys = await ensureApiKeysTableExists();
  
  return await db.select().from(apiKeys).where(eq(apiKeys.key, key)).limit(1);
}

export async function updateApiKeyLastUsed(key: string) {
  const apiKeys = await ensureApiKeysTableExists();
  
  return await db.update(apiKeys)
    .set({ lastUsed: new Date() })
    .where(eq(apiKeys.key, key));
}

export async function toggleApiKeyStatus(keyId: number, userId: number) {
  const apiKeys = await ensureApiKeysTableExists();
  
  // First get current status
  const currentKey = await db.select().from(apiKeys).where(eq(apiKeys.id, keyId)).limit(1);
  
  if (currentKey.length === 0) {
    throw new Error('API key not found');
  }
  
  const newStatus = !currentKey[0].isActive;
  
  // If userId is 0, it's an admin operation (no ownership check)
  if (userId === 0) {
    return await db.update(apiKeys)
      .set({ isActive: newStatus })
      .where(eq(apiKeys.id, keyId));
  }
  
  return await db.update(apiKeys)
    .set({ isActive: newStatus })
    .where(and(eq(apiKeys.id, keyId), eq(apiKeys.userId, userId)));
}

export async function deleteApiKey(keyId: number, userId: number) {
  const apiKeys = await ensureApiKeysTableExists();
  
  // If userId is 0, it's an admin operation (no ownership check)
  if (userId === 0) {
    return await db.delete(apiKeys)
      .where(eq(apiKeys.id, keyId));
  }
  
  return await db.delete(apiKeys)
    .where(and(eq(apiKeys.id, keyId), eq(apiKeys.userId, userId)));
}

// Follow System Functions
async function ensureFollowsTableExists() {
  if (tableInitCache.has('follows')) {
    return followsTable;
  }

  const result = await client`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'follows'
    );`;

  if (!result[0].exists) {
    await client`
      CREATE TABLE "follows" (
        "id" serial PRIMARY KEY,
        "followerId" integer NOT NULL,
        "followingId" integer NOT NULL,
        "createdAt" timestamp DEFAULT now(),
        UNIQUE("followerId", "followingId")
      );`;
  }

  tableInitCache.add('follows');
  return followsTable;
}

async function ensureNotificationsTableExists() {
  if (tableInitCache.has('notifications')) {
    return notificationsTable;
  }

  const result = await client`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'notifications'
    );`;

  if (!result[0].exists) {
    await client`
      CREATE TABLE "notifications" (
        "id" serial PRIMARY KEY,
        "userId" integer NOT NULL,
        "type" varchar(50) NOT NULL,
        "title" varchar(255) NOT NULL,
        "message" text NOT NULL,
        "relatedUserId" integer,
        "relatedCityId" integer,
        "relatedCommentId" integer,
        "metadata" text,
        "isRead" boolean DEFAULT false,
        "createdAt" timestamp DEFAULT now()
      );`;
  } else {
    // Check if metadata column exists, add it if it doesn't
    const columnExists = await client`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'notifications' 
        AND column_name = 'metadata'
      );`;
    
    if (!columnExists[0].exists) {
      await client`ALTER TABLE "notifications" ADD COLUMN "metadata" text;`;
    }
  }

  tableInitCache.add('notifications');
  return notificationsTable;
}

// OSM Map Cache Table functions removed - now using client-side caching with IndexedDB

export async function toggleFollow(followerId: number, followingId: number) {
  const follows = await ensureFollowsTableExists();
  
  // Check if already following
  const existingFollow = await db.select()
    .from(follows)
    .where(and(
      eq(follows.followerId, followerId),
      eq(follows.followingId, followingId)
    ))
    .limit(1);
  
  if (existingFollow.length > 0) {
    // Unfollow
    await db.delete(follows)
      .where(and(
        eq(follows.followerId, followerId),
        eq(follows.followingId, followingId)
      ));
    return { isFollowing: false };
  } else {
    // Follow
    await db.insert(follows).values({
      followerId,
      followingId
    });
    
    // Notify the person being followed
    await notifyNewFollower(followerId, followingId);
    
    return { isFollowing: true };
  }
}

export async function isFollowing(followerId: number, followingId: number) {
  const follows = await ensureFollowsTableExists();
  
  const result = await db.select()
    .from(follows)
    .where(and(
      eq(follows.followerId, followerId),
      eq(follows.followingId, followingId)
    ))
    .limit(1);
  
  return result.length > 0;
}

export async function getFollowers(userId: number) {
  const follows = await ensureFollowsTableExists();
  const users = await ensureTableExists();
  
  return await db.select({
    id: users.id,
    username: users.username,
    name: users.name,
    avatar: users.avatar,
    followedAt: follows.createdAt
  })
    .from(follows)
    .innerJoin(users, eq(follows.followerId, users.id))
    .where(eq(follows.followingId, userId))
    .orderBy(desc(follows.createdAt));
}

export async function getFollowing(userId: number) {
  const follows = await ensureFollowsTableExists();
  const users = await ensureTableExists();
  
  return await db.select({
    id: users.id,
    username: users.username,
    name: users.name,
    avatar: users.avatar,
    followedAt: follows.createdAt
  })
    .from(follows)
    .innerJoin(users, eq(follows.followingId, users.id))
    .where(eq(follows.followerId, userId))
    .orderBy(desc(follows.createdAt));
}

export async function getFollowerCount(userId: number) {
  const follows = await ensureFollowsTableExists();
  
  const result = await db.select({ count: sql<number>`COUNT(*)` })
    .from(follows)
    .where(eq(follows.followingId, userId));
  
  return result[0].count;
}

export async function getFollowingCount(userId: number) {
  const follows = await ensureFollowsTableExists();
  
  const result = await db.select({ count: sql<number>`COUNT(*)` })
    .from(follows)
    .where(eq(follows.followerId, userId));
  
  return result[0].count;
}

// Notification System Functions
export async function createNotification(data: {
  userId: number;
  type: string;
  title: string;
  message: string;
  relatedUserId?: number;
  relatedCityId?: number;
  relatedCommentId?: number;
  metadata?: string;
}) {
  const notifications = await ensureNotificationsTableExists();
  
  return await db.insert(notifications).values(data).returning();
}

export async function getUserNotifications(userId: number, limit: number = 20, offset: number = 0) {
  const notifications = await ensureNotificationsTableExists();
  const users = await ensureTableExists();
  const cities = await ensureCityTableExists();
  
  return await db.select({
    id: notifications.id,
    type: notifications.type,
    title: notifications.title,
    message: notifications.message,
    isRead: notifications.isRead,
    createdAt: notifications.createdAt,
    relatedUserId: notifications.relatedUserId,
    relatedCityId: notifications.relatedCityId,
    relatedCommentId: notifications.relatedCommentId,
    metadata: notifications.metadata,
    relatedUser: {
      id: users.id,
      username: users.username,
      name: users.name,
      avatar: users.avatar
    },
    relatedCity: {
      id: cities.id,
      cityName: cities.cityName,
      mapName: cities.mapName
    }
  })
    .from(notifications)
    .leftJoin(users, eq(notifications.relatedUserId, users.id))
    .leftJoin(cities, eq(notifications.relatedCityId, cities.id))
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getUnreadNotificationCount(userId: number) {
  const notifications = await ensureNotificationsTableExists();
  
  const result = await db.select({ count: sql<number>`COUNT(*)` })
    .from(notifications)
    .where(and(
      eq(notifications.userId, userId),
      eq(notifications.isRead, false)
    ));
  
  return result[0].count;
}

export async function markNotificationAsRead(notificationId: number, userId: number) {
  const notifications = await ensureNotificationsTableExists();
  
  return await db.update(notifications)
    .set({ isRead: true })
    .where(and(
      eq(notifications.id, notificationId),
      eq(notifications.userId, userId)
    ));
}

export async function markAllNotificationsAsRead(userId: number) {
  const notifications = await ensureNotificationsTableExists();
  
  return await db.update(notifications)
    .set({ isRead: true })
    .where(eq(notifications.userId, userId));
}

export async function deleteNotification(notificationId: number, userId: number) {
  const notifications = await ensureNotificationsTableExists();
  
  return await db.delete(notifications)
    .where(and(
      eq(notifications.id, notificationId),
      eq(notifications.userId, userId)
    ));
}

// Function to notify when someone follows you
export async function notifyNewFollower(followerId: number, followingId: number) {
  const users = await ensureTableExists();
  
  // Get follower info for the notification
  const followerInfo = await db.select({ username: users.username, name: users.name })
    .from(users)
    .where(eq(users.id, followerId))
    .limit(1);
  
  if (followerInfo.length === 0) return;
  
  const follower = followerInfo[0];
  const displayName = follower.username || follower.name || 'Unknown User';
  
  // Create notification for the person being followed
  await createNotification({
    userId: followingId,
    type: 'new_follower',
    title: 'New Follower',
    message: `${displayName} started following you`,
    relatedUserId: followerId
  });
}

// Function to notify followers when a user uploads a new city
export async function notifyFollowersOfNewCity(userId: number, cityId: number, cityName: string) {
  const follows = await ensureFollowsTableExists();
  const users = await ensureTableExists();
  
  // Get all followers of the user
  const followers = await db.select({ followerId: follows.followerId })
    .from(follows)
    .where(eq(follows.followingId, userId));
  
  // Get user info for the notification
  const userInfo = await db.select({ username: users.username, name: users.name })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  
  if (userInfo.length === 0) return;
  
  const user = userInfo[0];
  const displayName = user.username || user.name || 'Unknown User';
  
  // Create notifications for all followers
  const notificationPromises = followers.map(follower => 
    createNotification({
      userId: follower.followerId,
      type: 'new_city',
      title: 'New City Uploaded',
      message: `${displayName} uploaded a new city: ${cityName}`,
      relatedUserId: userId,
      relatedCityId: cityId
    })
  );
  
  await Promise.all(notificationPromises);
}

// Function to notify when someone comments on your city
export async function notifyNewComment(commenterId: number, cityId: number, commentId: number, commentContent: string) {
  const users = await ensureTableExists();
  const cities = await ensureCityTableExists();
  
  // Get city info and owner
  const cityInfo = await db.select({ 
    cityName: cities.cityName,
    userId: cities.userId 
  })
    .from(cities)
    .where(eq(cities.id, cityId))
    .limit(1);
  
  if (cityInfo.length === 0) return;
  
  const city = cityInfo[0];
  const cityOwnerId = city.userId;
  
  // Don't notify if the city owner is commenting on their own city
  if (cityOwnerId === commenterId) return;
  
  // Get commenter info for the notification
  const commenterInfo = await db.select({ username: users.username, name: users.name })
    .from(users)
    .where(eq(users.id, commenterId))
    .limit(1);
  
  if (commenterInfo.length === 0) return;
  
  const commenter = commenterInfo[0];
  const commenterDisplayName = commenter.username || commenter.name || 'Unknown User';
  
  // Truncate comment content for notification (max 50 characters)
  const truncatedComment = commentContent.length > 50 
    ? commentContent.substring(0, 50) + '...' 
    : commentContent;
  
  // Create notification for the city owner
  await createNotification({
    userId: cityOwnerId!,
    type: 'new_comment',
    title: 'New Comment',
    message: `${commenterDisplayName} commented on your city "${city.cityName}": "${truncatedComment}"`,
    relatedUserId: commenterId,
    relatedCityId: cityId,
    relatedCommentId: commentId
  });
}

// Social Links Functions
async function ensureUserSocialLinksTableExists() {
  const cacheKey = 'userSocialLinks';
  
  if (tableInitCache.has(cacheKey)) {
    return userSocialLinksTable;
  }
  
  const result = await client`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'userSocialLinks'
    );`;

  if (!result[0].exists) {
    await client`
      CREATE TABLE "userSocialLinks" (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL,
        platform VARCHAR(50) NOT NULL,
        url VARCHAR(500) NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE("userId", platform)
      );`;
  }
  
  tableInitCache.add(cacheKey);
  return userSocialLinksTable;
}

export async function getUserSocialLinks(userId: number) {
  await ensureUserSocialLinksTableExists();
  
  const links = await db.select({
    id: userSocialLinksTable.id,
    platform: userSocialLinksTable.platform,
    url: userSocialLinksTable.url,
  })
    .from(userSocialLinksTable)
    .where(eq(userSocialLinksTable.userId, userId))
    .orderBy(userSocialLinksTable.platform);
  
  return links;
}

export async function upsertUserSocialLink(userId: number, platform: string, url: string) {
  await ensureUserSocialLinksTableExists();
  
  // Check if link already exists
  const existing = await db.select()
    .from(userSocialLinksTable)
    .where(and(
      eq(userSocialLinksTable.userId, userId),
      eq(userSocialLinksTable.platform, platform)
    ))
    .limit(1);
  
  if (existing.length > 0) {
    // Update existing link
    const result = await db.update(userSocialLinksTable)
      .set({ url, updatedAt: new Date() })
      .where(and(
        eq(userSocialLinksTable.userId, userId),
        eq(userSocialLinksTable.platform, platform)
      ))
      .returning();
    return result[0];
  } else {
    // Insert new link
    const result = await db.insert(userSocialLinksTable)
      .values({ userId, platform, url })
      .returning();
    return result[0];
  }
}

export async function deleteUserSocialLink(userId: number, platform: string) {
  await ensureUserSocialLinksTableExists();
  
  const result = await db.delete(userSocialLinksTable)
    .where(and(
      eq(userSocialLinksTable.userId, userId),
      eq(userSocialLinksTable.platform, platform)
    ))
    .returning();
  
  return result[0] || null;
}

// Mod compatibility functions
async function ensureModCompatibilityTableExists() {
  if (tableInitCache.has('modCompatibility')) {
    return modCompatibilityTable;
  }
  
  try {
    const result = await client`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'modCompatibility'
      );`;

    if (!result[0].exists) {
      await client`
        CREATE TABLE "modCompatibility" (
          id SERIAL PRIMARY KEY,
          "modId" VARCHAR(50) UNIQUE NOT NULL,
          name VARCHAR(255) NOT NULL,
          notes JSONB,
          "lastUpdated" TIMESTAMP DEFAULT NOW(),
          "createdAt" TIMESTAMP DEFAULT NOW()
        );`;
    }
  } catch (error: any) {
    // If table already exists, that's fine - just continue
    if (error.code !== '42P07') { // 42P07 is "relation already exists"
      throw error;
    }
  }
  
  tableInitCache.add('modCompatibility');
  return modCompatibilityTable;
}

export async function upsertModCompatibility(modId: string, name: string, notes?: string[]) {
  await ensureModCompatibilityTableExists();
  
  const result = await db.insert(modCompatibilityTable)
    .values({
      modId,
      name,
      notes: notes || [],
      lastUpdated: new Date(),
    })
    .onConflictDoUpdate({
      target: modCompatibilityTable.modId,
      set: {
        name: name,
        notes: notes || [],
        lastUpdated: new Date(),
      },
    })
    .returning();
  
  return result[0];
}

export async function getModCompatibility(modId: string) {
  await ensureModCompatibilityTableExists();
  
  const result = await db.select()
    .from(modCompatibilityTable)
    .where(eq(modCompatibilityTable.modId, modId))
    .limit(1);
  
  return result[0] || null;
}

export async function getAllModCompatibility() {
  await ensureModCompatibilityTableExists();
  
  return await db.select()
    .from(modCompatibilityTable)
    .orderBy(modCompatibilityTable.lastUpdated);
}

export async function updateModCompatibilityNotes(modId: string, notes: string[]) {
  await ensureModCompatibilityTableExists();
  
  const result = await db.update(modCompatibilityTable)
    .set({
      notes: notes,
      lastUpdated: new Date(),
    })
    .where(eq(modCompatibilityTable.modId, modId))
    .returning();
  
  return result[0];
}

// Function to update all cities that use a specific mod with new compatibility notes
export async function updateCitiesWithModNotes(modId: string, newNotes: string[]) {
  try {
    await ensureModCompatibilityTableExists();
    
    // Update the mod compatibility cache
    await upsertModCompatibility(modId, 'Unknown Mod', newNotes);
    
    // Find all cities that use this mod and update their modsNotes
    const cities = await db.select().from(cityTable).where(
      sql`${cityTable.modsEnabled}::text LIKE ${`%${modId}%`}`
    );
    
    for (const city of cities) {
      if (city.modsNotes) {
        try {
          const existingNotes = JSON.parse(city.modsNotes);
          existingNotes[modId] = newNotes;
          await db.update(cityTable)
            .set({ modsNotes: JSON.stringify(existingNotes) })
            .where(eq(cityTable.id, city.id));
        } catch (error) {
          console.error(`Error updating mod notes for city ${city.id}:`, error);
        }
      }
    }
  } catch (error) {
    console.error('Error updating cities with mod notes:', error);
  }
}

// Hall of Fame cache functions
async function ensureHallOfFameCacheTableExists() {
  if (tableInitCache.has('hallOfFameCache')) {
    return;
  }

  try {
    // First, check if the table exists
    const tableExists = await client`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'hallOfFameCache'
      )
    `;

    if (!tableExists[0].exists) {
      // Create new table with full schema
      await client`
        CREATE TABLE "hallOfFameCache" (
          "id" serial PRIMARY KEY,
          "userId" integer REFERENCES "User"("id") ON DELETE CASCADE,
          "cityId" integer REFERENCES "City"("id") ON DELETE CASCADE,
          "hofImageId" varchar(255) NOT NULL,
          "cityName" varchar(255) NOT NULL,
          "cityPopulation" integer,
          "cityMilestone" integer,
          "imageUrlThumbnail" varchar(500) NOT NULL,
          "imageUrlFHD" varchar(500) NOT NULL,
          "imageUrl4K" varchar(500) NOT NULL,
          "isPrimary" BOOLEAN DEFAULT FALSE,
          "createdAt" timestamp DEFAULT now(),
          "lastUpdated" timestamp DEFAULT now()
        )
      `;
    } else {
      // Table exists, check if userId column exists
      const columnExists = await client`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'hallOfFameCache' 
          AND column_name = 'userId'
        )
      `;

      if (!columnExists[0].exists) {
        // Add the missing userId column
        await client`
          ALTER TABLE "hallOfFameCache" 
          ADD COLUMN "userId" integer REFERENCES "User"("id") ON DELETE CASCADE
        `;
        console.log('Added userId column to hallOfFameCache table');
      }

      // Check if isPrimary column exists, add it if it doesn't
      const isPrimaryColumnExists = await client`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'hallOfFameCache' 
          AND column_name = 'isPrimary'
        )
      `;

      if (!isPrimaryColumnExists[0].exists) {
        // Add the missing isPrimary column
        await client`
          ALTER TABLE "hallOfFameCache" 
          ADD COLUMN "isPrimary" BOOLEAN DEFAULT FALSE
        `;
        console.log('Added isPrimary column to hallOfFameCache table');
      }
    }
    
    tableInitCache.add('hallOfFameCache');
  } catch (error) {
    console.error('Error ensuring hallOfFameCache table exists:', error);
  }
}

export async function getHallOfFameImagesForCity(cityId: number) {
  try {
    await ensureHallOfFameCacheTableExists();
    
    // First get the city name
    const city = await db.select().from(cityTable).where(eq(cityTable.id, cityId)).limit(1);
    
    if (city.length === 0) {
      return [];
    }
    
    const cityName = city[0].cityName;
    
    // Then find Hall of Fame images that match the city name
    const images = await client`
      SELECT * FROM "hallOfFameCache" 
      WHERE LOWER("cityName") = LOWER(${cityName})
      ORDER BY "createdAt" DESC
    `;
    
    return images;
  } catch (error) {
    console.error('Error fetching Hall of Fame images for city:', error);
    return [];
  }
}

export async function upsertHallOfFameImage(cityId: number, imageData: {
  hofImageId: string;
  cityName: string;
  cityPopulation?: number;
  cityMilestone?: number;
  imageUrlThumbnail: string;
  imageUrlFHD: string;
  imageUrl4K: string;
}) {
  try {
    await ensureHallOfFameCacheTableExists();
    
    // Check if image already exists
    const existing = await db.select().from(hallOfFameCacheTable)
      .where(and(
        eq(hallOfFameCacheTable.cityId, cityId),
        eq(hallOfFameCacheTable.hofImageId, imageData.hofImageId)
      ))
      .limit(1);
    
    if (existing.length > 0) {
      // Update existing image
      await db.update(hallOfFameCacheTable)
        .set({
          cityName: imageData.cityName,
          cityPopulation: imageData.cityPopulation,
          cityMilestone: imageData.cityMilestone,
          imageUrlThumbnail: imageData.imageUrlThumbnail,
          imageUrlFHD: imageData.imageUrlFHD,
          imageUrl4K: imageData.imageUrl4K,
          lastUpdated: new Date()
        })
        .where(eq(hallOfFameCacheTable.id, existing[0].id));
    } else {
      // Insert new image
      await db.insert(hallOfFameCacheTable).values({
        cityId,
        hofImageId: imageData.hofImageId,
        cityName: imageData.cityName,
        cityPopulation: imageData.cityPopulation,
        cityMilestone: imageData.cityMilestone,
        imageUrlThumbnail: imageData.imageUrlThumbnail,
        imageUrlFHD: imageData.imageUrlFHD,
        imageUrl4K: imageData.imageUrl4K
      });
    }
  } catch (error) {
    console.error('Error upserting Hall of Fame image:', error);
  }
}

export async function removeHallOfFameImage(cityId: number, hofImageId: string) {
  try {
    await ensureHallOfFameCacheTableExists();
    
    await db.delete(hallOfFameCacheTable)
      .where(and(
        eq(hallOfFameCacheTable.cityId, cityId),
        eq(hallOfFameCacheTable.hofImageId, hofImageId)
      ));
  } catch (error) {
    console.error('Error removing Hall of Fame image:', error);
  }
}

export async function setPrimaryHallOfFameImage(hofImageId: string, cityId: number, userId: number) {
  try {
    await ensureHallOfFameCacheTableExists();
    
    // First, verify the user owns the city
    const cityOwner = await db.select({ userId: cityTable.userId, cityName: cityTable.cityName })
      .from(cityTable)
      .where(eq(cityTable.id, cityId))
      .limit(1);
    
    if (!cityOwner[0] || cityOwner[0].userId !== userId) {
      throw new Error('Unauthorized');
    }
    
    const cityName = cityOwner[0].cityName;
    
    // Verify the image belongs to this city by matching city name
    const imageOwner = await db.select({ cityName: hallOfFameCacheTable.cityName })
      .from(hallOfFameCacheTable)
      .where(eq(hallOfFameCacheTable.hofImageId, hofImageId))
      .limit(1);
    
    if (!imageOwner[0] || imageOwner[0].cityName !== cityName) {
      throw new Error('Image not found or does not belong to this city');
    }
    
    // Remove primary status from ALL images (both screenshots and Hall of Fame) for this city
    await db.update(hallOfFameCacheTable)
      .set({ isPrimary: false })
      .where(eq(hallOfFameCacheTable.cityName, cityName));
    
    await db.update(cityImagesTable)
      .set({ isPrimary: false })
      .where(eq(cityImagesTable.cityId, cityId));
    
    // Set this Hall of Fame image as primary
    await db.update(hallOfFameCacheTable)
      .set({ isPrimary: true })
      .where(eq(hallOfFameCacheTable.hofImageId, hofImageId));
    
    return { success: true };
  } catch (error) {
    console.error('Error setting primary Hall of Fame image:', error);
    throw error;
  }
}

export async function clearHallOfFameCacheForCity(cityId: number) {
  try {
    await ensureHallOfFameCacheTableExists();
    
    await db.delete(hallOfFameCacheTable)
      .where(eq(hallOfFameCacheTable.cityId, cityId));
  } catch (error) {
    console.error('Error clearing Hall of Fame cache for city:', error);
  }
}

export async function getAllUsersWithHoFCreatorId() {
  try {
    await ensureTableExists();
    
    const users = await client`
      SELECT id, email, username, "hofCreatorId"
      FROM "User"
      WHERE "hofCreatorId" IS NOT NULL AND "hofCreatorId" != ''
    `;
    
    return users;
  } catch (error) {
    console.error('Error fetching users with HoF Creator ID:', error);
    return [];
  }
}

// Image likes table for both screenshots and Hall of Fame images
const imageLikesTable = pgTable('imageLikes', {
  id: serial('id').primaryKey(),
  userId: integer('userId').notNull(),
  imageId: varchar('imageId', { length: 255 }).notNull(), // Can be cityImage.id or hofImageId
  imageType: varchar('imageType', { length: 20 }).notNull(), // 'screenshot' or 'hall_of_fame'
  cityId: integer('cityId').references(() => cityTable.id, { onDelete: 'cascade' }),
  createdAt: timestamp('createdAt').defaultNow(),
});

// Image comments table for both screenshots and Hall of Fame images
const imageCommentsTable = pgTable('imageComments', {
  id: serial('id').primaryKey(),
  userId: integer('userId').notNull(),
  imageId: varchar('imageId', { length: 255 }).notNull(), // Can be cityImage.id or hofImageId
  imageType: varchar('imageType', { length: 20 }).notNull(), // 'screenshot' or 'hall_of_fame'
  cityId: integer('cityId').references(() => cityTable.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow(),
});

// Image comment likes table
const imageCommentLikesTable = pgTable('imageCommentLikes', {
  id: serial('id').primaryKey(),
  userId: integer('userId').notNull(),
  commentId: integer('commentId').references(() => imageCommentsTable.id, { onDelete: 'cascade' }),
  createdAt: timestamp('createdAt').defaultNow(),
});

async function ensureImageLikesTableExists() {
  if (tableInitCache.has('imageLikes')) {
    return imageLikesTable;
  }

  try {
    await client`
      CREATE TABLE IF NOT EXISTS "imageLikes" (
        "id" SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL,
        "imageId" VARCHAR(255) NOT NULL,
        "imageType" VARCHAR(20) NOT NULL,
        "cityId" INTEGER REFERENCES "City"("id") ON DELETE CASCADE,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        UNIQUE("userId", "imageId", "imageType")
      )
    `;
  
    tableInitCache.add('imageLikes');
  } catch (error) {
    console.error('Error ensuring image likes table exists:', error);
  }

  return imageLikesTable;
}

async function ensureImageCommentsTableExists() {
  if (tableInitCache.has('imageComments')) {
    return imageCommentsTable;
  }

  try {
    await client`
      CREATE TABLE IF NOT EXISTS "imageComments" (
        "id" SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL,
        "imageId" VARCHAR(255) NOT NULL,
        "imageType" VARCHAR(20) NOT NULL,
        "cityId" INTEGER REFERENCES "City"("id") ON DELETE CASCADE,
        "content" TEXT NOT NULL,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `;
  
    tableInitCache.add('imageComments');
  } catch (error) {
    console.error('Error ensuring image comments table exists:', error);
  }

  return imageCommentsTable;
}

async function ensureImageCommentLikesTableExists() {
  if (tableInitCache.has('imageCommentLikes')) {
    return imageCommentLikesTable;
  }

  try {
    await client`
      CREATE TABLE IF NOT EXISTS "imageCommentLikes" (
        "id" SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL,
        "commentId" INTEGER REFERENCES "imageComments"("id") ON DELETE CASCADE,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        UNIQUE("userId", "commentId")
      )
    `;
  
    tableInitCache.add('imageCommentLikes');
  } catch (error) {
    console.error('Error ensuring image comment likes table exists:', error);
  }

  return imageCommentLikesTable;
}

// Image Likes Functions
export async function toggleImageLike(userId: number, imageId: string, imageType: 'screenshot' | 'hall_of_fame', cityId: number) {
  await ensureImageLikesTableExists();
  
  const existingLike = await db
    .select()
    .from(imageLikesTable)
    .where(
      and(
        eq(imageLikesTable.userId, userId),
        eq(imageLikesTable.imageId, imageId),
        eq(imageLikesTable.imageType, imageType)
      )
    )
    .limit(1);

  if (existingLike.length > 0) {
    // Unlike
    await db
      .delete(imageLikesTable)
      .where(
        and(
          eq(imageLikesTable.userId, userId),
          eq(imageLikesTable.imageId, imageId),
          eq(imageLikesTable.imageType, imageType)
        )
      );
    return { liked: false };
  } else {
    // Like
    await db.insert(imageLikesTable).values({
      userId,
      imageId,
      imageType,
      cityId,
    });
    return { liked: true };
  }
}

export async function getImageLikes(imageId: string, imageType: 'screenshot' | 'hall_of_fame') {
  await ensureImageLikesTableExists();
  
  const result = await db
    .select({ count: sql<number>`cast(count(*) as integer)` })
    .from(imageLikesTable)
    .where(
      and(
        eq(imageLikesTable.imageId, imageId),
        eq(imageLikesTable.imageType, imageType)
      )
    );
  
  return result[0]?.count || 0;
}

export async function isImageLikedByUser(userId: number, imageId: string, imageType: 'screenshot' | 'hall_of_fame') {
  await ensureImageLikesTableExists();
  
  const result = await db
    .select()
    .from(imageLikesTable)
    .where(
      and(
        eq(imageLikesTable.userId, userId),
        eq(imageLikesTable.imageId, imageId),
        eq(imageLikesTable.imageType, imageType)
      )
    )
    .limit(1);
  
  return result.length > 0;
}

// Image Comments Functions
export async function addImageComment(userId: number, imageId: string, imageType: 'screenshot' | 'hall_of_fame', cityId: number, content: string) {
  await ensureImageCommentsTableExists();
  
  const result = await db.insert(imageCommentsTable).values({
    userId,
    imageId,
    imageType,
    cityId,
    content,
  }).returning();
  
  return result[0];
}

export async function getImageComments(imageId: string, imageType: 'screenshot' | 'hall_of_fame', requestUserId?: number, sortBy: 'recent' | 'likes' = 'recent') {
  await ensureImageCommentsTableExists();
  await ensureImageCommentLikesTableExists();
  const users = await ensureTableExists();
  
  let orderByClause;
  if (sortBy === 'likes') {
    orderByClause = desc(sql`(SELECT COUNT(*) FROM "imageCommentLikes" WHERE "commentId" = "imageComments"."id")`);
  } else {
    orderByClause = desc(imageCommentsTable.createdAt);
  }

  const comments = await db
    .select({
      id: imageCommentsTable.id,
      userId: imageCommentsTable.userId,
      imageId: imageCommentsTable.imageId,
      imageType: imageCommentsTable.imageType,
      cityId: imageCommentsTable.cityId,
      content: imageCommentsTable.content,
      createdAt: imageCommentsTable.createdAt,
      updatedAt: imageCommentsTable.updatedAt,
      user: {
        id: users.id,
        username: users.username,
        avatar: users.avatar,
      },
      likeCount: sql<number>`cast((SELECT COUNT(*) FROM "imageCommentLikes" WHERE "commentId" = "imageComments"."id") as integer)`.as('likeCount'),
      isLikedByUser: requestUserId ? sql<boolean>`EXISTS(SELECT 1 FROM "imageCommentLikes" WHERE "commentId" = "imageComments"."id" AND "userId" = ${requestUserId})`.as('isLikedByUser') : sql<boolean>`false`.as('isLikedByUser'),
    })
    .from(imageCommentsTable)
    .leftJoin(users, eq(imageCommentsTable.userId, users.id))
    .where(
      and(
        eq(imageCommentsTable.imageId, imageId),
        eq(imageCommentsTable.imageType, imageType)
      )
    )
    .orderBy(orderByClause);

  return comments;
}

export async function deleteImageComment(commentId: number, userId: number) {
  await ensureImageCommentsTableExists();
  
  const result = await db
    .delete(imageCommentsTable)
    .where(
      and(
        eq(imageCommentsTable.id, commentId),
        eq(imageCommentsTable.userId, userId)
      )
    )
    .returning();
  
  return result[0] || null;
}

export async function deleteImageCommentAsAdmin(commentId: number) {
  await ensureImageCommentsTableExists();
  
  const result = await db
    .delete(imageCommentsTable)
    .where(eq(imageCommentsTable.id, commentId))
    .returning();
  
  return result[0] || null;
}

// Image Comment Likes Functions
export async function toggleImageCommentLike(userId: number, commentId: number) {
  await ensureImageCommentLikesTableExists();
  
  const existingLike = await db
    .select()
    .from(imageCommentLikesTable)
    .where(
      and(
        eq(imageCommentLikesTable.userId, userId),
        eq(imageCommentLikesTable.commentId, commentId)
      )
    )
    .limit(1);

  if (existingLike.length > 0) {
    // Unlike
    await db
      .delete(imageCommentLikesTable)
      .where(
        and(
          eq(imageCommentLikesTable.userId, userId),
          eq(imageCommentLikesTable.commentId, commentId)
        )
      );
    return { liked: false };
  } else {
    // Like
    await db.insert(imageCommentLikesTable).values({
      userId,
      commentId,
    });
    return { liked: true };
  }
}

export async function getImageCommentLikes(commentId: number) {
  await ensureImageCommentLikesTableExists();
  
  const result = await db
    .select({ count: sql<number>`cast(count(*) as integer)` })
    .from(imageCommentLikesTable)
    .where(eq(imageCommentLikesTable.commentId, commentId));
  
  return result[0]?.count || 0;
}

export async function isImageCommentLikedByUser(userId: number, commentId: number) {
  await ensureImageCommentLikesTableExists();
  
  const result = await db
    .select()
    .from(imageCommentLikesTable)
    .where(
      and(
        eq(imageCommentLikesTable.userId, userId),
        eq(imageCommentLikesTable.commentId, commentId)
      )
    )
    .limit(1);
  
  return result.length > 0;
}

// Utility function to get image stats
export async function getImageStats(imageId: string, imageType: 'screenshot' | 'hall_of_fame', userId?: number) {
  const [likeCount, commentCount, isLiked] = await Promise.all([
    getImageLikes(imageId, imageType),
    db.select({ count: sql<number>`cast(count(*) as integer)` })
      .from(imageCommentsTable)
      .where(
        and(
          eq(imageCommentsTable.imageId, imageId),
          eq(imageCommentsTable.imageType, imageType)
        )
      ).then(result => result[0]?.count || 0),
    userId ? isImageLikedByUser(userId, imageId, imageType) : Promise.resolve(false)
  ]);

  return {
    likeCount,
    commentCount,
    isLiked
  };
}
