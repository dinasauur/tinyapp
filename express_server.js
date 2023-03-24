const express = require('express');                               // Import the express library
const bcrypt = require("bcryptjs");                               // library that helps with hashing passwords
const cookieSession = require('cookie-session');                   // Stores the session data on the client within a cookie
const { usersDatabase, urlDatabase } = require("./database");
const {
  generateRandomString,
  urlsForUser,
  findUserbyEmail
} = require("./helpers");
const app = express();                                            // Define our app as an instance of express
const PORT = 8080;

app.set('view engine', 'ejs');                                    // This tells the Express app to use EJS as its templating engine
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2'],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));
app.use(express.urlencoded({ extended: true }));                  // Built-in middleware in Express. It parses the incoming request with urlencoded payloads

// Handler code on the root path '/'
app.get('/', (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

// Route handler code for "/urls"
app.get('/urls', (req, res) => {
  const userID = req.session.user_id;

  if (!userID) {
    return res.redirect("/login");
  }

  const user = usersDatabase[userID];

  const templateVars = {
    urls: urlsForUser(userID, urlDatabase),
    user: user,
  };
  res.render('urls_index', templateVars);
});

// Route handler that will match the POST request. Refer to end of Note 4 and Note 5.
app.post('/urls', (req, res) => {
  const userID = req.session.user_id;

  if (!userID) {
    return res.send(`Sorry, you do not have access to edit this. Please login in first.`);
  }

  const newID = generateRandomString();
  urlDatabase[newID] = {
    longURL: req.body.longURL,
    userID
  };
  res.redirect(`/urls/${newID}`);
});

// Route handler to render the urls_new.ejs template in the browser to present the form to the user
app.get('/urls/new', (req, res) => {
  const userID = req.session.user_id;

  if (!userID) {
    return res.redirect('/login');
  }

  const user = usersDatabase[userID];
  const templateVars = { user: user };
  res.render('urls_new', templateVars);
});

// Route handler which renders the new template urls_show.
app.get('/urls/:id', (req, res) => {
  const userID = req.session.user_id;

  if (!userID) {
    return res.redirect("/login");
  }

  if (!urlDatabase[req.params.id]) {
    return res.send(`Error. URL does not exist.`);
  }

  if (userID !== urlDatabase[req.params.id].userID) {
    return res.send(`Error. URL does not belong to you.`);
  }

  const user = usersDatabase[userID];
  const longURL = urlDatabase[req.params.id].longURL;

  const templateVars = { id: req.params.id, longURL, user: user };

  res.render('urls_show', templateVars);
});

// Route handler that redirects any request to /u/:id to its longURL.
app.get('/u/:id', (req, res) => {
  const longURL = urlDatabase[req.params.id];
  if (!longURL) {
    return res.send(`That's not the correct ID. Try again.`);
  }

  res.redirect(urlDatabase[req.params.id].longURL);
});

// Route handler to implement a DELETE operation
app.post('/urls/:id/delete', (req, res) => {
  const longURL = urlDatabase[req.params.id];

  const userID = req.session.user_id;

  if (!userID) {
    return res.send(`Please log in first.`);
  }
  if (!longURL) {
    return res.send(`Error. URL does not exist.`);
  }

  if (userID !== urlDatabase[req.params.id].userID) {
    return res.send(`Error. URL does not belong to you.`);
  }
  delete urlDatabase[req.params.id];
  res.redirect('/urls');
});

// Route handler to implement an UPDATE operation
app.post('/urls/:id', (req, res) => {
  const longURL = urlDatabase[req.params.id];

  const userID = req.session.user_id;

  if (!userID) {
    return res.send(`Please log in first.`);
  }
  if (!longURL) {
    return res.send(`Error. URL does not exist.`);
  }

  if (userID !== urlDatabase[req.params.id].userID) {
    return res.send(`Error. URL does not belong to you.`);
  }

  const newLongURL = req.body.longURL;
  const id = req.params.id;

  urlDatabase[id].longURL = newLongURL;

  res.redirect('/urls');
});

// Login Route - Display the login form (get)
app.get('/login', (req, res) => {
  const userID = req.session.user_id;

  if (userID) {
    return res.redirect('/urls');
  }

  const user = usersDatabase[userID];

  const templateVars = { user: user };

  res.render('login', templateVars);
});

// Login Route -> Handle the login (post) and set session
app.post('/login', (req, res) => {
  // extract the form information
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(403).send("Please fill out the form");
  }
  // retrieve the user from the userDatabase with their email
  const user = findUserbyEmail(email, usersDatabase);

  if (!user) {
    return res.status(403).send("No user found with that email");
  }

  if (!bcrypt.compareSync(password, user.password)) {
    return res.status(403).send("Incorrect password");
  }

  // Set session with user id
  req.session.user_id = user.id;
  res.redirect('/urls');
});

// Logout Route
app.post('/logout', (req, res) => {
  // clear session and redirect
  req.session = null;
  res.redirect('/urls');
});

//// Register Routes

// Display the Register form
app.get('/register', (req, res) => {
  const userID = req.session.user_id;

  if (userID) {
    return res.redirect('/urls');
  }

  const user = usersDatabase[userID];
  const templateVars = { user: user };
  res.render('register', templateVars);
});

// Registration Handler
app.post('/register', (req, res) => {
  // extract info
  const { email, password } = req.body;

  // validation => does that user already exist in the userDatabase
  const user = findUserbyEmail(email, usersDatabase);

  if (user) {
    res.status(400).send(`Error 400: Sorry, that user already exists!`);
    return;
  }

  // check if email or password are empty strings => if they are, respond with error code
  if (email === '' || password === '') {
    res.status(400).send(`Error 400: Oops! You left some fields empty. Try again!`);
    return;
  }

  // create a new user in the user db -> provide a user id
  const userID = generateRandomString();

  usersDatabase[userID] = {
    id: userID,
    email: email,
    password: bcrypt.hashSync(password, 10),
  };

  // store the user id in the session
  req.session.user_id = userID;

  // redirect users to /urls page
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});