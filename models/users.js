const mongoose = require ('mongoose');
const {jwtr} = require ('../common/common');
const Joi = require ('joi');

let user_roles = ['webAdmin', 'oAdmin', 'oSubAdmin', 'oUser']; 

const userSchema = new mongoose.Schema ({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    maxlength: 1024,
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  role: {
    type: String,
    enum: user_roles,
    default: 'user',
  },
  firstName: {
    type: String,
    max: 20,
    min: 2,
  },
  lastName: {
    type: String,
    max: 20,
    min: 2,
  },
  phone: {
    type: String,
    default: '',
  },
  profileImg: {
    type: String,
  },
});
// Token Generation  
userSchema.methods.generateAuthToken = function () {
  const token = jwtr.sign (
    {
      _id: this._id,
      email: this.email,
      isVerified: this.isVerified,
      role: this.role, 
    }, 
    process.env.AUTH_TOKEN_KEY
  );  
console.log("token val");
console.log(process.env.AUTH_TOKEN_KEY);
  return token;
};
const User = mongoose.model ('Users', userSchema);



function validateUserInputs (user) {
  const schema = Joi.object ({
    email: Joi.string ().email ().required (),
    password: Joi.string ()
      .min (6)
      .regex (/^(?=.*[!@#\$%\^&\*])(?=.{6,})/)
      .required ()
      .messages ({
        'string.pattern.base': 'must have length 6 and one special character',
      }),
  });

  return schema.validate (user, {abortEarly: false});
}

module.exports.User = User;
module.exports.validate = validateUserInputs;
