import * as db    from '../services/db.js';

async function postExists(postId) {
  const sql = `SELECT COUNT(id) AS total FROM posts WHERE id = ${postId}`;
  const result = await db.query(sql);
  return Number(result[0].total) > 0;
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
  
  return rows[0];
}

async function getPostById(postId) {
  const sql = `SELECT * FROM posts WHERE id = ${postId}`;
  const row = await db.query(sql);
  return row[0];
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

export {
  insertAndGetNewPost,
  getPostById,
  updatePost,
  postExists,
  deletePost,
};
