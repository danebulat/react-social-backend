import * as db    from '../services/db.js';

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
  getUpdateUserSql,
};
