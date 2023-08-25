import express    from 'express';
import bcrypt     from 'bcrypt';
import { verify } from './auth.js';
import * as db    from '../services/db.js';
import { getUpdateUserSql } from '../services/users.js';

const router = express.Router();

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
  if (Number(req.user.id) === Number(req.params.userId) || req.user.isAdmin) {

    try {
      const sql = `DELETE FROM users WHERE id = ${req.user.id}`;
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
/* GET /api/users                           */
/* ---------------------------------------- */

router.get('/', async (_req, res, next) => {
  try {
    const sql = 'SELECT id, username, created_at FROM users';
    const rows = await db.query(sql);
    const data = rows === [] ? [] : rows;

    const users = data.map(user => {
      return {
        userId: user.id,
        username: user.username,
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

/* exports */
export default router;
export {
  router,
};
