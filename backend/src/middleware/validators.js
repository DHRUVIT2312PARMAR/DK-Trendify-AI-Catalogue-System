const Joi = require('joi');

const emailField = Joi.string()
  .trim()
  .lowercase()
  .email({ tlds: { allow: false } });

const signupSchema = Joi.object({
  name: Joi.string().min(2).max(80).required(),
  email: emailField.required(),
  password: Joi.string().min(8).max(128).required(),
  role: Joi.string().valid('Admin', 'Seller').default('Seller'),
});

const loginSchema = Joi.object({
  email: emailField.required(),
  password: Joi.string().required(),
});

const profitSchema = Joi.object({
  costPrice: Joi.number().positive().required(),
  commissionRate: Joi.number().min(0).max(100).default(12),
  targetMargin: Joi.number().min(1).max(300).default(35),
});

function validateBody(schema) {
  return (request, response, next) => {
    const { error, value } = schema.validate(request.body, { abortEarly: false, stripUnknown: true });

    if (error) {
      return response.status(400).json({
        success: false,
        message: error.details.map((detail) => detail.message).join(', '),
      });
    }

    request.body = value;
    return next();
  };
}

module.exports = {
  signupSchema,
  loginSchema,
  profitSchema,
  validateBody,
};
