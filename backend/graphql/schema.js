const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/user');
const Post = require('../models/post');

const {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLString,
  GraphQLID,
  GraphQLInt,
  GraphQLNonNull,
  GraphQLList,
  GraphQLInputObjectType,
} = require('graphql');

const UserType = new GraphQLObjectType({
    name: 'User',
    fields: () => ({
        _id: { type: new GraphQLNonNull(GraphQLID) },
        email: { type: new GraphQLNonNull(GraphQLString) },
        name: { type: new GraphQLNonNull(GraphQLString) },
        password: { type: GraphQLString },
        status: { type: GraphQLString },
        posts: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(PostType))) },
    }),
});

const PostType = new GraphQLObjectType({
    name: 'Post',
    fields: () => ({
        _id: { type: new GraphQLNonNull(GraphQLID) },
        title: { type: new GraphQLNonNull(GraphQLString) },
        imageUrl: { type: new GraphQLNonNull(GraphQLString) },
        content: { type: new GraphQLNonNull(GraphQLString) },
        creator: { type: new GraphQLNonNull(UserType) },
        createdAt: { type: new GraphQLNonNull(GraphQLString) },
        updatedAt: { type: new GraphQLNonNull(GraphQLString) },
    }),
});

const PostDataType = new GraphQLObjectType({
    name: 'PostData',
    fields: {
        posts: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(PostType))) },
        totalPosts: { type: new GraphQLNonNull(GraphQLInt) },
    },
});

const AuthDataType = new GraphQLObjectType({
    name: 'AuthData',
    fields: {
        token: { type: new GraphQLNonNull(GraphQLString) },
        userId: { type: new GraphQLNonNull(GraphQLString) },
    },
});

const UserInputType = new GraphQLInputObjectType({
    name: 'UserInput',
    fields: {
        email: { type: new GraphQLNonNull(GraphQLString) },
        name: { type: new GraphQLNonNull(GraphQLString) },
        password: { type: new GraphQLNonNull(GraphQLString) },
    },
});

const PostInputType = new GraphQLInputObjectType({
    name: 'PostInput',
    fields: {
        title: { type: new GraphQLNonNull(GraphQLString) },
        content: { type: new GraphQLNonNull(GraphQLString) },
        imageUrl: { type: new GraphQLNonNull(GraphQLString) },
    },
});

// Auth helper — reads req.isAuth / req.userId set by middleware/auth.js
function requireAuth(context) {
    const req = context.request;
    if (!req.isAuth) {
        const error = new Error('Not authenticated');
        error.code = 401;
        throw error;
    }
    return req.userId;
}

// ─── Queries ─────────────────────────────────────────────

const RootQueryType = new GraphQLObjectType({
    name: 'Query',
    fields: {
        login: {
            args: {
                email: { type: new GraphQLNonNull(GraphQLString) },
                password: { type: new GraphQLNonNull(GraphQLString) },
            },
            type: AuthDataType,
            resolve: async (parent, { email, password }) => {
                const user = await User.findOne({ email });
                if (!user) throw new Error('User not found');

                const isPasswordValid = await bcrypt.compare(password, user.password);
                if (!isPasswordValid) throw new Error('Invalid password');

                const token = jwt.sign(
                    { userId: user._id.toString(), email: user.email },
                    process.env.JWT_SECRET,
                    { expiresIn: '1h' }
                );

                return { token, userId: user._id.toString() };
            },
        },
        posts: {
            args: { page: { type: GraphQLInt } },
            type: PostDataType,
            resolve: async (parent, { page }, context) => {
                requireAuth(context);
                const currentPage = page || 1;
                const perPage = 2;
                const totalPosts = await Post.countDocuments();
                const posts = await Post.find()
                    .sort({ createdAt: -1 })
                    .populate('creator', 'name')
                    .skip((currentPage - 1) * perPage)
                    .limit(perPage);
                return {
                    posts: posts.map(p => ({
                        ...p._doc,
                        _id: p._id.toString(),
                        createdAt: p.createdAt.toISOString(),
                        updatedAt: p.updatedAt.toISOString(),
                    })),
                    totalPosts,
                };
            },
        },
        post: {
            args: { id: { type: new GraphQLNonNull(GraphQLID) } },
            type: PostType,
            resolve: async (parent, { id }, context) => {
                requireAuth(context);
                const post = await Post.findById(id).populate('creator', 'name');
                if (!post) {
                    const error = new Error('Post not found');
                    error.code = 404;
                    throw error;
                }
                return {
                    ...post._doc,
                    _id: post._id.toString(),
                    createdAt: post.createdAt.toISOString(),
                    updatedAt: post.updatedAt.toISOString(),
                };
            },
        },
        status: {
            type: GraphQLString,
            resolve: async (parent, args, context) => {
                const userId = requireAuth(context);
                const user = await User.findById(userId);
                if (!user) throw new Error('User not found');
                return user.status;
            },
        },
    },
});

// ─── Mutations ───────────────────────────────────────────

