import express    from 'express';
import bcrypt     from 'bcrypt';
import { verify } from './auth.js';
import * as db    from '../services/db.js';
import { 
  getUpdateUserSql, 
  userExists,
  getUserFollowingIds,
  getUserFollowings,
  followUser,
  unfollowUser } from '../services/users.js';
import { escape } from 'mysql2';

const router = express.Router();

/* ---------------------------------------- */
/* GET /api/users/:id                       */
/* ---------------------------------------- */

router.get('/', async (req, res, next) => {

  const userId = req.query.userId;
  const username = req.query.username;
  try {
    const sql = userId
      ? `SELECT * FROM \`users\` WHERE \`id\` = ${userId}`
      : `SELECT * FROM \`users\` WHERE \`username\` = ${escape(username)}`;

    const row = await db.query(sql);
    if (row.length === 0) {
      return res.status(404).json('User not found');
    }

    const {password, is_admin, created_at, updated_at, ...other} = row[0];

    //get following ids
    const followingIds = await getUserFollowingIds(row[0].id);
    other.followingIds = followingIds;

    res.status(200).json(other);
  }
  catch (err) {
    console.log(err);
    next(err);
  }
});

/* ---------------------------------------- */
/* PUT /api/users/:id                       */
/* ---------------------------------------- */

router.put('/:id', verify, async (req, res, next) => {

  if (Number(req.user.id) === Number(req.params.id) || req.user.isAdmin) {
    const { password, ...restBody } = req.body;

    //hash new password if in request
    if (password !== undefined) {
      try {
        const salt = await bcrypt.genSalt(10);
        req.body.password = await bcrypt.hash(password, salt);
      }
      catch (err) {
        return res.status(500).json(err);
      }
    }

    //update user in database
    try {
      const sql = getUpdateUserSql(restBody, req.user.id, req.body.password);

      if (sql === null)
        throw new Error("Invalid user field names")

      const result = await db.query(sql);

      if (result.affectedRows === 1) {
        res.status(200).json('Account has been updated');
      } else {
        res.status(500).json('Error updating user');
      }
    } catch (err) {
      console.error(err);
      next(err);
    }
  }
  else {
    res.status(403).json('You can only update your account');
  }
});

/* ---------------------------------------- */
/* DELETE /api/users/:id                    */
/* ---------------------------------------- */

router.delete('/:userId', verify, async (req, res, next) => {
  console.log(req.user);
  if (Number(req.user.id) === Number(req.params.userId) || req.user.isAdmin) {

    try {
      const sql = `DELETE FROM users WHERE id = ${req.params.userId}`;
      await db.query(sql);
      res.status(200).json('User has been deleted');
    }
    catch (err) {
      console.error(err);
      next(err);
    }
  }
  else {
    res.status(403).json('You are not allowed to delete this user');
  }
});

/* ---------------------------------------- */
/* GET /api/users/all                       */
/* ---------------------------------------- */

router.get('/all', async (_req, res, next) => {
  try {
    console.log('FETCH ALL USERS');

    const sql = 'SELECT id, username, profile_picture, created_at FROM users';
    const rows = await db.query(sql);
    const data = rows === [] ? [] : rows;

    const users = data.map(user => {
      return {
        userId: user.id,
        username: user.username,
        profilePicture: user.profile_picture,
        createdAt: user.created_at,
      }
    }); 

    res.status(200).json(users);
  }
  catch (err) {
    console.log(`Error while getting users ${err.message}`);
    next(err);
  }
});

/* ---------------------------------------------------- */
/* GET /api/users/friends/:userId   Get following users */
/* ---------------------------------------------------- */

router.get('/friends/:userId', async (req, res, next) => {
  try {
    const rows = await getUserFollowings(req.params.userId);

    const users = rows.map(user => ({
      userId: user.id,
      username: user.username,
      profilePicture: user.profile_picture})
    );

    res.status(200).json(users);
  }
  catch (err) {
    console.log(`Error while getting users ${err.message}`);
    next(err);
  }
});

/* ---------------------------------------- */
/* PUT /:id/follow    Follow user           */
/* ---------------------------------------- */

router.put('/:id/follow', verify, async (req, res, next) => {
  const paramId = Number(req.params.id);
  const userId = Number(req.user.id);

  if (userId !== paramId) {
    try {
      //check if paramId user exists
      const exists = await userExists(req.params.id);
      if (!exists) {
        return res.status(404).json('User to follow not found');
      }

      //check if current user already follows the user
      const followingIds = await getUserFollowingIds(req.user.id);
      if (followingIds.includes(paramId)) {
        return res.status(403).json('You already follow this user');
      }

      //follow user in db
      const result = await followUser(userId, paramId);
      if (result.affectedRows === 1) {
        res.status(200).json('User has been followed');
      } else {
        res.status(500).json('Error following user');
      }
    }
    catch (err) {
      console.error(err);
      next(err);
    }
  }
  else {
    res.status(403).json('You cannot follow yourself');
  }
});

/* ---------------------------------------- */
/* PUT /:id/unfollow    Follow user         */
/* ---------------------------------------- */

router.put('/:id/unfollow', verify, async (req, res, next) => {
  const paramId = Number(req.params.id);
  const userId = Number(req.user.id);

  if (userId !== paramId) {
    try {
      //check if paramId user exists
      const exists = await userExists(req.params.id);
      if (!exists) {
        return res.status(404).json('User to unfollow not found');
      }

      //check if current user follows the user
      const followingIds = await getUserFollowingIds(req.user.id);
      if (!followingIds.includes(paramId)) {
        return res.status(403).json('You do not follow this user');
      }

      //follow user in db
      const result = await unfollowUser(userId, paramId);
      if (result.affectedRows === 1) {
        res.status(200).json('User has been unfollowed');
      } else {
        res.status(500).json('Error unfollowing user');
      }
    }
    catch (err) {
      console.error(err);
      next(err);
    }
  }
  else {
    res.status(403).json('You cannot unfollow yourself');
  }
});

/* exports */
export default router;
export {
  router,
};
