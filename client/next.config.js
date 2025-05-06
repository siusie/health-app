/** @type {import('next').NextConfig} */
const { i18n } = require("./next-i18next.config");

const nextConfig = {
  i18n,
  async rewrites() {
    return [
      {
        source: "/_next/data/:hash/en/baby/:id/profile.json",
        destination: "/baby/:id/profile",
      },
    ];
  },
};

module.exports = nextConfig;
