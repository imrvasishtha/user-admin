'use strict';
const { validateUserToken } = require('./src/controllers/AuthController');
const jwksRsa = require('jwks-rsa');
const Pack = require('./package.json');

/**
 * This plugin responsible for authorized API
 * For authorization we use jwks-rsa and Auth0
 * By pass Auth0 in testing environment
 */
const authPlugin = {
  async register(server, options) {
    const key =
      process.env.NODE_ENV === 'testing'
        ? process.env.TOKEN_SECRET
        : jwksRsa.hapiJwt2KeyAsync({
            jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`,
            cache: true,
            rateLimit: true,
            jwksRequestsPerMinute: 20,
          });

    const obj = {
      complete: true,
      key,
      validate: validateUserToken,
      headerKey: 'authorization',
      tokenType: 'Bearer',
      verifyOptions: {
        algorithms: process.env.NODE_ENV === 'testing' ? false : ['RS256'],
      },
    };

    // Configuring jwt authentication strategy for validation
    server.auth.strategy('jwt', 'jwt', obj);

    // Set default authentication strategy jwt
    server.auth.default('jwt');
  },
  name: 'authenticate',
  version: Pack.version,
};

/**
 * Create plugin array with different-different plugin for register in server
 */
let plugins = [
  {
    plugin: require('hapi-auth-jwt2'),
  },
  {
    plugin: authPlugin,
  },
  {
    plugin: require('hapi-pino'),
    options: {
      ignorePaths: process.env.IGNORE_URLS_LOG.split(',') || [],
      logPayload: process.env.LOG_PAYLOAD === 'true',
      prettyPrint: {
        translateTime: "yyyy-mm-dd'T'HH:MM:ss.l",
      },
      logRequestStart: process.env.LOG_REQUEST_START === 'true',
      logRequestComplete: process.env.LOG_REQUEST_COMPLETE === 'true',
      logEvents: [
        'response',
        'onPostStart',
        'onRequest',
        'log',
        'onPostStop',
        'request',
      ],
    },
  },
  {
    plugin: require('hapi-api-version'),
    options: {
      validVersions: process.env.VALID_API_VERSIONS.split(','),
      defaultVersion: Number(process.env.DEFAULT_API_VERSION),
      vendorName: 'user-admin',
    },
  },
];

/**
 * Implement swagger for api documentation
 * Set schemes ['http','https'] for options
 * Host is base url retrieve from env files
 * Grouping by tag name
 * If you want to configure auth in swagger uncomment securityDefinitions
 */
const swaggerOption = {
  schemes: ['http', 'https'],
  host: process.env.APP_BASE_URL,
  grouping: 'tags',
  expanded: 'none',
  tags: [],
  info: {
    title: 'API Documentation',
    version: Pack.version,
  },
  securityDefinitions: {
    AUTH0_TOKEN: {
      description: 'Auth0 jwt token use for api authentication',
      type: 'apiKey',
      name: 'Authorization',
      in: 'header',
    },
  },
};

/**
 * concat plugins array with new plugin
 */
plugins = plugins.concat([
  {
    plugin: require('@hapi/inert'),
  },
  {
    plugin: require('@hapi/vision'),
  },
  {
    plugin: require('hapi-swagger'),
    options: swaggerOption,
  },
  {
    plugin: require('hapi-query-builder'),
    options: {
      defaultLimit: process.env.INIT_RECORD,
    },
  },
]);

/**
 * Register all routes in plugins
 * Simply add new routes in routes/index.js file for routing.
 */
const routes = require('./src/routes/index');
plugins = plugins.concat(routes);

module.exports = plugins;
