const { body } = require('express-validator');
const User = require('../models/user');

exports.validateSignup = [
    body('email')
        .isEmail()
        .withMessage('Please enter a valid email address')
        .custom(async (email) => {
            const user = await User.findOne({ email });
            if (user) {
                throw new Error('Email already exists');
            }
        })
        .normalizeEmail(),
    body('password')
        .trim()
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
    body('name')
        .trim()
        .isLength({ min: 3 })
        .withMessage('Name must be at least 3 characters long')
        .matches(/^[a-zA-Z\s]+$/)
        .withMessage('Name must contain only letters and spaces')
];

exports.validateLogin = [
    body('email')
        .isEmail()
        .withMessage('Please enter a valid email address')
        .normalizeEmail(),
    body('password')
        .trim()
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long')
];

exports.validateStatusUpdate = [
    body('status')
        .trim()
        .isLength({ min: 1, max: 200 })
        .withMessage('Status must be between 1 and 200 characters')
        .escape()
];
