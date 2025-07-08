import { drizzle } from 'drizzle-orm/postgres-js';
import { pgTable, serial, varchar, integer, boolean, json, text, timestamp } from 'drizzle-orm/pg-core';
import { eq, desc, and, ilike, gte, lte, or, asc, sql } from 'drizzle-orm';
import postgres from 'postgres';
import { genSaltSync, hashSync } from 'bcrypt-ts';

// Optionally, if not using email/pass login, you can
// use the Drizzle adapter for Auth.js / NextAuth
// https://authjs.dev/reference/adapter/drizzle
let client = postgres(`${process.env.POSTGRES_URL!}?sslmode=require`);
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
  fileName: varchar('fileName', { length: 255 }),
  filePath: varchar('filePath', { length: 500 }),
  downloadable: boolean('downloadable').default(true),
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

const moderationSettingsTable = pgTable('moderationSettings', {
  id: serial('id').primaryKey(),
  key: varchar('key', { length: 100 }).unique().notNull(),
  value: json('value'),
  updatedAt: timestamp('updatedAt').defaultNow(),
});

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

export async function updateUser(userId: number, data: { username?: string; isAdmin?: boolean }) {
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

export async function getAllUsersWithStats() {
  const users = await ensureTableExists();
  await ensureCityTableExists();
  
  const userStats = await db.select({
    id: users.id,
    email: users.email,
    username: users.username,
    isAdmin: users.isAdmin,
    cityCount: sql<number>`COUNT(${cityTable.id})`.as('cityCount'),
    totalPopulation: sql<number>`COALESCE(SUM(${cityTable.population}), 0)`.as('totalPopulation'),
    totalMoney: sql<number>`COALESCE(SUM(${cityTable.money}), 0)`.as('totalMoney'),
    totalXP: sql<number>`COALESCE(SUM(${cityTable.xp}), 0)`.as('totalXP'),
    lastUpload: sql<Date | null>`MAX(${cityTable.uploadedAt})`.as('lastUpload'),
  })
    .from(users)
    .leftJoin(cityTable, eq(cityTable.userId, users.id))
    .groupBy(users.id, users.email, users.username, users.isAdmin)
    .orderBy(desc(sql`COUNT(${cityTable.id})`));
  
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
      isAdmin: boolean('isAdmin').default(false),
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
  }

  // Mark as initialized
  tableInitCache.add(cacheKey);

  const table = pgTable('User', {
    id: integer('id').primaryKey(),
    email: varchar('email', { length: 64 }),
    password: varchar('password', { length: 64 }),
    username: varchar('username', { length: 32 }),
    isAdmin: boolean('isAdmin').default(false),
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
        "fileName" VARCHAR(255),
        "filePath" VARCHAR(500),
        "downloadable" BOOLEAN DEFAULT TRUE,
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
  }

  // Mark as initialized
  tableInitCache.add(cacheKey);

  return cityTable;
}

export async function getRecentCities(limit: number = 12) {
  await ensureCityTableExists();
  await ensureCityImagesTableExists();
  
  const userTable = await ensureTableExists();
  
  // Get cities with their primary images and author information
  const cities = await db.select({
    id: cityTable.id,
    userId: cityTable.userId,
    cityName: cityTable.cityName,
    mapName: cityTable.mapName,
    population: cityTable.population,
    money: cityTable.money,
    xp: cityTable.xp,
    theme: cityTable.theme,
    gameMode: cityTable.gameMode,
    uploadedAt: cityTable.uploadedAt,
    primaryImageThumbnail: cityImagesTable.thumbnailPath,
    authorUsername: userTable.username,
    modsEnabled: cityTable.modsEnabled,
  })
    .from(cityTable)
    .leftJoin(cityImagesTable, and(
      eq(cityImagesTable.cityId, cityTable.id),
      eq(cityImagesTable.isPrimary, true)
    ))
    .leftJoin(userTable, eq(cityTable.userId, userTable.id))
    .orderBy(desc(cityTable.uploadedAt))
    .limit(limit);
  
  return cities;
}

export async function getTopCitiesByMoney(limit: number = 3) {
  await ensureCityTableExists();
  await ensureCityImagesTableExists();
  
  const userTable = await ensureTableExists();
  
  // Get cities with highest money, including their primary images and author information
  const cities = await db.select({
    id: cityTable.id,
    userId: cityTable.userId,
    cityName: cityTable.cityName,
    mapName: cityTable.mapName,
    population: cityTable.population,
    money: cityTable.money,
    xp: cityTable.xp,
    theme: cityTable.theme,
    gameMode: cityTable.gameMode,
    uploadedAt: cityTable.uploadedAt,
    primaryImageThumbnail: cityImagesTable.thumbnailPath,
    authorUsername: userTable.username,
    modsEnabled: cityTable.modsEnabled,
  })
    .from(cityTable)
    .leftJoin(cityImagesTable, and(
      eq(cityImagesTable.cityId, cityTable.id),
      eq(cityImagesTable.isPrimary, true)
    ))
    .leftJoin(userTable, eq(cityTable.userId, userTable.id))
    .orderBy(desc(cityTable.money))
    .limit(limit);
  
  return cities;
}

export async function getTopCitiesByLikes(limit: number = 3) {
  await ensureCityTableExists();
  await ensureCityImagesTableExists();
  await ensureLikesTableExists();
  
  const userTable = await ensureTableExists();
  
  // Get cities with most likes, including their primary images and author information
  const cities = await db.select({
    id: cityTable.id,
    userId: cityTable.userId,
    cityName: cityTable.cityName,
    mapName: cityTable.mapName,
    population: cityTable.population,
    money: cityTable.money,
    xp: cityTable.xp,
    theme: cityTable.theme,
    gameMode: cityTable.gameMode,
    uploadedAt: cityTable.uploadedAt,
    primaryImageThumbnail: cityImagesTable.thumbnailPath,
    authorUsername: userTable.username,
    modsEnabled: cityTable.modsEnabled,
    likeCount: sql<number>`COUNT(${likesTable.id})`.as('likeCount'),
  })
    .from(cityTable)
    .leftJoin(cityImagesTable, and(
      eq(cityImagesTable.cityId, cityTable.id),
      eq(cityImagesTable.isPrimary, true)
    ))
    .leftJoin(userTable, eq(cityTable.userId, userTable.id))
    .leftJoin(likesTable, eq(likesTable.cityId, cityTable.id))
    .groupBy(
      cityTable.id,
      cityTable.userId,
      cityTable.cityName,
      cityTable.mapName,
      cityTable.population,
      cityTable.money,
      cityTable.xp,
      cityTable.theme,
      cityTable.gameMode,
      cityTable.uploadedAt,
      cityImagesTable.thumbnailPath,
      userTable.username,
      cityTable.modsEnabled
    )
    .orderBy(desc(sql`COUNT(${likesTable.id})`))
    .limit(limit);
  
  return cities;
}

export async function getCitiesByUser(userId: number) {
  await ensureCityTableExists();
  await ensureCityImagesTableExists();
  
  const cities = await db.select({
    id: cityTable.id,
    userId: cityTable.userId,
    cityName: cityTable.cityName,
    mapName: cityTable.mapName,
    population: cityTable.population,
    money: cityTable.money,
    xp: cityTable.xp,
    theme: cityTable.theme,
    gameMode: cityTable.gameMode,
    fileName: cityTable.fileName,
    filePath: cityTable.filePath,
    downloadable: cityTable.downloadable,
    uploadedAt: cityTable.uploadedAt,
    primaryImageThumbnail: cityImagesTable.thumbnailPath,
    modsEnabled: cityTable.modsEnabled,
  })
    .from(cityTable)
    .leftJoin(cityImagesTable, and(
      eq(cityImagesTable.cityId, cityTable.id),
      eq(cityImagesTable.isPrimary, true)
    ))
    .where(eq(cityTable.userId, userId))
    .orderBy(desc(cityTable.uploadedAt));
  
  return cities;
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
    fileName: cityTable.fileName,
    filePath: cityTable.filePath,
    downloadable: cityTable.downloadable,
    uploadedAt: cityTable.uploadedAt,
    updatedAt: cityTable.updatedAt,
  }).from(cityTable).where(eq(cityTable.id, id)).limit(1);
  return result[0] || null;
}

