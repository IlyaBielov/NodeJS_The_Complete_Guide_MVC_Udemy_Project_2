require('dotenv').config({ quiet: true });
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { createHandler } = require('graphql-http/lib/use/express');
const auth = require('./middleware/auth');

const app = express();

// CORS must be handled BEFORE any body parser or other middleware so that
// preflight (OPTIONS) requests are short-circuited with 200 OK.
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

app.use(auth);

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images');
    },
    filename: (req, file, cb) => {
        cb(null, new Date().toISOString() + '-' + file.originalname);
    }
})

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
        cb(null, true);
    } else {
        cb(null, false);
    }
}

app.use(express.json());
app.use(multer({ storage: fileStorage, fileFilter: fileFilter }).single('image'));
app.use('/images', express.static(path.join(__dirname, 'images')));

app.put('/post-image', (req, res, next) => {
    if (!req.isAuth) {
        const error = new Error('Not authenticated!');
        error.statusCode = 401;
        return next(error);
    }
    if (!req.file) {
        return res.status(200).json({ message: 'No file provided.' });
    }
    if (req.body.oldPath) {
        clearImage(req.body.oldPath);
    }
    return res.status(201).json({ message: 'File stored.', filePath: req.file.path });
});

const clearImage = filePath => {
    const fullPath = path.join(__dirname, filePath);
    const imagesDir = path.join(__dirname, 'images');
    if (!fullPath.startsWith(imagesDir)) {
        return;
    }
    fs.unlink(fullPath, err => {
        if (err) console.log(err);
    });
};

app.all(
    '/graphql',
    createHandler({
        schema: require('./graphql/schema'),
        context: (req) => ({ request: req.raw }),
        formatError: (error) => {
            if (!error.originalError) {
                return error;
            }
            const data = error.originalError.data;
            const message = error.message || 'An error occurred.';
            const code = error.originalError.code || 500;
            return { message, status: code, data };
        }
    }));

async function start() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const port = process.env.PORT || 8080;
        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });
    } catch (err) {
        console.log(err);
        process.exit(1);
    }
}

start();
