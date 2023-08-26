import express    from 'express';
import { verify } from './auth.js';
import * as db    from '../services/db.js';
import { 
  insertAndGetNewPost,
  getPostById,
  updatePost,
  postExists,
  deletePost,
  getLikedPostIds,
  likePost,
  dislikePost,
  getUserPosts } from '../services/posts.js';
import { 
  getUserFollowingIds } from '../services/users.js';

const router = express.Router();

/* ---------------------------------------- */
/* POST /api/posts   Create post            */
/* ---------------------------------------- */

router.post('/', verify, async (req, res, next) => {
  try {
    const newPost = await insertAndGetNewPost(req);
    res.status(200).json(newPost);
  }
  catch (err) {
    console.error(err);
    next(err);
  }
});

/* ---------------------------------------- */
/* PUT /api/posts/:id   Update post         */
/* ---------------------------------------- */

router.put('/:id', verify, async (req, res, next) => {
  try {
    const userId = Number(req.user.id);
    const paramId = Number(req.params.id);

    //check if post exists
    const exists = await postExists(paramId);
    if (!exists) {
      return res.status(404).json('Post not found');
    }

    const post = await getPostById(paramId);

    //check current user owns the post
    if (Number(post.user_id) === userId) {
      const updatedPost = await updatePost(req, paramId);
      res.status(200).json(updatedPost);
    }
    else {
      res.status(403).json('You can only update your posts');
    }
  }
  catch (err) {
    console.log(err);
    next(err);
  }
});

/* ---------------------------------------- */
/* DELETE /api/posts/:id   Delete post      */
/* ---------------------------------------- */

router.delete('/:id', verify, async (req, res, next) => {
  try {
    const userId = Number(req.user.id);
    const paramId = Number(req.params.id);

    //check if post exists
    const exists = await postExists(paramId);
    if (!exists) {
      return res.status(404).json('Post not found');
    }

    const post = await getPostById(paramId);

    //check current user owns the post
    if (Number(post.user_id) === userId) {
      
      await deletePost(paramId);
      res.status(200).json('Post deleted successfully');
    }
    else {
      res.status(403).json('You can only delete your posts');
    }
  }
  catch (err) {
    console.log(err);
    next(err);
  }
});

/* ---------------------------------------- */
/* PUT /:id/ike   Like/Dislike post         */
/* ---------------------------------------- */

router.put('/:id/like', verify, async (req, res, next) => {
  try {
    const userId = Number(req.user.id);
    const postId = Number(req.params.id);
    const exists = postExists(postId);
  
    //check if post exists
    if (!exists) {
      res.status(404).json('Post not found');
    }

    //check if user already likes this post 
    const likedPostIds = await getLikedPostIds(userId);
    
    if (!likedPostIds.includes(postId)) {

      //like post
      await likePost(userId, postId);
      res.status(200).json('Post has been liked');
    }
    else {
      //dislike post
      await dislikePost(userId, postId);
      res.status(200).json('Post has been disliked');
    }
  }
  catch (err) {
    console.error(err);
    next(err);
  }
});

/* ---------------------------------------- */
/* GET /timeline/all   Get timeline posts   */
/* ---------------------------------------- */

router.get('/timeline/all', verify, async (req, res, next) => {
  try {
    const userId = Number(req.user.id);
    const userFollowingIds = await getUserFollowingIds(userId);
    let allPosts = [];

    //get user posts
    const userPosts = await getUserPosts(userId);
    allPosts = allPosts.concat(userPosts);

    //promises to get posts from all followed users
    const promises = userFollowingIds.map(friendId => {
      return getUserPosts(friendId);
    });
    
    //append friend posts to all posts array
    const friendPosts = await Promise.all(promises);
    friendPosts.forEach(ps => {
      allPosts = allPosts.concat(ps);
    });

    res.status(200).json(allPosts);
  }
  catch (err) {
    console.error(err);
    next(err);
  }
});

/* ---------------------------------------- */
/* GET /:id   GET Post                      */
/* ---------------------------------------- */

router.get('/:id', async (req, res, next) => {
  try {
    const postId = Number(req.params.id);
    const exists = await postExists(postId);
    if (!exists) {
      return res.status(404).json('Post not found');
    }
    const post = await getPostById(postId);
    res.status(200).json(post);
  }
  catch (err) {
    console.error(err);
    next(err);
  }
});

export default router;
export {
  router,
};
