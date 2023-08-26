-- create some users
INSERT INTO users (username, email, password)
VALUES ('dane',  'dane@email.com',  'pass'),
       ('ross',  'ross@email.com',  'pass'),
       ('bob',   'bob@email.com',   'pass'),
       ('alice', 'alice@email.com', 'pass');

-- make some followers and followings
INSERT INTO followers_followings (follower_user_id, following_user_id)
VALUES 
  (1, 2),   -- dane follows ross
  (1, 3),   -- dane follows bob
  (1, 4),   -- dane follows alice
  (2, 3),   -- ross follows bob
  (2, 4),   -- ross follows alice
  (4, 1);   -- alice follows dane

-- create some posts 
INSERT INTO posts (`user_id`, `desc`, `img`)
VALUES (9,  'Text for this post.', 'post1.png'),
       (9,  'Some more text.',     'post2.png'),
       (10, 'New text for post.',  'post3.png'),
       (11, 'Another post.',       'post3.png');

-- like some posts 
INSERT INTO user_post_likes (`user_id`, `post_id`)
VALUES 
  (10, 1),  -- alice likes dane's 1st post
  (10, 2),  -- alice likes dane's 2nd post
  (9,  3);  -- dane likes alice's 1st post

-- select dane's liked posts (user id 9)
SELECT * FROM posts 
INNER JOIN user_post_likes
ON posts.id = user_post_likes.post_id 
WHERE user_post_likes.user_id = 9;

