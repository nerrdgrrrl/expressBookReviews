const express = require('express');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();
const axios = require('axios');


public_users.post("/register", (req,res) => {
    const username = req.body.username;
    const password = req.body.password;
  
    if (!username || !password) {
      return res.status(404).json({message: "Username and password are required"});
    }
  
    if (isValid(username)) {
      return res.status(404).json({message: "Username already exists"});
    }
  
    users.push({"username": username, "password": password});
    return res.status(200).json({message: "User successfully registered. Now you can login"});
  });

// Get the book list available in the shop — async/await version
public_users.get('/', async function (req, res) {
    try {
      const response = await axios.get('http://localhost:5000/');
      return res.status(200).send(JSON.stringify(response.data, null, 4));
    } catch (error) {
      return res.status(500).json({message: "Error fetching book list", error: error.message});
    }
  });
// Internal endpoint - raw ISBN lookup
public_users.get('/isbn-data/:isbn', function (req, res) {
    const isbn = req.params.isbn;
    const book = books[isbn];
  
    if (book) {
      return res.status(200).send(JSON.stringify(book, null, 4));
    } else {
      return res.status(404).json({message: `Book with ISBN ${isbn} not found`});
    }
  });
// Get book details based on ISBN — async/await version
public_users.get('/isbn/:isbn', async function (req, res) {
    const isbn = req.params.isbn;
  
    try {
      const response = await axios.get(`http://localhost:5000/isbn-data/${isbn}`);
      return res.status(200).send(JSON.stringify(response.data, null, 4));
    } catch (error) {
      if (error.response) {
        // Forward the actual status/message from the internal route (e.g. 404)
        return res.status(error.response.status).json(error.response.data);
      }
      return res.status(500).json({message: "Error fetching book details", error: error.message});
    }
  });
  
// Internal endpoint - raw author lookup
public_users.get('/author/:author',function (req, res) {
    const author = req.params.author;
  
    // Get all the keys (ISBNs) from the books object
    const isbns = Object.keys(books);
  
    // Filter down to books whose author matches the one in the request
    const matchingBooks = isbns
      .filter(isbn => books[isbn].author === author)
      .reduce((result, isbn) => {
        result[isbn] = books[isbn];
        return result;
      }, {});
  
    if (Object.keys(matchingBooks).length > 0) {
      return res.status(200).send(JSON.stringify(matchingBooks, null, 4));
    } else {
      return res.status(404).json({message: `No books found for author: ${author}`});
    }
  });
// Get book details based on author — async/await version
public_users.get('/author/:author', async function (req, res) {
    const author = req.params.author;
  
    try {
      const response = await axios.get(`http://localhost:5000/author-data/${encodeURIComponent(author)}`);
      return res.status(200).send(JSON.stringify(response.data, null, 4));
    } catch (error) {
      if (error.response) {
        return res.status(error.response.status).json(error.response.data);
      }
      return res.status(500).json({message: "Error fetching books by author", error: error.message});
    }
  });


// Internal endpoint - raw title lookup
public_users.get('/title-data/:title', function (req, res) {
  const title = req.params.title;

  const isbns = Object.keys(books);

  const matchingBooks = isbns
    .filter(isbn => books[isbn].title === title)
    .reduce((result, isbn) => {
      result[isbn] = books[isbn];
      return result;
    }, {});

  if (Object.keys(matchingBooks).length > 0) {
    return res.status(200).send(JSON.stringify(matchingBooks, null, 4));
  } else {
    return res.status(404).json({message: `No books found with title: ${title}`});
  }
});
// Get all books based on title — async/await version
public_users.get('/title/:title', async function (req, res) {
    const title = req.params.title;
  
    try {
      const response = await axios.get(`http://localhost:5000/title-data/${encodeURIComponent(title)}`);
      return res.status(200).send(JSON.stringify(response.data, null, 4));
    } catch (error) {
      if (error.response) {
        return res.status(error.response.status).json(error.response.data);
      }
      return res.status(500).json({message: "Error fetching books by title", error: error.message});
    }
  });

//  Get book review
public_users.get('/review/:isbn',function (req, res) {
    const isbn = req.params.isbn;
    const book = books[isbn];
  
    if (book) {
      return res.status(200).send(JSON.stringify(book.reviews, null, 4));
    } else {
      return res.status(404).json({message: `Book with ISBN ${isbn} not found`});
    }
});
module.exports.general = public_users;
