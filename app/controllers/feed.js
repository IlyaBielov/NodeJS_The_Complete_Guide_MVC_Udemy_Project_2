exports.getPosts = (req, res, next) => {
  res.status(200).json({
      posts: [
          {
              id: new Date().getTime(),
              title: 'Sample Post',
              content: 'This is a sample post content.'
          }
      ]
  });
};


exports.createPost = (req, res, next) => {
    const { title, content } = req.body;

    res.status(201).json({
        message: 'Post created successfully',
        post: { id: new Date().getTime(), title, content }
    })
};
