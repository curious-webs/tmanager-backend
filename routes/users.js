const express = require ('express');
const app = express ();
const router = express.Router ();
const auth = require ('../middleware/auth');

// Controllers
let user_controller = require ('../controllers/usersController');

router.post ('/signup', user_controller.user_signup);

router.post ('/signin', user_controller.user_signin);

router.get ('/verifyAdminEmail', auth, user_controller.user_admin_verify);
router.get (
  '/resendAdminVerificationEmail',
  user_controller.user_admin_verify_resend
);

router.get ('/forgot-password', user_controller.user_forgot_password);

router.put ('/reset-password', auth, user_controller.user_reset_password);

router.get ('/isTokenValid', auth, user_controller.user_valid_token);

router.get ('/logout', auth, user_controller.user_logout);

module.exports = router;


 