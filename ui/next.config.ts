import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export", // Enable static export
  distDir: "dist", // Output to 'dist' folder instead of 'out'
  images: {
    unoptimized: true, // Required for static export
  },
  // Optional: uncomment if you want trailing slashes
  // trailingSlash: true,
};

export default nextConfig;
