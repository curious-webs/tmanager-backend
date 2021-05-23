const {User, validate, generateAuthToken} = require ('../models/users');
const _ = require ('lodash');
const bcrypt = require ('bcrypt');
const {sendEmail} = require ('../routes/email');
const logger = require ('../libs/loggerLib');
const response = require ('../libs/responseLib');
const {jwtr} = require ('../common/common');

exports.user_signup = async function (req, res) {
  console.log (req.body);
  let apiResponse = {};
  let errorDetail = {};
  const {error} = validate (_.pick (req.body, ['email', 'password']));
  if (error) return res.status (400).send (error.details);

  if (req.body.apiKey != process.env.API_KEY) {
    errorDetail = {
      email: 'apiKey is not valid',
    };
    logger.error ('apiKey is not valid', 'Sign Up Route : /signup', 10);
    apiResponse = response.generate (
      true,
      'Invalid apiKey',
      400,
      errorDetail,
      req.body
    );
    return res.send (apiResponse);
  }

  let user = await User.findOne ({
    email: req.body.email,
  });
  if (user) {
    errorDetail = {
      email: 'already exist',
    };
    logger.error ('Email already exist', 'Sign Up Route : /signup', 10);
    apiResponse = response.generate (
      true,
      'Email already exist',
      401,
      errorDetail,
      req.body
    );
    return res.status (401).send (apiResponse);
  }

  req.body['role'] = 'oAdmin';
  user = new User (_.pick (req.body, ['email', 'password', 'role']));

  const salt = await bcrypt.genSalt (10);
  user.password = await bcrypt.hash (user.password, salt);

  await user.save ();

  const token = await user.generateAuthToken ();
  let subject = 'Verification Email - tManager';
  let isMailSent = sendEmail (user, token, subject, 'verify_email');

  if (!isMailSent) {
    logger.error (
      'Mail sent failed',
      'Signup Route : /signup',
      10
    );
    apiResponse = response.generate (
      true,
      'something went wrong',
      500,
      null,
      null
    );
  }
  apiResponse = response.generate (
    false,
    'email sent successfully',
    200,
    null,
    _.pick (user, ['_id', 'email', 'isVerified'])
  );
  return res.header ('x-auth-token', token).send (apiResponse);
};

exports.user_admin_verify = async (req, res) => {
  console.log(" user admin verify function ");
  let isUpdated = await User.findByIdAndUpdate (
    {
      _id: req.user._id,
    },
    {
      isEmailVerified: true,
    },
    {
      new: true,
      runValidators: true,
    }
  );
  console.log(" is user updated ");
  const user = await User.findById (req.user._id).select ('-password');
  let apiResponse = response.generate (false, 'success', 200, null, user);
  console.log(" is apiResponse  generated ");
 // const isTokenDestroy = await jwtr.destroy (String (req.user.jti));
  console.log(" is token  destroyed ");
  return res.send (apiResponse);
};

exports.user_admin_verify_resend = async (req, res) => {
  //  console.log(req.query.email);
  //  console.log(req.params);
  let user = await User.findOne ({
    email: req.query.email,
  });
  if (!user) {
    apiResponse = response.generate (
      true,
      'user not found',
      400,
      null,
      req.body
    );
    return res.status (400).send (apiResponse);
  }
  const token = await user.generateAuthToken ();
  let subject = 'Verification - tManager Web';
  let isMailSent = sendEmail (user, token, subject, 'verify_email');
  if (!isMailSent) {
    logger.error ('Mail sent failed', 'Sign Up Route : /signup', 10);
    apiResponse = response.generate (
      true,
      'something went wrong',
      500,
      null,
      null
    );
  }
  user.isVerified = false;
  apiResponse = response.generate (
    false,
    'email sent successfully',
    200,
    null,
    _.pick (user, ['_id', 'userName', 'email', 'isVerified'])
  );
  return res.header ('x-auth-token', token).send (apiResponse);
};

exports.user_signin = async (req, res) => {
  console.log (req.body);
  let apiresponse = {};
  let errorDetail = {};
  console.log(req.body.email);
  let user = await User.findOne ({
    email: req.body.email,
  });

  if (!user) {
    logger.error ('User not found', 'Sign in Route : /signin', 10);
    errorDetail = {
      userName: 'not found',
    };
    apiResponse = response.generate (
      true,
      'user not found',
      400,
      errorDetail,
      req.body
    );
    return res.status (400).send (apiResponse);
  }

  const verifyPassword = await bcrypt.compare (
    req.body.password,
    user.password
  );

  if (!verifyPassword) {
    logger.error ('password invalid', 'Sign in Route : /signin', 10);
    errorDetail = {
      password: 'invalid',
    };
    apiResponse = response.generate (
      true,
      'invalid password',
      401,
      errorDetail,
      req.body
    );
    return res.status (401).send (apiResponse);
  }

  if (!user.isEmailVerified) {
    logger.error ('Email Not Verified', 'Sign in Route : /signin', 10);
    errorDetail = {
      isEmailVerified: false,
    };
    apiResponse = response.generate (
      true,
      'user not verified',
      403,
      errorDetail,
      req.body
    );
    return res.status (403).send (apiResponse);
  }

  const token = await user.generateAuthToken ();

  user = _.pick (user, ['_id', 'userName', 'email', 'isVerified']);

  apiResponse = response.generate (
    false,
    'login sucessfull',
    200,
    null,
    req.body
  );
  return res.header ('x-auth-token', token).send (apiResponse);
};

