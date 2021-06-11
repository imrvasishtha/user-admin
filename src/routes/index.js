const version = `/v${process.env.DEFAULT_API_VERSION}`;
const routes = [
  {
    plugin: require('./auth'),
    routes: {
      prefix: `${version}/auth`,
    },
  },
];

module.exports = routes;
