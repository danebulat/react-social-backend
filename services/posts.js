import * as db    from '../services/db.js';

async function postExists(postId) {
  const sql = `SELECT COUNT(id) AS total FROM posts WHERE id = ${postId}`;
  const result = await db.query(sql);
  return Number(result[0].total) > 0;
}

/* -------------------------------------------------- */
/* Get post                                           */
/* -------------------------------------------------- */

async function getPostById(postId) {
  const sql = `SELECT * FROM posts WHERE id = ${postId}`;
  const row = await db.query(sql);

  //get array of like ids for post
  const sql2 = `
  SELECT 
    COUNT(post_id) as total 
  FROM 
    user_post_likes 
  WHERE 
    post_id = ${postId}
  `;

  return row[0];
}

async function getUserPosts(userId) {
  const sql = `
    SELECT 
      posts.*, COUNT(user_post_likes.post_id) AS likes
    FROM 
      posts 
    LEFT JOIN user_post_likes 
      ON posts.id = user_post_likes.post_id 
    WHERE 
      posts.user_id = ${userId} 
    GROUP BY 
      posts.id;
  `;
  let rows = await db.query(sql); 

  const promises = rows.map(async p => {
    const likeIds = await getPostLikeIds(p.id)
    return {...p, likeIds};
  });

  rows = await Promise.all(promises);
  return rows;
}

async function getPostLikeIds(postId) {
  const sql = `
    SELECT user_id 
    FROM user_post_likes 
    WHERE post_id = ${postId}
  `;
  const rows = await db.query(sql);
  return rows.map(({ user_id }) => user_id);
}

/* -------------------------------------------------- */
/* Insert post                                        */
/* -------------------------------------------------- */

async function insertAndGetNewPost(req) {
  const img = req.body.img 
    ? req.body.img : '';

  const sql = `
    INSERT INTO posts 
      (\`user_id\`, \`desc\`, \`img\`)
    VALUES 
      (${req.user.id}, '${req.body.desc}', '${img}')`;

  const result = await db.query(sql);
  const rows = await db.query(
    `SELECT * FROM posts WHERE id = ${result.insertId}`);
  
  rows[0].likeIds = [];
  return rows[0];
}

/* -------------------------------------------------- */
/* Update post                                        */
/* -------------------------------------------------- */

function getPostFields() {
  return [
    'desc',
    'img',
  ];
}

function getUpdatePostSql(data, postId) {
  const fields = getPostFields();
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
  
  //construct sql string
  let sql = 'UPDATE posts SET ';

  //quotes needed around string value
  kvMap.forEach((value, key) => {
    sql += `\`${key}\` = '${value}', `; 
  });

  //remove last comma
  sql = sql.trim().slice(0, -1);
  sql += ` WHERE id = ${postId}`

  return sql;
}

async function updatePost(req, postId) {
  const sql = getUpdatePostSql(req.body, postId);
  await db.query(sql);
  const updatedPost = await getPostById(postId);
  return updatedPost;
}

/* -------------------------------------------------- */
/* Delete post                                        */
/* -------------------------------------------------- */

async function deletePost(postId) {
  const sql = `DELETE FROM posts WHERE id = ${postId}`;
  await db.query(sql);
}

/* -------------------------------------------------- */
/* Like and dislike                                   */
/* -------------------------------------------------- */

async function likePost(userId, postId) {
  const sql = `
    INSERT INTO 
      user_post_likes (user_id, post_id)
    VALUES 
      (${userId}, ${postId});
  `;
  await db.query(sql);
}

async function dislikePost(userId, postId) {
  const sql = `
    DELETE FROM  
      user_post_likes 
    WHERE 
      user_id = ${userId} AND post_id = ${postId}
  `;
  await db.query(sql);
}

async function getLikedPostIds(userId) {
  const sql = `
    SELECT 
      id FROM posts 
    INNER JOIN 
      user_post_likes
    ON 
      posts.id = user_post_likes.post_id 
    WHERE 
      user_post_likes.user_id = ${userId};`;
  
  const rows = await db.query(sql);
  return rows.map(({ id }) => id);
}

export {
  insertAndGetNewPost,
  getPostById,
  updatePost,
  postExists,
  deletePost,
  getLikedPostIds,
  likePost,
  dislikePost,
  getUserPosts,
};