exports.user_forgot_password = async (req, res) => {
  let apiResponse = {};
  console.log ('apiResponse here goes');
  // console.log(req.params);
  // console.log(req.query);
  let user = await User.findOne ({
    email: req.query.email,
  }).select ('-password');
  if (!user) {
    logger.error (
      'User Not Found',
      'Forgot Password Route : /forgot-password',
      10
    );
    apiResponse = response.generate (
      true,
      'user not found',
      400,
      {
        errorDetail: {
          userName: 'not found',
        },
      },
      req.query.data
    );
    return res.status (400).send (apiResponse);
  }

  // const verifyPassword = await bcrypt.compare (
  //   req.body.password,
  //   user.password
  // );
  // if (!verifyPassword) return res.status (400).send ('invalid password');

  const token = await user.generateAuthToken ();
  console.log ('here goes token' + token);
  let subject = 'Reset Password - tManager Web';
  let isMailSent = sendEmail (user, token, subject, 'reset_password');

  if (!isMailSent) {
    logger.error (
      'Mail sent failed',
      'forgot-password Route : /forgot-password',
      10
    );
    apiResponse = response.generate (
      true,
      'something went wrong',
      500,
      null,
      null
    );
    return res.send (apiResponse);
  }
  apiResponse = response.generate (
    false,
    'email sent successfully',
    200,
    null,
    _.pick (user, ['_id', 'email', 'isVerified'])
  );
  return res.header ('x-auth-token', token).send (apiResponse);
};

exports.user_reset_password = async (req, res) => {
  
  let apiResponse = {};

  if (req.user.isVerified == false) {
    const isVerify = await User.findByIdAndUpdate (
      req.user._id,
      {
        isVerified: 'true',
      },
      {
        new: true,
        runValidators: true,
      }
    );
  }

  if (req.body.password == '' && req.body.confirmPassword == '') {
    apiResponse = response.generate (
      true,
      'required password and confirmPassword',
      500,
      {
        isVerified: true,
        isTokenDestroy: false,
      },
      req.body
    );
    return res.status (400).send (apiResponse);
  }

  // if (req.body.password) {
  //   let user = await User.findById (req.user._id);

  //   const verifyPassword = await bcrypt.compare (
  //     req.body.password,
  //     user.password
  //   );
  //   console.log ('verify passwod');
  //   console.log (verifyPassword);
    // if (!verifyPassword) return res.status (400).send ('invalid password');

  //   if (verifyPassword) {
  //     logger.error (
  //       'Password can not be same as old password',
  //       'reset-password Route : /reset-password',
  //       10
  //     );
  //     apiResponse = response.generate (
  //       true,
  //       'password can not be same as old password',
  //       500,
  //       {
  //         password: 'can not be same as old password',
  //       },
  //       req.body
  //     );
  //     return res.status (400).send (apiResponse);
  //   }
   //}

  console.log (req.body.confirmPassword);
  if (req.body.password !== req.body.confirmPassword) {
    logger.error (
      'password and confirm password should be same',
      'reset-password Route : /reset-password',
      10
    );
    apiResponse = response.generate (
      true,
      'password and confirm password should be same',
      403,
      {
        // password: 'should be same',
        confirmPassword: 'should be same',
      },
      req.body
    );

    return res.status (403).send (apiResponse);
  }

  const salt = await bcrypt.genSalt (10);
  req.body.password = await bcrypt.hash (req.body.password, salt);

  let isUpdated = await User.findByIdAndUpdate (
    {
      _id: req.user._id,
    },
    {
      password: req.body.password,
    },
    {
      new: true,
      runValidators: true,
    }
  );
  isUpdated = _.pick (isUpdated, ['userName', '_id', 'email', 'isVerified']);
  isUpdated.passwordUpdated = 'true';

  apiResponse = response.generate (
    false,
    'password updated successfully',
    200,
    null,
    isUpdated
  );
  const isTokenDestroy = await jwtr.destroy (String (req.user.jti));
  console.log ('token destriy');
  console.log (isTokenDestroy); 
  return res.send (apiResponse);
};

exports.user_logout = async (req, res) => {
  const isTokenDestroy = await jwtr.destroy (String (req.user.jti));
  apiResponse = response.generate (false, 'logout sucess', 200, null, null);
  return res.send (apiResponse);
};

exports.user_valid_token = async (req, res) => {
  let apiResponse = response.generate (
    false,
    'Token is Valid',
    200,
    {isValid:true},
    null
  );
  return res.status(200).send (apiResponse);
};
