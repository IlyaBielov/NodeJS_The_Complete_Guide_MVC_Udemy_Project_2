const express = require('express');
const isAuth = require('../middleware/is-auth');

const feedController = require('../controllers/feed');
const { 
    validateCreatePost, 
    validateUpdatePost, 
    validateGetPost, 
    validateDeletePost 
} = require('../validators/feed');

const router = express.Router();

router.get('/posts', isAuth, feedController.getPosts);

router.get('/post/:postId', isAuth, validateGetPost, feedController.getPost);

router.post('/post', isAuth, validateCreatePost, feedController.createPost);

router.put('/post/:postId', isAuth, validateUpdatePost, feedController.updatePost);

router.delete('/post/:postId', isAuth, validateDeletePost, feedController.deletePost);

module.exports = router;

