const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth');
const isAuth = require('../middleware/is-auth');
const { validateSignup, validateLogin, validateStatusUpdate } = require('../validators/auth');

router.post('/signup', validateSignup, authController.signup);

router.post('/login', validateLogin, authController.login);

router.get('/status', isAuth, authController.getStatus);

router.put('/status', isAuth, validateStatusUpdate, authController.updateStatus);

module.exports = router;
