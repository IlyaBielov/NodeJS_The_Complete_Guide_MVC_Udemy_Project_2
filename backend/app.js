require('dotenv').config({ quiet: true });
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');
const multer = require('multer');

const feedRouter = require('./routes/feed');
const authRouter = require('./routes/auth');
const { errorMiddleware } = require('./utils/errorHandler');

const app = express();

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

app.use(bodyParser.json());
app.use(multer({ storage: fileStorage, fileFilter: fileFilter }).single('image'));
app.use('/images', express.static(path.join(__dirname, 'images')));

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
})

app.use('/auth', authRouter);
app.use('/feed', feedRouter);

// Use the new comprehensive error middleware
app.use(errorMiddleware);

async function start() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const port = process.env.PORT || 8080;
        const server = app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });

        const io = require('./socket').init(server, {
            cors: {
                origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
                methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
                allowedHeaders: ['Content-Type', 'Authorization'],
                credentials: true
            }
        });

        io.on('connection', (socket) => {
            console.log('New client connected');

            socket.on('disconnect', (reason) => {
                console.log('Client disconnected:', reason);
            });
        });
    } catch (err) {
        console.log(err);
        process.exit(1);
    }
}

start();
