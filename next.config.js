/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    SOUNDCLOUD_CLIENT_ID: process.env.SOUNDCLOUD_CLIENT_ID,
  },
};

module.exports = nextConfig;
