const fs = require('fs');
const path = require('path');

const { validationResult } = require('express-validator');
const Post = require('../models/post');
const User = require('../models/user');
const { handleError } = require('../utils/errorHandler');

exports.getPosts = async (req, res, next) => {
    try {
        const currentPage = parseInt(req.query.page) || 1;
        const postsPerPage = 2;

        const totalPosts = await Post.find().countDocuments();
        const posts = await Post.find()
            .skip((currentPage - 1) * postsPerPage)
            .limit(postsPerPage);

        res.status(200).json({
            posts: posts,
            totalItems: totalPosts
        });
    } catch (err) {
        handleError(err, next);
    }
};

exports.getPost = async (req, res, next) => {
    try {
        const postId = req.params.postId;
        const post = await Post.findById(postId);
        if (!post) {
            const error = new Error('Could not find post.');
            error.statusCode = 404;
            throw error;
        }
        res.status(200).json({
            message: 'Post found successfully',
            post: post
        });
    } catch (err) {
        handleError(err, next);
    }
}

exports.createPost = async (req, res, next) => {
    try {
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
        });

        await post.save();
        const user = await User.findById(req.userId);
        creator = user;
        user.posts.push(post);
        await user.save();

        res.status(201).json({
            message: 'Post created successfully',
            post: post,
            creator: {
                _id: creator._id,
                name: creator.name,
            }
        });
    } catch (err) {
        handleError(err, next);
    }
};

exports.updatePost = async (req, res, next) => {
    try {
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

        const post = await Post.findById(postId);
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
        const result = await post.save();
        return res.status(200).json({
            message: 'Post updated successfully',
            post: result
        });
    } catch (err) {
        handleError(err, next);
    }
}

exports.deletePost = async (req, res, next) => {
    try {
        const postId = req.params.postId;

        const post = await Post.findById(postId);
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
        await Post.findByIdAndDelete(postId);

        const user = await User.findById(req.userId);
        user.posts.pull(postId);
        await user.save();

        return res.status(200).json({ message: 'Post deleted successfully' });
    } catch (err) {
        handleError(err, next);
    }
};

const clearImage = (imagePath) => {
    imagePath = path.join(__dirname, '..', imagePath);
    fs.unlink(imagePath, (err) => {
        if (err) {
            console.log(err);
        }
    });
}