export async function getUserById(id: number) {
  const users = await ensureTableExists();
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
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
  await ensureCityImagesTableExists();
  
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
  
  // Determine sorting
  const sortBy = filters.sortBy || 'newest';
  const sortOrder = filters.sortOrder || 'desc';
  
  let orderByClause;
  switch (sortBy) {
    case 'newest':
      orderByClause = sortOrder === 'desc' ? desc(cityTable.uploadedAt) : asc(cityTable.uploadedAt);
      break;
    case 'oldest':
      orderByClause = sortOrder === 'desc' ? desc(cityTable.uploadedAt) : asc(cityTable.uploadedAt);
      break;
    case 'population':
      orderByClause = sortOrder === 'desc' ? desc(cityTable.population) : asc(cityTable.population);
      break;
    case 'money':
      orderByClause = sortOrder === 'desc' ? desc(cityTable.money) : asc(cityTable.money);
      break;
    case 'xp':
      orderByClause = sortOrder === 'desc' ? desc(cityTable.xp) : asc(cityTable.xp);
      break;
    case 'name':
      orderByClause = sortOrder === 'desc' ? desc(cityTable.cityName) : asc(cityTable.cityName);
      break;
    default:
      orderByClause = desc(cityTable.uploadedAt);
  }
  
  // Build and execute the query with image data
  if (conditions.length > 0) {
    return await db.select({
      id: cityTable.id,
      userId: cityTable.userId,
      cityName: cityTable.cityName,
      mapName: cityTable.mapName,
      population: cityTable.population,
      money: cityTable.money,
      xp: cityTable.xp,
      theme: cityTable.theme,
      gameMode: cityTable.gameMode,
      uploadedAt: cityTable.uploadedAt,
      primaryImageThumbnail: cityImagesTable.thumbnailPath,
      authorUsername: userTable.username,
      modsEnabled: cityTable.modsEnabled,
    })
      .from(cityTable)
      .leftJoin(cityImagesTable, and(
        eq(cityImagesTable.cityId, cityTable.id),
        eq(cityImagesTable.isPrimary, true)
      ))
      .leftJoin(userTable, eq(cityTable.userId, userTable.id))
      .where(and(...conditions))
      .orderBy(orderByClause)
      .limit(limit)
      .offset(offset);
  } else {
    return await db.select({
      id: cityTable.id,
      userId: cityTable.userId,
      cityName: cityTable.cityName,
      mapName: cityTable.mapName,
      population: cityTable.population,
      money: cityTable.money,
      xp: cityTable.xp,
      theme: cityTable.theme,
      gameMode: cityTable.gameMode,
      uploadedAt: cityTable.uploadedAt,
      primaryImageThumbnail: cityImagesTable.thumbnailPath,
      authorUsername: userTable.username,
      modsEnabled: cityTable.modsEnabled,
    })
      .from(cityTable)
      .leftJoin(cityImagesTable, and(
        eq(cityImagesTable.cityId, cityTable.id),
        eq(cityImagesTable.isPrimary, true)
      ))
      .leftJoin(userTable, eq(cityTable.userId, userTable.id))
      .orderBy(orderByClause)
      .limit(limit)
      .offset(offset);
  }
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
  const cacheKey = 'cityImages';
  
  // Return if already initialized
  if (tableInitCache.has(cacheKey)) {
    return;
  }
  
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "cityImages" (
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
        "uploadedAt" TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Mark as initialized
    tableInitCache.add(cacheKey);
  } catch (error) {
    console.error('Error creating city images table:', error);
  }
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
  }).returning();
  
  return result[0];
}

