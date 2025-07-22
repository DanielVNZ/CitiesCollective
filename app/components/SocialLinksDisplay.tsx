import { getUserSocialLinks } from 'app/db';
import Image from 'next/image';
//deploy test
interface SocialLink {
  id: number;
  platform: string;
  url: string;
}

interface SocialLinksDisplayProps {
  userId: number;
}

// Social platform icons using official branded logos from public/Icons/social
const SocialIcons = {
  facebook: (
    <Image 
      src="/Icons/social/facebook.svg" 
      alt="Facebook" 
      width={20}
      height={20}
      className="[filter:brightness(0)_saturate(100%)_invert(27%)_sepia(51%)_saturate(2878%)_hue-rotate(187deg)_brightness(104%)_contrast(97%)] dark:[filter:brightness(0)_saturate(100%)_invert(27%)_sepia(51%)_saturate(2878%)_hue-rotate(187deg)_brightness(104%)_contrast(97%)]"
    />
  ),
  X: (
    <Image 
      src="/Icons/social/x-twitter.svg" 
      alt="X (Twitter)" 
      width={20}
      height={20}
      className="[filter:brightness(0)_saturate(100%)_invert(0%)_sepia(0%)_saturate(0%)_hue-rotate(0deg)_brightness(0%)_contrast(100%)] dark:[filter:brightness(0)_saturate(100%)_invert(100%)_sepia(0%)_saturate(0%)_hue-rotate(0deg)_brightness(100%)_contrast(100%)]"
    />
  ),
  x: (
    <Image 
      src="/Icons/social/x-twitter.svg" 
      alt="X (Twitter)" 
      width={20}
      height={20}
      className="[filter:brightness(0)_saturate(100%)_invert(0%)_sepia(0%)_saturate(0%)_hue-rotate(0deg)_brightness(0%)_contrast(100%)] dark:[filter:brightness(0)_saturate(100%)_invert(100%)_sepia(0%)_saturate(0%)_hue-rotate(0deg)_brightness(100%)_contrast(100%)]"
    />
  ),
  twitter: (
    <Image 
      src="/Icons/social/x-twitter.svg" 
      alt="X (Twitter)" 
      width={20}
      height={20}
      className="[filter:brightness(0)_saturate(100%)_invert(0%)_sepia(0%)_saturate(0%)_hue-rotate(0deg)_brightness(0%)_contrast(100%)] dark:[filter:brightness(0)_saturate(100%)_invert(100%)_sepia(0%)_saturate(0%)_hue-rotate(0deg)_brightness(100%)_contrast(100%)]"
    />
  ),
  bluesky: (
    <Image 
      src="/Icons/social/bluesky.svg" 
      alt="Bluesky" 
      width={20}
      height={20}
      className="[filter:brightness(0)_saturate(100%)_invert(48%)_sepia(79%)_saturate(2476%)_hue-rotate(176deg)_brightness(118%)_contrast(119%)] dark:[filter:brightness(0)_saturate(100%)_invert(48%)_sepia(79%)_saturate(2476%)_hue-rotate(176deg)_brightness(118%)_contrast(119%)]"
    />
  ),
  instagram: (
    <Image 
      src="/Icons/social/instagram.svg" 
      alt="Instagram" 
      width={20}
      height={20}
      className="[filter:brightness(0)_saturate(100%)_invert(27%)_sepia(51%)_saturate(2878%)_hue-rotate(330deg)_brightness(104%)_contrast(97%)] dark:[filter:brightness(0)_saturate(100%)_invert(27%)_sepia(51%)_saturate(2878%)_hue-rotate(330deg)_brightness(104%)_contrast(97%)]"
    />
  ),
  threads: (
    <Image 
      src="/Icons/social/threads.svg" 
      alt="Threads" 
      width={20}
      height={20}
      className="[filter:brightness(0)_saturate(100%)_invert(0%)_sepia(0%)_saturate(0%)_hue-rotate(0deg)_brightness(0%)_contrast(100%)] dark:[filter:brightness(0)_saturate(100%)_invert(100%)_sepia(0%)_saturate(0%)_hue-rotate(0deg)_brightness(100%)_contrast(100%)]"
    />
  ),
  discord: (
    <Image 
      src="/Icons/social/discord.svg" 
      alt="Discord" 
      width={20}
      height={20}
      className="[filter:brightness(0)_saturate(100%)_invert(27%)_sepia(51%)_saturate(2878%)_hue-rotate(240deg)_brightness(104%)_contrast(97%)] dark:[filter:brightness(0)_saturate(100%)_invert(27%)_sepia(51%)_saturate(2878%)_hue-rotate(240deg)_brightness(104%)_contrast(97%)]"
    />
  ),
  youtube: (
    <Image 
      src="/Icons/social/youtube.svg" 
      alt="YouTube" 
      width={20}
      height={20}
      className="[filter:brightness(0)_saturate(100%)_invert(27%)_sepia(51%)_saturate(2878%)_hue-rotate(0deg)_brightness(104%)_contrast(97%)] dark:[filter:brightness(0)_saturate(100%)_invert(27%)_sepia(51%)_saturate(2878%)_hue-rotate(0deg)_brightness(104%)_contrast(97%)]"
    />
  ),
  bilibili: (
    <Image 
      src="/Icons/social/bilibili.svg" 
      alt="Bilibili" 
      width={20}
      height={20}
      className="[filter:brightness(0)_saturate(100%)_invert(27%)_sepia(51%)_saturate(2878%)_hue-rotate(330deg)_brightness(104%)_contrast(97%)] dark:[filter:brightness(0)_saturate(100%)_invert(27%)_sepia(51%)_saturate(2878%)_hue-rotate(330deg)_brightness(104%)_contrast(97%)]"
    />
  ),
  twitch: (
    <Image 
      src="/Icons/social/twitch.svg" 
      alt="Twitch" 
      width={20}
      height={20}
      className="[filter:brightness(0)_saturate(100%)_invert(27%)_sepia(51%)_saturate(2878%)_hue-rotate(270deg)_brightness(104%)_contrast(97%)] dark:[filter:brightness(0)_saturate(100%)_invert(27%)_sepia(51%)_saturate(2878%)_hue-rotate(270deg)_brightness(104%)_contrast(97%)]"
    />
  ),
  kofi: (
    <Image 
      src="/Icons/social/kofi.svg" 
      alt="Ko-fi" 
      width={20}
      height={20}
      className="[filter:brightness(0)_saturate(100%)_invert(27%)_sepia(51%)_saturate(2878%)_hue-rotate(187deg)_brightness(104%)_contrast(97%)] dark:[filter:brightness(0)_saturate(100%)_invert(27%)_sepia(51%)_saturate(2878%)_hue-rotate(187deg)_brightness(104%)_contrast(97%)]"
    />
  ),
  buymeacoffee: (
    <Image 
      src="/Icons/social/buymeacoffee.svg" 
      alt="Buy Me a Coffee" 
      width={20}
      height={20}
      className="[filter:brightness(0)_saturate(100%)_invert(27%)_sepia(51%)_saturate(2878%)_hue-rotate(45deg)_brightness(104%)_contrast(97%)] dark:[filter:brightness(0)_saturate(100%)_invert(27%)_sepia(51%)_saturate(2878%)_hue-rotate(45deg)_brightness(104%)_contrast(97%)]"
    />
  ),
  paypal: (
    <Image 
      src="/Icons/social/paypal.svg" 
      alt="PayPal" 
      width={20}
      height={20}
      className="[filter:brightness(0)_saturate(100%)_invert(27%)_sepia(51%)_saturate(2878%)_hue-rotate(187deg)_brightness(104%)_contrast(97%)] dark:[filter:brightness(0)_saturate(100%)_invert(27%)_sepia(51%)_saturate(2878%)_hue-rotate(187deg)_brightness(104%)_contrast(97%)]"
    />
  ),
  github: (
    <Image 
      src="/Icons/social/github.svg" 
      alt="GitHub" 
      width={20}
      height={20}
      className="[filter:brightness(0)_saturate(100%)_invert(0%)_sepia(0%)_saturate(0%)_hue-rotate(0deg)_brightness(0%)_contrast(100%)] dark:[filter:brightness(0)_saturate(100%)_invert(100%)_sepia(0%)_saturate(0%)_hue-rotate(0deg)_brightness(100%)_contrast(100%)]"
    />
  ),
  gitlab: (
    <Image 
      src="/Icons/social/gitlab.svg" 
      alt="GitLab" 
      width={20}
      height={20}
      className="[filter:brightness(0)_saturate(100%)_invert(27%)_sepia(51%)_saturate(2878%)_hue-rotate(30deg)_brightness(104%)_contrast(97%)] dark:[filter:brightness(0)_saturate(100%)_invert(27%)_sepia(51%)_saturate(2878%)_hue-rotate(30deg)_brightness(104%)_contrast(97%)]"
    />
  ),
  paradoxmods: (
    <Image 
      src="/Icons/social/paradoxmods.png" 
      alt="Paradox Mods" 
      width={20}
      height={20}
    />
  ),
};

