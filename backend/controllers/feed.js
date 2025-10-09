const { validationResult } = require('express-validator');
const Post = require('../models/post');
const handleError = require('../utils/errorHandler');

exports.getPosts = (req, res, next) => {
    Post.find()
        .then(posts => {
            res.status(200).json({
                posts: posts
            })
        })
        .catch(err => handleError(err, next))
};

exports.getPost = (req, res, next) => {
    const postId = req.params.postId;
    Post.findById(postId)
        .then(post => {
            if (!post) {
                const error = new Error('Could not find post.');
                error.statusCode = 404;
                throw error;
            }
            res.status(200).json({
                message: 'Post found successfully',
                post: post
            })
        })
        .catch(err => handleError(err, next))
}

exports.createPost = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        const error = new Error('Validation failed, entered data is incorrect!');
        error.statusCode = 422;
        throw error;
    }

    const { title, content } = req.body;
    const post = new Post({
        title,
        content,
        imageUrl: 'images/naruto.png',
        creator: {
            name: 'Naruto Uzumaki',
        }
    })
    post.save()
        .then(result => {
            return res.status(201).json({
                message: 'Post created successfully',
                post: result
            })
        })
        .catch(err => handleError(err, next))
};
