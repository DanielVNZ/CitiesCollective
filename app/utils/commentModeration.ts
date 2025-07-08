// Comment moderation utility
// This file contains functions to filter and moderate user comments

// Default lists - these will be overridden by database settings
const DEFAULT_PROFANITY_LIST = [
  // Common profanity (censored for safety)
  'f***', 's***', 'a**', 'b****', 'c***', 'd***', 'p***', 't***', 'w***',
  // Common variations and leetspeak
  'f*ck', 'sh*t', 'a**hole', 'b*tch', 'c*nt', 'd*ck', 'p*ssy', 't*ts', 'wh*re',
  'fck', 'sht', 'ass', 'btch', 'cnt', 'dck', 'pssy', 'tts', 'whre',
  // Common slurs and offensive terms
  'n***er', 'n*gger', 'f*ggot', 'f*gg*t', 'k*ke', 'sp*c', 'ch*nk', 'g**k',
  // Add more as needed - this is a basic list
];

// Default spam indicators - these will be overridden by database settings
const DEFAULT_SPAM_INDICATORS = [
  'buy now', 'click here', 'free money', 'make money fast', 'earn cash',
  'work from home', 'get rich quick', 'lottery winner', 'inheritance',
  'viagra', 'cialis', 'weight loss', 'diet pills', 'casino', 'poker',
  'bitcoin', 'crypto', 'investment opportunity', 'limited time offer'
];

// List of excessive punctuation patterns
const EXCESSIVE_PUNCTUATION = [
  /!{3,}/g,  // 3 or more exclamation marks
  /\?{3,}/g, // 3 or more question marks
  /\.{3,}/g, // 3 or more periods
  /[A-Z]{10,}/g, // 10 or more consecutive uppercase letters
];

export interface ModerationResult {
  isClean: boolean;
  filteredContent: string;
  reasons: string[];
  originalContent: string;
}

/**
 * Check if a comment contains inappropriate content
 */
export async function moderateComment(content: string): Promise<ModerationResult> {
  const originalContent = content;
  let filteredContent = content;
  const reasons: string[] = [];

  // Convert to lowercase for checking
  const lowerContent = content.toLowerCase();

  // Get profanity list from database or use default
  let profanityList = DEFAULT_PROFANITY_LIST;
  try {
    const { getModerationSetting } = await import('app/db');
    const dbProfanityList = await getModerationSetting('profanityList');
    if (dbProfanityList && Array.isArray(dbProfanityList)) {
      profanityList = dbProfanityList;
    }
  } catch (error) {
    console.warn('Could not load profanity list from database, using default');
  }

  // Check for profanity
  const foundProfanity = profanityList.filter((word: string) => 
    lowerContent.includes(word.toLowerCase())
  );

  if (foundProfanity.length > 0) {
    reasons.push(`Contains inappropriate language: ${foundProfanity.join(', ')}`);
    // Replace profanity with asterisks
    foundProfanity.forEach((word: string) => {
      const regex = new RegExp(word, 'gi');
      filteredContent = filteredContent.replace(regex, '*'.repeat(word.length));
    });
  }

  // Get spam indicators from database or use default
  let spamIndicators = DEFAULT_SPAM_INDICATORS;
  try {
    const { getModerationSetting } = await import('app/db');
    const dbSpamIndicators = await getModerationSetting('spamIndicators');
    if (dbSpamIndicators && Array.isArray(dbSpamIndicators)) {
      spamIndicators = dbSpamIndicators;
    }
  } catch (error) {
    console.warn('Could not load spam indicators from database, using default');
  }

  // Check for spam indicators
  const foundSpam = spamIndicators.filter((phrase: string) => 
    lowerContent.includes(phrase.toLowerCase())
  );

  if (foundSpam.length > 0) {
    reasons.push(`Contains spam indicators: ${foundSpam.join(', ')}`);
  }

  // Check for excessive punctuation
  const excessivePunct = EXCESSIVE_PUNCTUATION.some(pattern => 
    pattern.test(content)
  );

  if (excessivePunct) {
    reasons.push('Contains excessive punctuation or capitalization');
    // Clean up excessive punctuation
    filteredContent = filteredContent
      .replace(/!{3,}/g, '!!')
      .replace(/\?{3,}/g, '??')
      .replace(/\.{3,}/g, '...')
      .replace(/([A-Z])\1{9,}/g, (match) => match.charAt(0).repeat(3));
  }

  // Check for excessive repetition
  const words = content.split(/\s+/);
  const wordCount = words.length;
  const uniqueWords = new Set(words.map(w => w.toLowerCase()));
  const repetitionRatio = uniqueWords.size / wordCount;

  if (wordCount > 5 && repetitionRatio < 0.3) {
    reasons.push('Contains excessive word repetition');
  }

  // Check for all caps (shouting)
  const upperCaseRatio = (content.match(/[A-Z]/g) || []).length / content.length;
  if (upperCaseRatio > 0.7 && content.length > 10) {
    reasons.push('Contains excessive capitalization (shouting)');
    // Convert to proper case
    filteredContent = filteredContent.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  }

  // Check for excessive links
  const linkCount = (content.match(/https?:\/\/[^\s]+/g) || []).length;
  if (linkCount > 2) {
    reasons.push('Contains too many links');
  }

  // Check for minimum content length
  if (content.trim().length < 3) {
    reasons.push('Comment is too short');
  }

  // Check for maximum content length (should be handled by the API, but good to have here too)
  if (content.length > 1000) {
    reasons.push('Comment is too long');
  }

  const isClean = reasons.length === 0;

  return {
    isClean,
    filteredContent: isClean ? originalContent : filteredContent,
    reasons,
    originalContent
  };
}

/**
 * Get a user-friendly message about why a comment was filtered
 */
export function getModerationMessage(reasons: string[]): string {
  if (reasons.length === 0) return '';

  const messages = {
    'Contains inappropriate language': 'Your comment contained inappropriate language and has been filtered.',
    'Contains spam indicators': 'Your comment appears to be spam and has been filtered.',
    'Contains excessive punctuation or capitalization': 'Your comment contained excessive punctuation or capitalization and has been cleaned up.',
    'Contains excessive word repetition': 'Your comment contained excessive repetition and has been filtered.',
    'Contains excessive capitalization (shouting)': 'Your comment was written in all caps and has been converted to proper case.',
    'Contains too many links': 'Your comment contained too many links and has been filtered.',
    'Comment is too short': 'Your comment is too short. Please write a meaningful comment.',
    'Comment is too long': 'Your comment is too long. Please keep it under 1000 characters.'
  };

  const primaryReason = reasons[0];
  return messages[primaryReason as keyof typeof messages] || 'Your comment has been filtered due to community guidelines.';
}

/**
 * Check if a comment should be automatically rejected
 */
export function shouldRejectComment(reasons: string[]): boolean {
  const rejectionReasons = [
    'Contains inappropriate language',
    'Contains spam indicators',
    'Contains excessive word repetition',
    'Contains too many links',
    'Comment is too short'
  ];

  return reasons.some(reason => rejectionReasons.includes(reason));
} 