const getPlatformLabel = (platform: string) => {
  const labels: Record<string, string> = {
    facebook: 'Facebook',
    X: 'X',
    bluesky: 'Bluesky',
    instagram: 'Instagram',
    threads: 'Threads',
    discord: 'Discord',
    youtube: 'YouTube',
    bilibili: 'Bilibili',
    twitch: 'Twitch',
    kofi: 'Ko-fi',
    buymeacoffee: 'Buy Me a Coffee',
    paypal: 'PayPal',
    github: 'GitHub',
    gitlab: 'GitLab',
    paradoxmods: 'Paradox Mods',
  };
  return labels[platform] || platform;
};

const getPlatformColor = (platform: string) => {
  const colors: Record<string, string> = {
    facebook: 'text-blue-600 hover:text-blue-800',
    X: 'text-gray-900 hover:text-gray-700',
    bluesky: 'text-sky-500 hover:text-sky-700',
    instagram: 'text-pink-600 hover:text-pink-800',
    threads: 'text-gray-900 hover:text-gray-700',
    discord: 'text-indigo-600 hover:text-indigo-800',
    youtube: 'text-red-600 hover:text-red-800',
    bilibili: 'text-pink-500 hover:text-pink-700',
    twitch: 'text-purple-600 hover:text-purple-800',
    kofi: 'text-blue-500 hover:text-blue-700',
    buymeacoffee: 'text-yellow-600 hover:text-yellow-800',
    paypal: 'text-blue-700 hover:text-blue-900',
    github: 'text-gray-900 hover:text-gray-700',
    gitlab: 'text-orange-600 hover:text-orange-800',
    paradoxmods: 'text-green-600 hover:text-green-800',
  };
  return colors[platform] || 'text-gray-600 hover:text-gray-800';
};

