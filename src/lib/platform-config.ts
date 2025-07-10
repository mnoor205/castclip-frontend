export interface PlatformConfig {
  name: string;
  displayName: string;
  hero: {
    title: string;
    description: string;
    ctaText: string;
  };
  features: {
    videoLength: string;
    aspectRatio: string;
    audienceSize: string;
    description: string;
  };
  seo: {
    title: string;
    description: string;
    keywords: string[];
  };
}

export const platformConfigs: Record<string, PlatformConfig> = {
  tiktok: {
    name: 'tiktok',
    displayName: 'TikTok',
    hero: {
      title: 'Turn Your Business Podcast Into\nViral TikTok Clips',
      description: 'Our AI finds the most engaging moments in your podcast and creates TikTok-ready clips in minutes. Join 1+ billion users and grow your business audience on the world\'s fastest-growing platform.',
      ctaText: 'Start Creating TikTok Clips Free',
    },
    features: {
      videoLength: '15-60 seconds',
      aspectRatio: '9:16 vertical',
      audienceSize: '1+ billion users',
      description: 'Optimized for TikTok\'s algorithm and vertical video format. Perfect length for maximum engagement and discoverability.',
    },
    seo: {
      title: 'TikTok Clip Maker for Podcasters | Turn Podcasts into Viral TikTok Videos',
      description: 'Create viral TikTok clips from your business podcast with AI. Generate 15-60 second vertical videos optimized for TikTok\'s algorithm. Start free!',
      keywords: ['TikTok clip maker', 'podcast to TikTok', 'viral TikTok videos', 'business TikTok content', 'podcast clips'],
    },
  },
  reels: {
    name: 'reels',
    displayName: 'Instagram Reels',
    hero: {
      title: 'Turn Your Business Podcast Into\nViral Instagram Reels',
      description: 'Our AI finds the most engaging moments in your podcast and creates Instagram Reels in minutes. Reach 2+ billion Instagram users and grow your business with professional-quality content.',
      ctaText: 'Start Creating Instagram Reels Free',
    },
    features: {
      videoLength: '15-90 seconds',
      aspectRatio: '9:16 vertical',
      audienceSize: '2+ billion users',
      description: 'Perfectly formatted for Instagram Reels with optimal length for engagement. Designed to maximize reach and professional appeal.',
    },
    seo: {
      title: 'Instagram Reels Maker for Podcasters | Convert Podcasts to Viral Reels',
      description: 'Transform your business podcast into viral Instagram Reels with AI. Create 15-90 second vertical videos optimized for Instagram. Get started free!',
      keywords: ['Instagram Reels maker', 'podcast to Reels', 'viral Instagram videos', 'business Instagram content', 'podcast clips'],
    },
  },
  'youtube-shorts': {
    name: 'youtube-shorts',
    displayName: 'YouTube Shorts',
    hero: {
      title: 'Turn Your Business Podcast Into\nViral YouTube Shorts',
      description: 'Our AI finds the most engaging moments in your podcast and creates YouTube Shorts in minutes. Tap into YouTube\'s 2+ billion users with content that drives subscribers and business growth.',
      ctaText: 'Start Creating YouTube Shorts Free',
    },
    features: {
      videoLength: 'Up to 60 seconds',
      aspectRatio: '9:16 vertical',
      audienceSize: '2+ billion users',
      description: 'Optimized for YouTube Shorts discovery with perfect vertical formatting. Designed to drive subscriber growth and channel engagement.',
    },
    seo: {
      title: 'YouTube Shorts Maker for Podcasters | Convert Podcasts to Viral Shorts',
      description: 'Create viral YouTube Shorts from your business podcast with AI. Generate up to 60-second vertical videos optimized for YouTube discovery. Start free!',
      keywords: ['YouTube Shorts maker', 'podcast to YouTube Shorts', 'viral YouTube videos', 'business YouTube content', 'podcast clips'],
    },
  },
  twitter: {
    name: 'twitter',
    displayName: 'Twitter/X',
    hero: {
      title: 'Turn Your Business Podcast Into\nViral Twitter/X Clips',
      description: 'Our AI finds the most engaging moments in your podcast and creates Twitter/X video clips in minutes. Share your expertise with 500+ million users and build your professional network.',
      ctaText: 'Start Creating Twitter Clips Free',
    },
    features: {
      videoLength: '20-140 seconds',
      aspectRatio: '16:9 or 9:16',
      audienceSize: '500+ million users',
      description: 'Perfect for Twitter\'s professional audience. Optimized length for engagement and sharing in the business community.',
    },
    seo: {
      title: 'Twitter Clip Maker for Podcasters | Convert Podcasts to Viral Twitter Videos',
      description: 'Transform your business podcast into engaging Twitter/X video clips with AI. Create shareable content for professional networking. Start free!',
      keywords: ['Twitter clip maker', 'podcast to Twitter', 'viral Twitter videos', 'business Twitter content', 'podcast clips'],
    },
  },
  linkedin: {
    name: 'linkedin',
    displayName: 'LinkedIn',
    hero: {
      title: 'Turn Your Business Podcast Into\nProfessional LinkedIn Clips',
      description: 'Our AI finds the most engaging moments in your podcast and creates LinkedIn video clips in minutes. Share your business expertise with 900+ million professionals worldwide.',
      ctaText: 'Start Creating LinkedIn Clips Free',
    },
    features: {
      videoLength: '30-300 seconds',
      aspectRatio: '16:9 landscape',
      audienceSize: '900+ million professionals',
      description: 'Optimized for LinkedIn\'s professional audience. Perfect length for thought leadership and business networking content.',
    },
    seo: {
      title: 'LinkedIn Clip Maker for Podcasters | Convert Podcasts to Professional Videos',
      description: 'Create professional LinkedIn video clips from your business podcast with AI. Share expertise with 900+ million professionals. Start free!',
      keywords: ['LinkedIn clip maker', 'podcast to LinkedIn', 'professional video content', 'business LinkedIn videos', 'podcast clips'],
    },
  },
};

export function getPlatformFromSlug(slug: string): string | null {
  if (!slug.endsWith('-clip-maker')) {
    return null;
  }
  
  const platform = slug.replace('-clip-maker', '');
  return platformConfigs[platform] ? platform : null;
}

export function getPlatformConfig(platform: string): PlatformConfig | null {
  return platformConfigs[platform] || null;
} 