# Social Media App Backend

A back-end REST API to drive a social media web application built with 
**Node.js**, **Express** and **MySQL**.

In order to run the application locally:

- Create a `.env` file and refer to the `.env.example` file in 
  the project's root to fill it in.

- Create a new MySQL database and tables that are expected by 
  the application. This can be done by opening the `mysql` command 
  line program and running `source sql/create.sql`. Refer to the
  source code in the `sql/` directory to understand how the database 
  works.

- Install project dependencies by running `npm install` and start 
  a development server with `npm run dev`.

## Project overview

`index.js`<br>
The application entry point that sets up necessary middleward, routes,
and starts the server.

`config.js`<br>
Reads from your `.env` file to configure the MySQL database connection, 
JWT secret keys, and the express server.

`sql/`<br>
Scripts that you can run on the MySQL command line to set up a database
for the application. Inspect how tables are constructed and their 
corresponding relationships.

`routes/`<br>
Code that defines the API endpoints and their corresponding handler functions 
that are called when the application receives a request.

`services/`<br>
Code that handles specific tasks such as interacting with the MySQL 
database and retreiving specific data. Functions in these modules are
imported and used in the `routes/` modules.

## JWT authentication

Most of the API endpoints require the request to contain a valid JWT access 
token. This token can be obtained by creating a new user via the 
`/api/register` endpoint and inspecting the `accessToken` property in 
the JSON response. If you have already created a user, call the 
`/api/login` endpoint to obtain a new JWT access token.

### Register a new user

Set up the following request in Postman or your favorite API platform:

- `POST` method to `http://localhost:5000/api/register`

- Input the following JSON for the request body:
  ```
  {
    "username": "<your username>",
    "password": "<your password>",
    "email": "<your email>"
  }
  ```

After submitting the request, inspect the `accessToken` field in the 
JSON response. Copy its value and use it in subsequent requests that
require JWT authentication. See the following section (Authorization header) to understand how to do this.

### Log in 

Set up the following request in Postman or your favorite API platform:

- `POST` method to `http://localhost:5000/api/login`

- Input the following JSON for the request body:
  ```
  {
    "username": "<your username>",
    "password": "<your password>",
    "email": "<your email>"
  }
  ```

After submitting the request, inspect the `accessToken` field in the 
JSON response. Copy its value and use it in subsequent requests that
require JWT authentication.

### Authorization header

In order to access endpoints that require a JWT access token, add an 
authorization header in your request by setting the following key value 
pair:

**Key:** `authorization`
**Value:** `Bearer <paste your access token>` 

## API Endpoints

The following endpoints summarise the API:

```
POST    /api/register            Create a new user
POST    /api/login               Log in
POST    /api/logout              Log out
POST    /api/regresh             Generate a new JWT refresh token

GET     /api/users/:id           Get a user's data
PUT     /api/users/:id           Update a user's data
DELETE  /api/users/:id           Delete a user
PUT     /api/users/:id/follow    Follow a user
PUT     /api/users/:id/unfollow  Unfollow a user
GET     /api/users               Get all users (for testing)

POST    /api/posts               Create a new post
PUT     /api/posts/:id           Update a post
DELETE  /api/posts/:id           Delete a post
PUT     /api/posts/:id/like      Like or unlike a post
GET     /api/posts/timeline/all  Fetch posts for a user's timeline
GET     /api/posts/:id`          Get a post's data
```

## MySQL Database

Some notes regarding the MySQL schema:

- A **many-to-many** relationship defines the following relationship 
  between users. The `followers_followings` table that tracks who 
  users are following and who they are being followed by.

- A **many-to-many** relationship defines which posts a user likes. 
  A user can like many posts, and a post can be liked by many 
  users. Therefore, a junction table called `user_post_likes`
  defines this relationship.

- A **one-to-many** relationship defines the connectio between a
  user and their posts. The `posts` table contains a `user_id` 
  foreign key column which indicates who owns the post.
