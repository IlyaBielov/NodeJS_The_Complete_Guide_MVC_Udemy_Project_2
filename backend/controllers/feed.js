const fs = require('fs');
const path = require('path');

const { validationResult } = require('express-validator');
const Post = require('../models/post');
const User = require('../models/user');
const handleError = require('../utils/errorHandler');

exports.getPosts = (req, res, next) => {
    const currentPage = parseInt(req.query.page) || 1;
    const postsPerPage = 2;
    let totalPosts;

    Post.find().countDocuments()
        .then(count => {
            totalPosts = count;
            return Post.find()
                .skip((currentPage - 1) * postsPerPage)
                .limit(postsPerPage);
        })
        .then(posts => {
            res.status(200).json({
                posts: posts,
                totalItems: totalPosts
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

    if (!req.file) {
        const error = new Error('Please upload an image.');
        error.statusCode = 422;
        throw error;
    }

    const imageUrl = req.file.path;
    const { title, content } = req.body;
    let creator;
    const post = new Post({
        title,
        content,
        imageUrl: imageUrl,
        creator: req.userId
    })
    post.save()
        .then(() => User.findById(req.userId))
        .then(user => {
            creator = user;
            user.posts.push(post);
            return user.save();
        })
        .then(() => {
            res.status(201).json({
                message: 'Post created successfully',
                post: post,
                creator: {
                    _id: creator._id,
                    name: creator.name,
                }
            })
        })
        .catch(err => handleError(err, next))
};

exports.updatePost = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        const error = new Error('Validation failed, entered data is incorrect!');
        error.statusCode = 422;
        throw error;
    }

    const postId = req.params.postId;
    const title = req.body.title;
    const content = req.body.content;
    let imageUrl = req.body.image;

    if (req.file) {
        imageUrl = req.file.path;
    }
    if (!imageUrl) {
        const error = new Error('Please upload an image.');
        error.statusCode = 422;
        throw error;
    }

    Post.findById(postId)
        .then(post => {
            if (!post) {
                const error = new Error('Could not find post.');
                error.statusCode = 404;
                throw error;
            }

            if (post.creator.toString() !== req.userId) {
                const error = new Error('You are not authorized to update this post.');
                error.statusCode = 403;
                throw error;
            }

            if (imageUrl !== post.imageUrl) {
                clearImage(post.imageUrl);
            }

            post.title = title;
            post.content = content;
            post.imageUrl = imageUrl;
            post.save()
                .then(result => {
                    return res.status(200).json({
                        message: 'Post updated successfully',
                        post: result
                    })
                })
        })
        .catch(err => handleError(err, next))
}

exports.deletePost = (req, res, next) => {
    const postId = req.params.postId;

    Post.findById(postId)
        .then(post => {
            if (!post) {
                const error = new Error('Could not find post.');
                error.statusCode = 404;
                throw error;
            }

            if (post.creator.toString() !== req.userId) {
                const error = new Error('You are not authorized to update this post.');
                error.statusCode = 403;
                throw error;
            }

            clearImage(post.imageUrl);
            return Post.findByIdAndDelete(postId)
        })
        .then(() => User.findById(req.userId))
        .then(user => {
            user.posts.pull(postId);
            return user.save();
        })
        .then(() => res.status(200).json({ message: 'Post deleted successfully' }))
        .catch(err => handleError(err, next))

};

const clearImage = (imagePath) => {
    imagePath = path.join(__dirname, '..', imagePath);
    fs.unlink(imagePath, (err) => {
        if (err) {
            console.log(err);
        }
    });
}