const RootMutationType = new GraphQLObjectType({
    name: 'Mutation',
    fields: {
        createUser: {
            type: UserType,
            args: { userInput: { type: UserInputType } },
            resolve: async (parent, { userInput }) => {
                const errors = [];
                if (!validator.isEmail(userInput.email)) {
                    errors.push({ message: 'Invalid email' });
                }
                if (validator.isEmpty(userInput.password) || !validator.isLength(userInput.password, { min: 5 })) {
                    errors.push({ message: 'Password must be at least 5 characters long' });
                }
                if (errors.length > 0) {
                    const error = new Error('Validation failed');
                    error.data = errors;
                    error.code = 422;
                    throw error;
                }

                const existingUser = await User.findOne({ email: userInput.email });
                if (existingUser) {
                    const error = new Error('User already exists');
                    error.code = 422;
                    throw error;
                }

                const hashedPassword = await bcrypt.hash(userInput.password, 12);
                const user = new User({
                    email: userInput.email,
                    name: userInput.name,
                    password: hashedPassword,
                    status: 'I am new',
                    posts: [],
                });

                const createdUser = await user.save();
                return { ...createdUser._doc, _id: createdUser._id.toString() };
            },
        },
        createPost: {
            type: PostType,
            args: { postInput: { type: PostInputType } },
            resolve: async (parent, { postInput }, context) => {
                const userId = requireAuth(context);

                const errors = [];
                if (validator.isEmpty(postInput.title) || !validator.isLength(postInput.title, { min: 5 })) {
                    errors.push({ message: 'Title must be at least 5 characters long' });
                }
                if (validator.isEmpty(postInput.content) || !validator.isLength(postInput.content, { min: 5 })) {
                    errors.push({ message: 'Content must be at least 5 characters long' });
                }
                if (errors.length > 0) {
                    const error = new Error('Validation failed');
                    error.data = errors;
                    error.code = 422;
                    throw error;
                }

                const creator = await User.findById(userId);
                if (!creator) {
                    const error = new Error('User not found');
                    error.code = 401;
                    throw error;
                }

                const post = new Post({
                    title: postInput.title,
                    content: postInput.content,
                    imageUrl: postInput.imageUrl,
                    creator,
                });

                const createdPost = await post.save();
                creator.posts.push(createdPost);
                await creator.save();

                return {
                    ...createdPost._doc,
                    _id: createdPost._id.toString(),
                    createdAt: createdPost.createdAt.toISOString(),
                    updatedAt: createdPost.updatedAt.toISOString(),
                };
            },
        },
        updatePost: {
            type: PostType,
            args: {
                id: { type: new GraphQLNonNull(GraphQLID) },
                postInput: { type: PostInputType },
            },
            resolve: async (parent, { id, postInput }, context) => {
                const userId = requireAuth(context);

                const post = await Post.findById(id).populate('creator', 'name');
                if (!post) {
                    const error = new Error('Post not found');
                    error.code = 404;
                    throw error;
                }
                if (post.creator._id.toString() !== userId) {
                    const error = new Error('Not authorized');
                    error.code = 403;
                    throw error;
                }

                const errors = [];
                if (validator.isEmpty(postInput.title) || !validator.isLength(postInput.title, { min: 5 })) {
                    errors.push({ message: 'Title must be at least 5 characters long' });
                }
                if (validator.isEmpty(postInput.content) || !validator.isLength(postInput.content, { min: 5 })) {
                    errors.push({ message: 'Content must be at least 5 characters long' });
                }
                if (errors.length > 0) {
                    const error = new Error('Validation failed');
                    error.data = errors;
                    error.code = 422;
                    throw error;
                }

                post.title = postInput.title;
                post.content = postInput.content;
                if (postInput.imageUrl !== 'undefined') {
                    post.imageUrl = postInput.imageUrl;
                }
                const updatedPost = await post.save();

                return {
                    ...updatedPost._doc,
                    _id: updatedPost._id.toString(),
                    createdAt: updatedPost.createdAt.toISOString(),
                    updatedAt: updatedPost.updatedAt.toISOString(),
                };
            },
        },
        deletePost: {
            type: GraphQLString,
            args: { id: { type: new GraphQLNonNull(GraphQLID) } },
            resolve: async (parent, { id }, context) => {
                const userId = requireAuth(context);
                const post = await Post.findById(id);
                if (!post) {
                    const error = new Error('Post not found');
                    error.code = 404;
                    throw error;
                }
                if (post.creator.toString() !== userId) {
                    const error = new Error('Not authorized');
                    error.code = 403;
                    throw error;
                }
                await Post.findByIdAndDelete(id);
                const user = await User.findById(userId);
                user.posts.pull(id);
                await user.save();
                return 'Post deleted';
            },
        },
        updateStatus: {
            type: GraphQLString,
            args: { status: { type: new GraphQLNonNull(GraphQLString) } },
            resolve: async (parent, { status }, context) => {
                const userId = requireAuth(context);
                const user = await User.findById(userId);
                if (!user) throw new Error('User not found');
                user.status = status;
                await user.save();
                return user.status;
            },
        },
    },
});

module.exports = new GraphQLSchema({
    query: RootQueryType,
    mutation: RootMutationType,
});
