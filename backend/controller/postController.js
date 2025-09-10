const Post = require("../models/Post");
const User = require("../models/User");

// @desc    Create a new post
// @route   POST /api/posts
// @access  Private
const createPost = async (req, res) => {
  try {
    const { caption } = req.body;
    const image = req.file?.path || req.body.image;

    if (!image) return res.status(400).json({ message: "Image is required" });

    const post = new Post({
      user: req.user._id,
      caption,
      image,
    });

    const createdPost = await post.save();
    res.status(201).json(createdPost);
  } catch (error) {
    console.error("Create post error:", error);
    res.status(500).json({ message: "Failed to create post" });
  }
};

// @desc    Get all posts (optionally filter by user)
// @route   GET /api/posts
// @access  Private
const getAllPosts = async (req, res) => {
  try {
    const userFilter = req.query.user;

    const filter = userFilter ? { user: userFilter } : {};

    const posts = await Post.find(filter)
      .sort({ createdAt: -1 })
      .populate("user", "username profilePicture")
      .populate("comments.user", "username profilePicture");

    res.status(200).json(posts);
  } catch (error) {
    console.error("Get posts error:", error);
    res.status(500).json({ message: "Failed to fetch posts" });
  }
};

// @desc    Add a comment to a post
// @route   POST /api/posts/:postId/comment
// @access  Private
const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    const postId = req.params.postId;

    if (!text)
      return res.status(400).json({ message: "Comment cannot be empty" });

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const comment = {
      user: req.user._id,
      text,
    };

    post.comments.push(comment);
    await post.save();

    const updatedPost = await Post.findById(postId)
      .populate("user", "username profilePicture")
      .populate("comments.user", "username profilePicture");

    res.status(200).json(updatedPost);
  } catch (error) {
    console.error("Add comment error:", error);
    res.status(500).json({ message: "Failed to add comment" });
  }
};

// @desc    Get single post by ID
// @route   GET /api/posts/:postId
// @access  Private
const getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId)
      .populate("user", "username profilePicture")
      .populate("comments.user", "username profilePicture");

    if (!post) return res.status(404).json({ message: "Post not found" });

    res.status(200).json(post);
  } catch (error) {
    console.error("Get post by ID error:", error);
    res.status(500).json({ message: "Failed to fetch post" });
  }
};

// @desc    Get all posts by a specific user
// @route   GET /api/posts/user/:userId
// @access  Private
// Get logged-in user's posts (profile page)
const getMyPosts = async (req, res) => {
  try {
    const posts = await Post.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate("user", "username profilePicture");

    res.status(200).json(posts);
  } catch (error) {
    console.error("Get my posts error:", error);
    res.status(500).json({ message: "Failed to fetch my posts" });
  }
};

// Get posts by userId (other user's profile)
const getUserPosts = async (req, res) => {
  try {
    const posts = await Post.find({ user: req.params.userId })
      .sort({ createdAt: -1 })
      .populate("user", "username profilePicture");

    res.status(200).json(posts);
  } catch (error) {
    console.error("Get user's posts error:", error);
    res.status(500).json({ message: "Failed to fetch user's posts" });
  }
};


// @desc    Delete a post
// @route   DELETE /api/posts/:postId
// @access  Private
const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) return res.status(404).json({ message: "Post not found" });

    // Check if the post belongs to the requesting user
    if (post.user.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this post" });
    }

    await post.deleteOne();

    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("Delete post error:", error);
    res.status(500).json({ message: "Failed to delete post" });
  }
};

module.exports = {
  createPost,
  getAllPosts,
  getMyPosts,
  addComment,
  getPostById,
  getUserPosts,
  deletePost,
};
