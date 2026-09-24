import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Inktype",
    short_name: "Inktype",
    description: "Free typing practice through real books.",
    start_url: "/",
    display: "standalone",
    background_color: "#fbfaf7",
    theme_color: "#fbfaf7",
    categories: ["education", "books"],
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
