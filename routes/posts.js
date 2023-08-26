import express    from 'express';
import { verify } from './auth.js';
import * as db    from '../services/db.js';
import { 
  insertAndGetNewPost,
  getPostById,
  updatePost,
  postExists,
  deletePost } from '../services/posts.js';

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

export default router;
export {
  router,
};
