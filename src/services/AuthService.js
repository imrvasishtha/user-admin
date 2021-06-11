const User = require('../models/user');
const JWTDecode = require('jwt-decode');
const Boom = require('@hapi/boom');

// all auth services
class AuthService {
  static async isRoleExist(request, role) {
    const tokenId = request.headers.authorization;
    const decoded = JWTDecode(tokenId);

    const currentTime = parseInt(new Date().getTime() / 1000);
    if (decoded.exp < currentTime) {
      throw new Boom.Boom('Unauthorized access', { statusCode: 401 });
    }
    if (role === decoded.type) {
      return true;
    } else if (role === 'admin' && decoded.type === 'owner') {
      return true;
    }
    throw new Boom.Boom('Unauthorized access', { statusCode: 401 });
  }

  // creating new user
  async createUser(userObj) {
    var newUser = new User({
      email: userObj.email,
      type: 'user',
    });

    newUser.password = newUser.generateHash(userObj.password);
    const result = await newUser.save();
    return result;
  }
}

module.exports = AuthService;
