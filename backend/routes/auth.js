const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

const User = require('../models/user');
const authController = require('../controllers/auth');
const isAuth = require('../middleware/is-auth');

router.post('/signup', [
    body('email')
        .isEmail()
        .withMessage('Please enter a valid email address')
        .custom((email) => {
            return User.findOne({ email })
                .then(user => {
                    if (user) {
                        return Promise.reject('Email already exists');
                    }
                })
         })
        .normalizeEmail(),
    body('password').trim().isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('name').trim().isLength({ min: 3 }).withMessage('Name must be at least 3 characters long')
], authController.signup);

router.post('/login', [
    body('email').isEmail().withMessage('Please enter a valid email address').normalizeEmail(),
    body('password').trim().isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
], authController.login)

router.get('/status', isAuth, authController.getStatus);

router.put('/status', isAuth, authController.updateStatus);

module.exports = router;
