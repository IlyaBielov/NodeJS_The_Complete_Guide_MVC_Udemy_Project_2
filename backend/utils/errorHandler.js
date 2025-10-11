// Custom Error Classes
class ValidationError extends Error {
    constructor(message, errors = []) {
        super(message);
        this.name = 'ValidationError';
        this.statusCode = 422;
        this.errors = errors;
    }
}

class AuthenticationError extends Error {
    constructor(message = 'Authentication failed') {
        super(message);
        this.name = 'AuthenticationError';
        this.statusCode = 401;
    }
}

class AuthorizationError extends Error {
    constructor(message = 'Not authorized to perform this action') {
        super(message);
        this.name = 'AuthorizationError';
        this.statusCode = 403;
    }
}

class NotFoundError extends Error {
    constructor(message = 'Resource not found') {
        super(message);
        this.name = 'NotFoundError';
        this.statusCode = 404;
    }
}

class ServerError extends Error {
    constructor(message = 'Internal server error') {
        super(message);
        this.name = 'ServerError';
        this.statusCode = 500;
    }
}

// Error Handler Function
const handleError = (err, next) => {
    if (!err.statusCode) err.statusCode = 500;
    next(err);
};

// Express Error Middleware
const errorMiddleware = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    
    // Log error for debugging
    console.error(`Error ${statusCode}: ${message}`);
    if (process.env.NODE_ENV !== 'production') {
        console.error(err.stack);
    }
    
    // Response structure
    const errorResponse = {
        success: false,
        error: {
            message: message,
            statusCode: statusCode
        }
    };
    
    // Add validation errors if present
    if (err.name === 'ValidationError' && err.errors) {
        errorResponse.error.validationErrors = err.errors;
    }
    
    // Add data if present (for express-validator errors)
    if (err.data) {
        errorResponse.error.validationErrors = err.data;
    }
    
    // Don't expose stack trace in production
    if (process.env.NODE_ENV !== 'production') {
        errorResponse.error.stack = err.stack;
    }
    
    res.status(statusCode).json(errorResponse);
};

module.exports = {
    handleError,
    errorMiddleware,
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    NotFoundError,
    ServerError
};
