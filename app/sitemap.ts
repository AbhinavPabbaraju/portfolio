import type { MetadataRoute } from "next";

/* One page, one entry — the scenes are anchors on it, not routes. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://abhinavpabbaraju.com",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