export async function SocialLinksDisplay({ userId }: SocialLinksDisplayProps) {
  const socialLinks = await getUserSocialLinks(userId);

  if (!socialLinks || socialLinks.length === 0) {
    return null;
  }

  return (
    <div className="mt-4">
      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Social Links</h4>
      <div className="flex flex-wrap gap-3">
        {socialLinks.map((link) => (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800/50 hover:bg-gray-200 dark:hover:bg-gray-700/70 transition-colors ${getPlatformColor(link.platform)}`}
            title={`${getPlatformLabel(link.platform)}: ${link.url}`}
          >
            {SocialIcons[link.platform as keyof typeof SocialIcons] || (
              <Image 
                src="/Icons/social/github.svg" 
                alt="Social Link" 
                width={20}
                height={20}
                className="[filter:brightness(0)_saturate(100%)_invert(0%)_sepia(0%)_saturate(0%)_hue-rotate(0deg)_brightness(0%)_contrast(100%)] dark:[filter:brightness(0)_saturate(100%)_invert(100%)_sepia(0%)_saturate(0%)_hue-rotate(0deg)_brightness(100%)_contrast(100%)]"
              />
            )}
            <span className="text-sm font-medium">{getPlatformLabel(link.platform)}</span>
          </a>
        ))}
      </div>
    </div>
  );
} 