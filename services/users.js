import * as db    from '../services/db.js';

/* ---------------------------------------- */
/* Get user followings                      */
/* ---------------------------------------- */

async function getUserByUsername(username) {
  const sql = `
    SELECT
      id, username 
    FROM 
      users 
    WHERE 
      username = '${username}'
  `;

  const result = await db.query(sql);
  return result[0];
}

/* ---------------------------------------- */
/* Check if user exists                     */
/* ---------------------------------------- */

async function userExists(userId) {
  const sql = `SELECT COUNT(id) AS total FROM users WHERE id = ${userId}`;
  const result = await db.query(sql);
  return Number(result[0].total) > 0;
}

/* ---------------------------------------- */
/* Get user followings                      */
/* ---------------------------------------- */

async function getUserFollowingIds(userId) {
  const sql = `
    SELECT 
      users.id FROM users 
    JOIN 
      followers_followings ON users.id = followers_followings.following_user_id 
    WHERE 
      followers_followings.follower_user_id = ${userId}
  `;

  const rows = await db.query(sql);
  return rows.map(({ id }) => Number(id));
}

async function getUserFollowings(userId) {
  const sql = `
    SELECT 
      users.id, users.username, users.profile_picture 
    FROM 
      users 
    JOIN 
      followers_followings ON users.id = followers_followings.following_user_id 
    WHERE 
      followers_followings.follower_user_id = ${userId}
  `;

  const rows = await db.query(sql);
  return rows;
}

/* ---------------------------------------- */
/* Follow user                              */
/* ---------------------------------------- */

async function followUser(currentUserId, followId) {
  const sql = `
    INSERT INTO 
      followers_followings (follower_user_id, following_user_id)
    VALUES
      (${currentUserId}, ${followId})`;

  const result = await db.query(sql);
  return result;
}

/* ---------------------------------------- */
/* Unfollow user                              */
/* ---------------------------------------- */

async function unfollowUser(currentUserId, followId) {
  const sql = `
    DELETE FROM 
      followers_followings 
    WHERE 
      follower_user_id = ${currentUserId} AND following_user_id = ${followId}`;

  const result = await db.query(sql);
  return result;
}

/* ---------------------------------------- */
/* Return user fields user can update       */
/* ---------------------------------------- */

function getUserFields() {
  return [
    'username', 
    'email', 
    'profilePicture', 
    'coverPicture',
    'desc', 
    'city', 
    'from', 
    'relationship'
  ];
}

/* ---------------------------------------- */
/* Update a user after checking req body    */
/* ---------------------------------------- */

function getUpdateUserSql(data, userId, newPassword = null) {
  const fields = getUserFields();
  const kvMap = new Map();

  //return null if data has incorrect fields
  for (const key in data) {
    if (fields.includes(key)) {
      kvMap.set(key, data[key]);
    }
    else {
      return null;
    }
  }

  if (newPassword !== null) {
    kvMap.set('password', newPassword);
  }

  //construct sql string
  let sql = 'UPDATE users SET ';

  kvMap.forEach((value, key) => {
    if (key === 'relationship') {
      //quotes not needed around tiny int
      sql += `\`${key}\` = ${value}, `;   
    }
    else {
      //quotes needed around string value
      sql += `\`${key}\` = '${value}', `; 
    }
  });

  //remove last comma
  sql = sql.trim().slice(0, -1);
  sql += ` WHERE id = ${userId}`

  return sql;
}

export {
  getUserByUsername,
  getUpdateUserSql,
  getUserFollowingIds,
  getUserFollowings,
  userExists,
  followUser,
  unfollowUser,
};
