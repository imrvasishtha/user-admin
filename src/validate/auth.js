const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi); // extend Joi with joi objectId

module.exports = {
  /* create user validation */
  createUser: Joi.object({
    email: Joi.string()
      .email()
      .required(),
    password: Joi.string().required(),
    confirmPassword: Joi.string().required(),
  }),

  login: Joi.object({
    email: Joi.string()
      .email()
      .required(),
    password: Joi.string().required(),
    type: Joi.string()
      .valid('user', 'admin', 'owner')
      .required(),
  }),
};
