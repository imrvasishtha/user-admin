const AuthController = require('../controllers/AuthController');
const AuthSchema = require('../validate/auth');
const { responseCodes } = require('../utils/respSchemaHandler');
const { owner, admin, user } = require('../middleware/user.middleware');

module.exports = {
  plugin: {
    async register(server, options) {
      server.route([
        {
          method: 'POST',
          path: '/createUser',
          options: {
            plugins: {
              'hapi-swagger': {
                responses: responseCodes([200, 400, 401, 404, 500]),
              },
            },
            tags: ['api', 'Auth'],
            pre: [],
            auth: false,
            validate: { payload: AuthSchema.createUser },
            handler: AuthController.createUser,
            description: `To create new user - only user type  (for JWT token need to login after createUser)`,
          },
        },
      ]);

      server.route([
        {
          method: 'POST',
          path: '/login',
          options: {
            plugins: {
              'hapi-swagger': {
                responses: responseCodes([200, 400, 401, 404, 500]),
              },
            },
            tags: ['api', 'Auth'],
            pre: [],
            auth: false,
            validate: { payload: AuthSchema.login },
            handler: AuthController.login,
            description: `To login any type of user and get jwt token`,
          },
        },
      ]);

      server.route([
        {
          method: 'POST',
          path: '/userAccess',
          options: {
            plugins: {
              'hapi-swagger': {
                security: [
                  {
                    AUTH0_TOKEN: [],
                  },
                ],
                responses: responseCodes([200, 400, 401, 404, 500]),
              },
            },
            tags: ['api', 'Auth'],
            pre: [user],
            auth: false,
            validate: {},
            handler: AuthController.accessed,
            description: `Only user can access it`,
          },
        },
      ]);

      server.route([
        {
          method: 'POST',
          path: '/ownerAccess',
          options: {
            plugins: {
              'hapi-swagger': {
                security: [
                  {
                    AUTH0_TOKEN: [],
                  },
                ],
                responses: responseCodes([200, 400, 401, 404, 500]),
              },
            },
            tags: ['api', 'Auth'],
            pre: [owner],
            auth: false,
            validate: {},
            handler: AuthController.accessed,
            description: `Only owner can access it`,
          },
        },
      ]);

      server.route([
        {
          method: 'POST',
          path: '/adminAccess',
          options: {
            plugins: {
              'hapi-swagger': {
                security: [
                  {
                    AUTH0_TOKEN: [],
                  },
                ],
                responses: responseCodes([200, 400, 401, 404, 500]),
              },
            },
            tags: ['api', 'Auth'],
            pre: [admin],
            auth: false,
            validate: {},
            handler: AuthController.accessed,
            description: `owner and admin can access it`,
          },
        },
      ]);
    },
    version: process.env.API_VERSION,
    name: 'auth',
  },
};
