const User = require('../models/user');

class UserService {
  /**
   * Get User data from the help of curl request from activate_im server
   * @param {*} jwtToken
   * @param {*} loggedUserEmail
   */
  async getUserProfile(jwtToken, loggedUserEmail) {
    global.logger().info('getUserProfile method called!');

    const user = await User.findOne({ loggedUserEmail });
    return user;
  }
}

module.exports = UserService;
