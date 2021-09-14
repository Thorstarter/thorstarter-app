module.exports = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: "/governance/voting-token",
        destination: "/governance/token/",
        statusCode: 301,
      },
      {
        source: "/governance/voting-dashboard",
        destination: "/governance/dashboard/",
        statusCode: 301,
      },
    ];
  },
};
