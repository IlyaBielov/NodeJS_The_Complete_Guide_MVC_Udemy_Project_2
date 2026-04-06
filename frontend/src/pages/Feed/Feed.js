import React, { Component, Fragment } from 'react';

import Post from '../../components/Feed/Post/Post';
import Button from '../../components/Button/Button';
import FeedEdit from '../../components/Feed/FeedEdit/FeedEdit';
import Input from '../../components/Form/Input/Input';
import Paginator from '../../components/Paginator/Paginator';
import Loader from '../../components/Loader/Loader';
import ErrorHandler from '../../components/ErrorHandler/ErrorHandler';
import './Feed.css';

class Feed extends Component {
  state = {
    isEditing: false,
    posts: [],
    totalPosts: 0,
    editPost: null,
    status: '',
    postPage: 1,
    postsLoading: true,
    editLoading: false
  };

  componentDidMount() {
    fetch('http://localhost:8080/graphql', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + this.props.token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: '{ status }' })
    })
      .then(res => res.json())
      .then(resData => {
        if (resData.errors) throw new Error('Failed to fetch user status.');
        this.setState({ status: resData.data.status });
      })
      .catch(this.catchError);

    this.loadPosts();
  }

  loadPosts = direction => {
    if (direction) {
      this.setState({ postsLoading: true, posts: [] });
    }
    let page = this.state.postPage;
    if (direction === 'next') {
      page++;
      this.setState({ postPage: page });
    }
    if (direction === 'previous') {
      page--;
      this.setState({ postPage: page });
    }
    const graphqlQuery = {
      query: `
        query FetchPosts($page: Int) {
          posts(page: $page) {
            posts {
              _id
              title
              content
              imageUrl
              creator { name }
              createdAt
            }
            totalPosts
          }
        }
      `,
      variables: { page: page }
    };
    fetch('http://localhost:8080/graphql', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + this.props.token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(graphqlQuery)
    })
      .then(res => res.json())
      .then(resData => {
        if (resData.errors) throw new Error('Failed to fetch posts.');
        this.setState({
          posts: resData.data.posts.posts.map(post => ({
            ...post,
            imagePath: post.imageUrl,
          })),
          totalPosts: resData.data.posts.totalPosts,
          postsLoading: false
        });
      })
      .catch(this.catchError);
  };

  statusUpdateHandler = event => {
    event.preventDefault();
    fetch('http://localhost:8080/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + this.props.token
      },
      body: JSON.stringify({
        query: `
          mutation UpdateUserStatus($status: String!) {
            updateStatus(status: $status)
          }
        `,
        variables: { status: this.state.status }
      })
    })
      .then(res => res.json())
      .then(resData => {
        if (resData.errors) throw new Error("Can't update status!");
      })
      .catch(this.catchError);
  };

  newPostHandler = () => {
    this.setState({ isEditing: true });
  };

  startEditPostHandler = postId => {
    this.setState(prevState => {
      const loadedPost = { ...prevState.posts.find(p => p._id === postId) };

      return {
        isEditing: true,
        editPost: loadedPost
      };
    });
  };

  cancelEditHandler = () => {
    this.setState({ isEditing: false, editPost: null });
  };

  finishEditHandler = postData => {
    this.setState({ editLoading: true });

    const formData = new FormData();
    formData.append('image', postData.image);
    if (this.state.editPost) {
      formData.append('oldPath', this.state.editPost.imagePath);
    }

    // Step 1: Upload image via REST (GraphQL can't handle files)
    fetch('http://localhost:8080/post-image', {
      method: 'PUT',
      headers: {
        Authorization: 'Bearer ' + this.props.token
      },
      body: formData
    })
      .then(res => res.json())
      .then(fileResData => {
        const imageUrl = fileResData.filePath || 'undefined';

        let graphqlQuery = {
          query: `
            mutation CreatePost($title: String!, $content: String!, $imageUrl: String!) {
              createPost(postInput: { title: $title, content: $content, imageUrl: $imageUrl }) {
                _id
                title
                content
                imageUrl
                creator { name }
                createdAt
              }
            }
          `,
          variables: {
            title: postData.title,
            content: postData.content,
            imageUrl: imageUrl
          }
        };

        if (this.state.editPost) {
          graphqlQuery = {
            query: `
              mutation UpdatePost($id: ID!, $title: String!, $content: String!, $imageUrl: String!) {
                updatePost(id: $id, postInput: { title: $title, content: $content, imageUrl: $imageUrl }) {
                  _id
                  title
                  content
                  imageUrl
                  creator { name }
                  createdAt
                }
              }
            `,
            variables: {
              id: this.state.editPost._id,
              title: postData.title,
              content: postData.content,
              imageUrl: imageUrl
            }
          };
        }

        // Step 2: Create or update post via GraphQL
        return fetch('http://localhost:8080/graphql', {
          method: 'POST',
          body: JSON.stringify(graphqlQuery),
          headers: {
            Authorization: 'Bearer ' + this.props.token,
            'Content-Type': 'application/json'
          },
        });
      })
      .then(res => res.json())
      .then(resData => {
        if (resData.errors && resData.errors[0].status === 422) {
          throw new Error('Validation failed.');
        }
        if (resData.errors) {
          throw new Error('Post operation failed!');
        }

        const resDataField = this.state.editPost ? 'updatePost' : 'createPost';
        const resPost = resData.data[resDataField];
        const post = {
          _id: resPost._id,
          title: resPost.title,
          content: resPost.content,
          creator: resPost.creator,
          createdAt: resPost.createdAt,
          imagePath: resPost.imageUrl,
          imageUrl: resPost.imageUrl
        };

        this.setState(prevState => {
          let updatedPosts = [...prevState.posts];
          let updatedTotalPosts = prevState.totalPosts;
          if (prevState.editPost) {
            const postIndex = updatedPosts.findIndex(
              p => p._id === prevState.editPost._id
            );
            if (postIndex !== -1) {
              updatedPosts[postIndex] = post;
            }
          } else {
            updatedTotalPosts++;
            if (prevState.postPage === 1) {
              if (updatedPosts.length >= 2) {
                updatedPosts.pop();
              }
              updatedPosts.unshift(post);
            }
          }
          return {
            posts: updatedPosts,
            totalPosts: updatedTotalPosts,
            isEditing: false,
            editPost: null,
            editLoading: false
          };
        });
      })
      .catch(err => {
        console.log(err);
        this.setState({
          isEditing: false,
          editPost: null,
          editLoading: false,
          error: err
        });
      });
  };

  statusInputChangeHandler = (input, value) => {
    this.setState({ status: value });
  };

  deletePostHandler = postId => {
    this.setState({ postsLoading: true });
    fetch('http://localhost:8080/graphql', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + this.props.token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: `
          mutation DeletePost($id: ID!) {
            deletePost(id: $id)
          }
        `,
        variables: { id: postId }
      })
    })
      .then(res => res.json())
      .then(resData => {
        if (resData.errors) throw new Error('Deleting a post failed!');
        this.loadPosts();
      })
      .catch(err => {
        console.log(err);
        this.setState({ postsLoading: false });
      });
  };

  errorHandler = () => {
    this.setState({ error: null });
  };

  catchError = error => {
    this.setState({ error: error });
  };

  render() {
    return (
      <Fragment>
        <ErrorHandler error={this.state.error} onHandle={this.errorHandler} />
        <FeedEdit
          editing={this.state.isEditing}
          selectedPost={this.state.editPost}
          loading={this.state.editLoading}
          onCancelEdit={this.cancelEditHandler}
          onFinishEdit={this.finishEditHandler}
        />
        <section className="feed__status">
          <form onSubmit={this.statusUpdateHandler}>
            <Input
              type="text"
              placeholder="Your status"
              control="input"
              onChange={this.statusInputChangeHandler}
              value={this.state.status}
            />
            <Button mode="flat" type="submit">
              Update
            </Button>
          </form>
        </section>
        <section className="feed__control">
          <Button mode="raised" design="accent" onClick={this.newPostHandler}>
            New Post
          </Button>
        </section>
        <section className="feed">
          {this.state.postsLoading && (
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <Loader />
            </div>
          )}
          {this.state.posts.length <= 0 && !this.state.postsLoading ? (
            <p style={{ textAlign: 'center' }}>No posts found.</p>
          ) : null}
          {!this.state.postsLoading && (
            <Paginator
              onPrevious={this.loadPosts.bind(this, 'previous')}
              onNext={this.loadPosts.bind(this, 'next')}
              lastPage={Math.ceil(this.state.totalPosts / 2)}
              currentPage={this.state.postPage}
            >
              {this.state.posts.map(post => (
                <Post
                  key={post._id}
                  id={post._id}
                  author={post.creator.name}
                  date={new Date(post.createdAt).toLocaleDateString('en-US')}
                  title={post.title}
                  image={'http://localhost:8080/' + post.imageUrl}
                  content={post.content}
                  onStartEdit={this.startEditPostHandler.bind(this, post._id)}
                  onDelete={this.deletePostHandler.bind(this, post._id)}
                />
              ))}
            </Paginator>
          )}
        </section>
      </Fragment>
    );
  }
}

export default Feed;
