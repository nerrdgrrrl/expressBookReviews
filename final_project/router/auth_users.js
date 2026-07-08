const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

const isValid = (username)=>{ //returns boolean
  // Returns true if username does NOT already exist (i.e. it's available/valid to register)
  let userswithsamename = users.filter((user) => {
    return user.username === username;
  });
  return userswithsamename.length > 0;
};

const authenticatedUser = (username,password)=>{ //returns boolean
  let validusers = users.filter((user) => {
    return (user.username === username && user.password === password);
  });
  return validusers.length > 0;
};

//only registered users can login
regd_users.post("/login", (req,res) => {
  const username = req.body.username;
  const password = req.body.password;

  if (!username || !password) {
    return res.status(404).json({message: "Username and password are required"});
  }

  if (!authenticatedUser(username, password)) {
    return res.status(208).json({message: "Invalid username or password"});
  }

  // Generate JWT access token
  let accessToken = jwt.sign({
    data: password
  }, 'access', { expiresIn: 60 * 60 });

  // Store the token in the session, keyed to this request
  req.session.authorization = {
    accessToken, username
  };

  return res.status(200).json({message: "User successfully logged in"});
});

// Add a book review
regd_users.put("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn;
  const review = req.query.review;
  const username = req.session.authorization['username'];

  const book = books[isbn];

  if (!book) {
    return res.status(404).json({message: `Book with ISBN ${isbn} not found`});
  }

  if (!review) {
    return res.status(404).json({message: "Review text is required as a query parameter"});
  }

  // Add or update the review for this user (overwrites if they already reviewed this book)
  book.reviews[username] = review;

  return res.status(200).json({
    message: `Review for '${book.title}' by ${username} has been successfully added/updated`,
    reviews: book.reviews
  });
});
// Delete a book review
regd_users.delete("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn;
  const username = req.session.authorization['username'];

  const book = books[isbn];

  if (!book) {
    return res.status(404).json({message: `Book with ISBN ${isbn} not found`});
  }

  if (!book.reviews[username]) {
    return res.status(404).json({message: `No review found for user '${username}' on this book`});
  }

  delete book.reviews[username];

  return res.status(200).json({
    message: `Review by ${username} for '${book.title}' has been deleted`,
    reviews: book.reviews
  });
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
