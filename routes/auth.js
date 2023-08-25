import express from 'express';
import jwt     from 'jsonwebtoken';
import bcrypt  from 'bcrypt';
import config  from '../config.js';
import * as db from '../services/db.js';

const router = express.Router();

/* -------------------------------------------------- */
/* Helper functions                                   */
/* -------------------------------------------------- */

function generateAccessToken(user) {
  return jwt.sign(
    {id: user.id, isAdmin: user.is_admin}, 
    config.jwt.secretKey,
    { expiresIn: '1d' }
  );
};

function generateRefreshToken(user) {
  return jwt.sign(
    {id: user.id, isAdmin: user.is_admin}, 
    config.jwt.secretRefreshKey,
    { expiresIn: '2d' }
  );
};

function comparePassword(password, hashPassword) {
  return bcrypt.compareSync(password, hashPassword);
}

async function performLogin(username, email, password) {

  //fetch user
  const row = await db.query(`
    SELECT id, 
      username, password, email, 
      profile_picture, cover_picture, 
      is_admin, created_at 
    FROM users 
    WHERE username='${username}' AND email='${email}'`);

  if (row.length) {

    //compare passwords
    if (!comparePassword(password, row[0].password)) {
      return null;
    }

    //generate tokens
    const user = row[0];
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    //insert refresh token
    const result = await db.query(`
      INSERT INTO jwt_refresh_tokens (user_id, refresh_token) 
      VALUES (${user.id}, '${refreshToken}')`);

    if (!result.affectedRows) {
      return null;
    }

    //return user
    return {
      id:             user.id,
      username:       user.username,
      email:          user.email,
      profilePicture: user.profile_picture,
      coverPicture:   user.cover_picture,
      isAdmin:        user.is_admin,
      createdAt:      user.created_at,
      accessToken,
      refreshToken,
    };
  }
  else {
    return null;
  }
}

/* -------------------------------------------------- */
/* Token verification middleware                      */
/* -------------------------------------------------- */

function verify(req, res, next) {

  //sets req.user if sent token authenticates.
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1];
    
    //token's payload returned if verification succeeds
    jwt.verify(token, config.jwt.secretKey, (err, user) => {
      if (err) {
        return res.status(403).json("Token is not valid");
      }

      req.user = user;
      next();
    });
  }
  else {
    res.status(401).json('You are not authenticated');
  }
};

/* -------------------------------------------------- */
/* POST /refresh                                      */
/* -------------------------------------------------- */

router.post("/refresh", async (req, res) => {
  
  //get user refresh token
  const refreshToken = req.body.token;

  if (!refreshToken) 
    return res.status(401).json('You are not authenticated!');

  //check if refresh token is valid
  const row = await db.query(`
    SELECT * FROM jwt_refresh_tokens
    WHERE refresh_token='${refreshToken}'
  `);

  if (!row.length)
    return res.status(403).json('Refresh token is not valid!');
  
  //if everything is ok, create new access + refresh tokens and send to user
  jwt.verify(refreshToken, config.jwt.secretRefreshKey, async (err, user) => {
    err && console.log(err);

    try {
      //delete old refresh token
      await db.query(`
        DELETE FROM jwt_refresh_tokens 
        WHERE refresh_token='${refreshToken}'
      `);

      //generate new tokens
      const newAccessToken = generateAccessToken(user);
      const newRefreshToken = generateAccessToken(user);

      //persist new refresh token
      await db.query(`
        INSERT INTO jwt_refresh_tokens (user_id, refresh_token)
        VALUES (${user.id}, '${newRefreshToken}')
      `);
      
      //return new access and refresh tokens
      res.status(200).json({ 
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      });
    }
    catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error generating new refresh token' });
    }
  });
});

/* -------------------------------------------------- */
/* POST /register                                     */
/* -------------------------------------------------- */

router.post('/register', async (req, res, next) => {
  const {username, email, password} = req.body;

  try {
    if (await db.getUserCount() >= 100)
      return res.status(500).json({ error: 'Too many users exist.' });

    if (await db.isDuplicateUsername(username)) 
      return res.status(409).json({ error: 'Username already exists.' });

    //TODO: Check duplicate email
    
    const hashPassword = bcrypt.hashSync(password, 10);
    const sql = `
      INSERT INTO users (username, email, password)
      VALUES ('${username}', '${email}', '${hashPassword}')`;

    if (await db.query(sql).affectedRows === 0) {
      throw new Error("Error adding user");
    }

    const user = await performLogin(username, email, password);
    if (user) {
      res.status(200).json(user);
    } else {
      res.status(500).json({ error: 'Registration error' });
    }
  }
  catch (err) {
    console.error(`Error while creating user ${err.message}`);
    next(err);
  }
});

/* -------------------------------------------------- */
/* POST /login                                        */
/* -------------------------------------------------- */

router.post('/login', async (req, res, next) => {
  try {
    const {username, email, password} = req.body;
    const result = await performLogin(username, email, password);
    if (result) {
      res.status(200).json(result);
    } else {
      res.status(401).json({ error: 'Invalid username or password' });
    }
  } 
  catch (err) {
    console.error(err);
    next(err);
  }
});

/* -------------------------------------------------- */
/* POST /logout                                       */
/* -------------------------------------------------- */

router.post('/logout', verify, async (req, res) => {

  //delete refresh token
  const refreshToken = req.body.token;
  const user = req.user;

  try {
    const result = await db.query(`
      DELETE FROM jwt_refresh_tokens 
      WHERE user_id=${user.id} AND 
            refresh_token='${refreshToken}'
      `);
    
    const message = result.affectedRows
      ? 'You logged out successfully'
      : 'Unable to log out';

    res.status(200).json({ msg: message });
  }
  catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Unable to log out' });
  }
});

/* exports */
export default router;
export {
  router,
  verify,
};
