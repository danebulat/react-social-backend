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