export async function getCityImages(cityId: number) {
  await ensureCityImagesTableExists();
  
  return await db.select()
    .from(cityImagesTable)
    .where(eq(cityImagesTable.cityId, cityId))
    .orderBy(desc(cityImagesTable.isPrimary), desc(cityImagesTable.uploadedAt));
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
  
  // First, verify the user owns the city
  const cityOwner = await db.select({ userId: cityTable.userId })
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
  
  // Remove primary status from all images of this city
  await db.update(cityImagesTable)
    .set({ isPrimary: false })
    .where(eq(cityImagesTable.cityId, cityId));
  
  // Set this image as primary
  await db.update(cityImagesTable)
    .set({ isPrimary: true })
    .where(eq(cityImagesTable.id, imageId));
  
  return { success: true };
}

export { ensureCityTableExists };

export { db };

// Community features table creation functions
async function ensureLikesTableExists() {
  const cacheKey = 'likes';
  
  // Return if already initialized
  if (tableInitCache.has(cacheKey)) {
    return;
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
  
  // Mark as initialized
  tableInitCache.add(cacheKey);
}

async function ensureCommentsTableExists() {
  const cacheKey = 'comments';
  
  // Return if already initialized
  if (tableInitCache.has(cacheKey)) {
    return;
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
  
  // Mark as initialized
  tableInitCache.add(cacheKey);
}

async function ensureFavoritesTableExists() {
  const cacheKey = 'favorites';
  
  // Return if already initialized
  if (tableInitCache.has(cacheKey)) {
    return;
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
  
  // Mark as initialized
  tableInitCache.add(cacheKey);
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

export async function getCityComments(cityId: number) {
  await ensureCommentsTableExists();
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
  })
    .from(commentsTable)
    .leftJoin(userTable, eq(commentsTable.userId, userTable.id))
    .where(eq(commentsTable.cityId, cityId))
    .orderBy(desc(commentsTable.createdAt));
  
  return comments;
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

// Moderation settings functions
async function ensureModerationSettingsTableExists() {
  const cacheKey = 'moderationSettings';
  
  // Return if already initialized
  if (tableInitCache.has(cacheKey)) {
    return;
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
  
  // Mark as initialized
  tableInitCache.add(cacheKey);
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
  
  const favorites = await db.select({
    id: cityTable.id,
    userId: cityTable.userId,
    cityName: cityTable.cityName,
    mapName: cityTable.mapName,
    population: cityTable.population,
    money: cityTable.money,
    xp: cityTable.xp,
    theme: cityTable.theme,
    gameMode: cityTable.gameMode,
    uploadedAt: cityTable.uploadedAt,
    primaryImageThumbnail: cityImagesTable.thumbnailPath,
    favoritedAt: favoritesTable.createdAt,
    modsEnabled: cityTable.modsEnabled,
  })
    .from(favoritesTable)
    .innerJoin(cityTable, eq(favoritesTable.cityId, cityTable.id))
    .leftJoin(cityImagesTable, and(
      eq(cityImagesTable.cityId, cityTable.id),
      eq(cityImagesTable.isPrimary, true)
    ))
    .where(eq(favoritesTable.userId, userId))
    .orderBy(desc(favoritesTable.createdAt))
    .limit(limit)
    .offset(offset);
  
  return favorites;
}
