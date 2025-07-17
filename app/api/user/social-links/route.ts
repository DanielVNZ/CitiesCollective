import { NextRequest, NextResponse } from 'next/server';
import { auth } from 'app/auth';
import { getUserSocialLinks, upsertUserSocialLink, deleteUserSocialLink, getUser } from 'app/db';
import { sendHallOfFameUserUpdate } from '@/app/utils/hallOfFameWebhook';

// Define supported platforms with their domain validation
const PLATFORM_DOMAINS = {
  facebook: ['facebook.com', 'fb.com', 'm.facebook.com'],
  X: ['twitter.com', 'x.com', 'mobile.twitter.com'],
  bluesky: ['bsky.app', 'bsky.social'],
  instagram: ['instagram.com', 'instagr.am', 'm.instagram.com'],
  threads: ['threads.net', 'www.threads.net'],
  discord: ['discord.com', 'discord.gg', 'discordapp.com'],
  youtube: ['youtube.com', 'youtu.be', 'm.youtube.com', 'www.youtube.com'],
  bilibili: ['bilibili.com', 'www.bilibili.com', 'space.bilibili.com'],
  twitch: ['twitch.tv', 'www.twitch.tv', 'm.twitch.tv'],
  kofi: ['ko-fi.com', 'www.ko-fi.com'],
  buymeacoffee: ['buymeacoffee.com', 'www.buymeacoffee.com'],
  paypal: ['paypal.com', 'paypal.me', 'www.paypal.com', 'www.paypal.me'],
  github: ['github.com', 'www.github.com'],
  gitlab: ['gitlab.com', 'www.gitlab.com'],
  paradoxmods: ['mods.paradoxplaza.com', 'www.mods.paradoxplaza.com']
};

const SUPPORTED_PLATFORMS = Object.keys(PLATFORM_DOMAINS);

// Function to validate URL against platform domains
function validatePlatformUrl(platform: string, url: string): boolean {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    const domains = PLATFORM_DOMAINS[platform as keyof typeof PLATFORM_DOMAINS];
    
    if (!domains) return false;
    
    // Check if hostname matches any of the allowed domains
    return domains.some(domain => 
      hostname === domain || 
      hostname.endsWith('.' + domain)
    );
  } catch {
    return false;
  }
}

// GET - Get user's social links
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user ID from database
    const users = await getUser(session.user.email);
    if (!users || users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const userId = users[0].id;
    const socialLinks = await getUserSocialLinks(userId);
    
    return NextResponse.json({ socialLinks });
  } catch (error) {
    console.error('Error fetching social links:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Add or update a social link
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user ID from database
    const users = await getUser(session.user.email);
    if (!users || users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const userId = users[0].id;

    const body = await request.json();
    const { platform, url } = body;

    // Validate platform
    if (!platform || !SUPPORTED_PLATFORMS.includes(platform)) {
      return NextResponse.json({ error: 'Invalid platform' }, { status: 400 });
    }

    // Validate URL
    if (!url || typeof url !== 'string' || url.trim().length === 0) {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    // Platform-specific URL validation
    if (!validatePlatformUrl(platform, url)) {
      const domains = PLATFORM_DOMAINS[platform as keyof typeof PLATFORM_DOMAINS];
      const domainList = domains.join(', ');
      return NextResponse.json({ 
        error: `Invalid URL for ${platform}. URL must be from one of these domains: ${domainList}` 
      }, { status: 400 });
    }

    const socialLink = await upsertUserSocialLink(userId, platform, url.trim());
    
    // Send webhook to Hall of Fame if user has a Creator ID
    try {
      const user = users[0];
      if (user.hofCreatorId && user.hofCreatorId.trim()) {
        await sendHallOfFameUserUpdate(userId, user.hofCreatorId);
      }
    } catch (webhookError) {
      // Log error but don't fail the update
      console.error('Failed to send Hall of Fame webhook:', webhookError);
    }
    
    return NextResponse.json({ socialLink, message: 'Social link saved successfully' });
  } catch (error) {
    console.error('Error saving social link:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Remove a social link
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user ID from database
    const users = await getUser(session.user.email);
    if (!users || users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const userId = users[0].id;

    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform');

    if (!platform || !SUPPORTED_PLATFORMS.includes(platform)) {
      return NextResponse.json({ error: 'Invalid platform' }, { status: 400 });
    }

    const deletedLink = await deleteUserSocialLink(userId, platform);
    
    if (!deletedLink) {
      return NextResponse.json({ error: 'Social link not found' }, { status: 404 });
    }

    // Send webhook to Hall of Fame if user has a Creator ID
    try {
      const user = users[0];
      if (user.hofCreatorId && user.hofCreatorId.trim()) {
        await sendHallOfFameUserUpdate(userId, user.hofCreatorId);
      }
    } catch (webhookError) {
      // Log error but don't fail the update
      console.error('Failed to send Hall of Fame webhook:', webhookError);
    }

    return NextResponse.json({ message: 'Social link deleted successfully' });
  } catch (error) {
    console.error('Error deleting social link:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 