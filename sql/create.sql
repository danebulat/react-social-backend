-- Create database
CREATE DATABASE IF NOT EXISTS react_social_db;
USE react_social_db;


-- Create users table
CREATE TABLE IF NOT EXISTS `users` (
  `id`              INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `username`        VARCHAR(20) NOT NULL UNIQUE,
  `email`           VARCHAR(50) NOT NULL UNIQUE,
  `password`        VARCHAR(255) NOT NULL,
  `profile_picture` VARCHAR(512),
  `cover_picture`   VARCHAR(512),
  `is_admin`        BOOLEAN NOT NULL DEFAULT FALSE,
  `desc`            VARCHAR(50),
  `city`            VARCHAR(50),
  `from`            VARCHAR(50),
  `relationship`    TINYINT DEFAULT 3,
  `created_at`      DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      DATETIME DEFAULT CURRENT_TIMESTAMP
);


-- Create jwt_refresh_tokens table
CREATE TABLE IF NOT EXISTS `jwt_refresh_tokens` (
  `id`            INT AUTO_INCREMENT PRIMARY KEY,
  `user_id`       INT UNSIGNED NOT NULL,
  `refresh_token` TEXT NOT NULL,
  `created_at`    DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY `fk_refresh_tokens_user_id` (`user_id`) 
    REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
);


-- Create junction table between followers and followings
CREATE TABLE IF NOT EXISTS `followers_followings` (
  `follower_user_id` INT UNSIGNED NOT NULL,
  `following_user_id` INT UNSIGNED NOT NULL,

  PRIMARY KEY (`follower_user_id`, `following_user_id`),

  CONSTRAINT `Constr_followers_followings_follower_fk`
    FOREIGN KEY `follower_fk` (`follower_user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT `Constr_followers_followings_following_fk`
    FOREIGN KEY `following_fk` (`following_user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
);


-- find a user followers
DELIMITER $$
CREATE PROCEDURE IF NOT EXISTS find_user_followers (IN userId INT UNSIGNED)
BEGIN
  SELECT 
    users.* FROM users 
  JOIN 
    followers_followings ON users.id = followers_followings.follower_user_id 
  WHERE 
    followers_followings.following_user_id = userId;
END $$
DELIMITER ;


-- find a user followings
DELIMITER $$
CREATE PROCEDURE IF NOT EXISTS find_user_followings (IN userId INT UNSIGNED)
BEGIN
  SELECT 
    users.* FROM users 
  JOIN 
    followers_followings ON users.id = followers_followings.following_user_id
  WHERE 
    followers_followings.follower_user_id = userId;
END $$
DELIMITER ;

