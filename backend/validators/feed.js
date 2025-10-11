const { body, param } = require('express-validator');

exports.validateCreatePost = [
    body('title')
        .trim()
        .isLength({ min: 5, max: 100 })
        .withMessage('Title must be between 5 and 100 characters')
        .matches(/^[a-zA-Z0-9\s\-_.,!?]+$/)
        .withMessage('Title contains invalid characters')
        .escape(),
    body('content')
        .trim()
        .isLength({ min: 5, max: 2000 })
        .withMessage('Content must be between 5 and 2000 characters')
        .escape()
];

exports.validateUpdatePost = [
    param('postId')
        .isMongoId()
        .withMessage('Invalid post ID format'),
    body('title')
        .trim()
        .isLength({ min: 5, max: 100 })
        .withMessage('Title must be between 5 and 100 characters')
        .matches(/^[a-zA-Z0-9\s\-_.,!?]+$/)
        .withMessage('Title contains invalid characters')
        .escape(),
    body('content')
        .trim()
        .isLength({ min: 5, max: 2000 })
        .withMessage('Content must be between 5 and 2000 characters')
        .escape()
];

exports.validateGetPost = [
    param('postId')
        .isMongoId()
        .withMessage('Invalid post ID format')
];

exports.validateDeletePost = [
    param('postId')
        .isMongoId()
        .withMessage('Invalid post ID format')
];

exports.validatePagination = [
    body('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer')
        .toInt()
];
