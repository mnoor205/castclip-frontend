import { MetadataRoute } from "next";


export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL!

    return [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 1,
          },

          // Platform-specific SEO pages
        //   {
        //     url: `${baseUrl}/tiktok-clip-maker`,
        //     lastModified: new Date(),
        //     changeFrequency: 'weekly',
        //     priority: 0.8,
        //   },
        //   {
        //     url: `${baseUrl}/reels-clip-maker`,
        //     lastModified: new Date(),
        //     changeFrequency: 'weekly',
        //     priority: 0.8,
        //   },
        //   {
        //     url: `${baseUrl}/youtube-shorts-clip-maker`,
        //     lastModified: new Date(),
        //     changeFrequency: 'weekly',
        //     priority: 0.8,
        //   },
        //   {
        //     url: `${baseUrl}/twitter-clip-maker`,
        //     lastModified: new Date(),
        //     changeFrequency: 'weekly',
        //     priority: 0.7,
        //   },
        //   {
        //     url: `${baseUrl}/linkedin-clip-maker`,
        //     lastModified: new Date(),
        //     changeFrequency: 'weekly',
        //     priority: 0.7,
        //   },

          // Other random stuff
          {
            url: `${baseUrl}/sign-in`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.3,
          },
          {
            url: `${baseUrl}/privacy-policy`,
            lastModified: new Date(),
            changeFrequency: 'yearly',
            priority: 0.3,
          },
          {
            url: `${baseUrl}/terms-of-service`,
            lastModified: new Date(),
            changeFrequency: 'yearly',
            priority: 0.3,
          },
    ]
}