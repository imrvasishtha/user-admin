const AuthService = require('../services/AuthService');
const Boom = require('@hapi/boom');
const _ = require('lodash');
const User = require('../models/user');
const authService = new AuthService();
const jwt = require('jsonwebtoken');
const UserService = require('../services/UserService');
const userService = new UserService();

class AuthController {
  /**
   * This method will verify the user after decoding jwt token present in header or query params
   * It is used as the validate function in hapi-jwt2-auth
   * @param {Object} decoded  : decoded jwt token with payload
   * @param {*} request
   * @param {*} h
   */
  static async validateUserToken(decoded, request, h) {
    try {
      /* find routes to skip user validation and return true */
      const skipValidationForRoutes = process.env.SKIP_USER_VALIDATION_ON_ROUTES.split(
        ',',
      );
      if (skipValidationForRoutes.includes(request.path)) {
        return { isValid: true };
      }

      /* Get machine to machine token from auth0 */
      // const jwtToken = await AuthService.authM2MToken(request, '/user/detail');

      /* Get user profile data from curl request */
      const user = await userService.getUserProfile(
        request.headers.authorization,
        decoded.email,
      );

      if (_.isEmpty(user)) {
        return {
          isValid: false,
          response: h
            .response({
              error: 'User does not exists',
              message: 'User not found',
              statusCode: 404,
            })
            .code(404),
        };
      } else {
        request.user = user;
        return { isValid: true };
      }
    } catch (error) {
      request.logger.error('Error in AuthController.validateUserToken', error);
      return {
        isValid: false,
        response: h
          .response({
            error: `Internal server error: ${error}`,
            message: 'Something went wrong!',
            statusCode: 500,
          })
          .code(500),
      };
    }
  }

  /**
   * This function is used to create new user in database
   * @param {Hapi request obj} request
   * @param {hapi handler} h
   */
  static async createUser(request, h) {
    try {
      const email = request.payload.email;
      const password = request.payload.password;
      const confirmPassword = request.payload.confirmPassword;
      const findRes = await User.findOne({ email });
      if (findRes) {
        return h
          .response({
            statusCode: 409,
            message: 'email address already exists',
          })
          .code(409);
      }

      if (password !== confirmPassword) {
        return h
          .response({
            statusCode: 400,
            message: 'password and confirm password are not same',
          })
          .code(400);
      }

      const result = await authService.createUser({
        email,
        password,
        confirmPassword,
      });

      const userObj = {
        _id: result._id,
        email: result.email,
        type: result.type,
      };

      return h
        .response({
          statusCode: 200,
          message: 'User created successfully',
          data: userObj,
        })
        .code(200);
    } catch (error) {
      request.logger.error('error in AuthController.createUser', error);
      throw new Boom.Boom(error, { statusCode: 500 });
    }
  }

  /**
   * This function is used to create new user in database
   * @param {Hapi request obj} request
   * @param {hapi handler} h
   */
  static async login(request, h) {
    try {
      const email = request.payload.email;
      const password = request.payload.password;
      const type = request.payload.type;
      const user = await User.findOne({ email, type });
      if (!user) {
        return h.response({
          statusCode: 404,
          message: 'User account or password invalid',
        });
      }
      if (!user.validPassword(password)) {
        // password did not match
        return h.response({
          statusCode: 404,
          message: 'User account or password invalid',
        });
      } else {
        // password matched. proceed forward
        const secret = process.env.SECRET_KEY;
        const scopes = type;

        const tokenId = await jwt.sign(
          { id: user._id, email: user.email, type: type, scope: scopes },
          secret,
          { algorithm: 'HS256', expiresIn: '24h' },
        );

        const userObj = {
          _id: user._id,
          email: user.email,
          type: user.type,
          token_id: tokenId,
        };
        return h.response({
          statusCode: 200,
          message: 'user logged in successfully',
          data: { userObj },
        });
      }
    } catch (error) {
      request.logger.error('error in AuthController.createUser', error);
      throw new Boom.Boom(error, { statusCode: 500 });
    }
  }

  /**
   * This function is used to type of user can access it
   * @param {Hapi request obj} request
   * @param {hapi handler} h
   */
  static async accessed(request, h) {
    try {
      return h.response({
        statusCode: 200,
        message: 'You can access it',
        data: {},
      });
    } catch (error) {
      request.logger.error('error in AuthController.accessed', error);
      throw new Boom.Boom(error, { statusCode: 500 });
    }
  }
}

module.exports = AuthController;
