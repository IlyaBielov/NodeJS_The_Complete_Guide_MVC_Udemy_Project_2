const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/user');
const { handleError } = require("../utils/errorHandler");

exports.signup = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        const error = new Error('Validation failed, entered data is incorrect!');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }

    const { email, password, name } = req.body;

    bcrypt.hash(password, 12)
        .then(hashedPassword => {
            const user = new User({ email, password: hashedPassword, name });
            return user.save();
        })
        .then(result => {
            res.status(201).json({
                message: 'User created',
                userId: result._id
            });
        })
        .catch(err => handleError(err, next));


};

exports.login = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        const error = new Error('Validation failed, entered data is incorrect!');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }

    const { email, password } = req.body;
    let loadedUser;

    User.findOne({ email })
        .then(user => {
            if (!user) {
                const error = new Error('Invalid email or password');
                error.statusCode = 401;
                throw error;
            }
            loadedUser = user;

            return bcrypt.compare(password, user.password)
        })
        .then(doMatch => {
            if (!doMatch) {
                const error = new Error('Invalid email or password');
                error.statusCode = 401;
                throw error;

            }

            const token = jwt.sign({
                    email: loadedUser.email,
                    userId: loadedUser._id.toString()
                },
                process.env.JWT_SECRET,
                { expiresIn: '1h' });

            res.status(200).json({
                message: 'Login successful',
                token: token,
                userId: loadedUser._id.toString()
            });

        })
        .catch(err => handleError(err, next));
}

exports.getStatus = (req, res, next) => {
    User.findById(req.userId)
        .then(user => {
            if (!user) {
                const error = new Error('User not found.');
                error.statusCode = 404;
                throw error;
            }
            res.status(200).json({
                status: user.status
            });
        })
        .catch(err => handleError(err, next));
}

exports.updateStatus = (req, res, next) => {
    const newStatus = req.body.status;
    
    User.findById(req.userId)
        .then(user => {
            if (!user) {
                const error = new Error('User not found.');
                error.statusCode = 404;
                throw error;
            }
            user.status = newStatus;
            return user.save();
        })
        .then(() => {
            res.status(200).json({
                message: 'Status updated successfully'
            });
        })
        .catch(err => handleError(err, next));
}
