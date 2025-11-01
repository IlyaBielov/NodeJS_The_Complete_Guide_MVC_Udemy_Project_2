const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/user');
const { handleError } = require("../utils/errorHandler");

exports.signup = async (req, res, next) => {
    try {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            const error = new Error('Validation failed, entered data is incorrect!');
            error.statusCode = 422;
            error.data = errors.array();
            throw error;
        }

        const { email, password, name } = req.body;

        const hashedPassword = await bcrypt.hash(password, 12);
        const user = new User({ email, password: hashedPassword, name });
        const result = await user.save();

        res.status(201).json({
            message: 'User created',
            userId: result._id
        });
    } catch (err) {
        handleError(err, next);
    }
};

exports.login = async (req, res, next) => {
    try {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            const error = new Error('Validation failed, entered data is incorrect!');
            error.statusCode = 422;
            error.data = errors.array();
            throw error;
        }

        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            const error = new Error('Invalid email or password');
            error.statusCode = 401;
            throw error;
        }

        const doMatch = await bcrypt.compare(password, user.password);
        if (!doMatch) {
            const error = new Error('Invalid email or password');
            error.statusCode = 401;
            throw error;
        }

        const token = jwt.sign(
            {
                email: user.email,
                userId: user._id.toString()
            },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.status(200).json({
            message: 'Login successful',
            token: token,
            userId: user._id.toString()
        });
    } catch (err) {
        handleError(err, next);
    }
}

exports.getStatus = async (req, res, next) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            const error = new Error('User not found.');
            error.statusCode = 404;
            throw error;
        }
        res.status(200).json({
            status: user.status
        });
    } catch (err) {
        handleError(err, next);
    }
}

exports.updateStatus = async (req, res, next) => {
    try {
        const newStatus = req.body.status;
        const user = await User.findById(req.userId);
        if (!user) {
            const error = new Error('User not found.');
            error.statusCode = 404;
            throw error;
        }
        user.status = newStatus;
        await user.save();
        res.status(200).json({
            message: 'Status updated successfully'
        });
    } catch (err) {
        handleError(err, next);
    }
}
