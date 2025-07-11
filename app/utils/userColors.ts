// Utility for generating consistent randomized colors for usernames

// Predefined color schemes that work well in both light and dark modes
const colorSchemes = [
  {
    name: 'blue',
    light: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-100 dark:bg-blue-900/20',
    ring: 'ring-blue-500',
    avatar: 'from-blue-500 to-blue-600'
  },
  {
    name: 'green',
    light: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-100 dark:bg-green-900/20',
    ring: 'ring-green-500',
    avatar: 'from-green-500 to-green-600'
  },
  {
    name: 'purple',
    light: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-100 dark:bg-purple-900/20',
    ring: 'ring-purple-500',
    avatar: 'from-purple-500 to-purple-600'
  },
  {
    name: 'pink',
    light: 'text-pink-600 dark:text-pink-400',
    bg: 'bg-pink-100 dark:bg-pink-900/20',
    ring: 'ring-pink-500',
    avatar: 'from-pink-500 to-pink-600'
  },
  {
    name: 'indigo',
    light: 'text-indigo-600 dark:text-indigo-400',
    bg: 'bg-indigo-100 dark:bg-indigo-900/20',
    ring: 'ring-indigo-500',
    avatar: 'from-indigo-500 to-indigo-600'
  },
  {
    name: 'orange',
    light: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-100 dark:bg-orange-900/20',
    ring: 'ring-orange-500',
    avatar: 'from-orange-500 to-orange-600'
  },
  {
    name: 'red',
    light: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-100 dark:bg-red-900/20',
    ring: 'ring-red-500',
    avatar: 'from-red-500 to-red-600'
  },
  {
    name: 'teal',
    light: 'text-teal-600 dark:text-teal-400',
    bg: 'bg-teal-100 dark:bg-teal-900/20',
    ring: 'ring-teal-500',
    avatar: 'from-teal-500 to-teal-600'
  },
  {
    name: 'cyan',
    light: 'text-cyan-600 dark:text-cyan-400',
    bg: 'bg-cyan-100 dark:bg-cyan-900/20',
    ring: 'ring-cyan-500',
    avatar: 'from-cyan-500 to-cyan-600'
  },
  {
    name: 'amber',
    light: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-100 dark:bg-amber-900/20',
    ring: 'ring-amber-500',
    avatar: 'from-amber-500 to-amber-600'
  }
];

// Simple hash function to convert string to number
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

// Get consistent color scheme for a username
export function getUsernameColor(username: string | null | undefined): typeof colorSchemes[0] {
  if (!username) {
    return colorSchemes[0]; // Default to blue for anonymous users
  }
  
  const hash = hashString(username.toLowerCase());
  const colorIndex = hash % colorSchemes.length;
  return colorSchemes[colorIndex];
}

// Get just the text color class
export function getUsernameTextColor(username: string | null | undefined): string {
  return getUsernameColor(username).light;
}

// Get just the background color class
export function getUsernameBgColor(username: string | null | undefined): string {
  return getUsernameColor(username).bg;
}

// Get just the ring color class
export function getUsernameRingColor(username: string | null | undefined): string {
  return getUsernameColor(username).ring;
}

// Get just the avatar gradient class
export function getUsernameAvatarColor(username: string | null | undefined): string {
  return getUsernameColor(username).avatar;
} 