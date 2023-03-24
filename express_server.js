const express = require('express');        // Import the express library      Read Note 6
const bcrypt = require("bcryptjs");        // library that helps with hashing passwords
const app = express();                     // Define our app as an instance of express
const PORT = 8080;                         // Define our base URL as http:\\localhost:8080

const cookieParser = require('cookie-parser'); // Import the cookie-parser
app.set('view engine', 'ejs');             // This tells the Express app to use EJS as its templating engine

// Generate a random short URL ID to be used for when the browser submits a post request. Refer to Note 5.
const generateRandomString = () => {
  return Math.random().toString(36).slice(2, 8);
};

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
};

const usersDatabase = {
  '6gbjcg': {
    id: '6gbjcg',
    email: 'pokemon@catchemall.com',
    password: 'hellopika',
  }
};

const urlsForUser = function(id) {
  const objURL = {};

  for (const key in urlDatabase) {
    if (urlDatabase[key].userID === id) {
      objURL[key] = urlDatabase[key].longURL
    }
  }
  return objURL;
};

const findUserbyEmail = (email) => {
  for (let userID in usersDatabase) {
    if (email === usersDatabase[userID].email) {
      return usersDatabase[userID];
    }
  }
  return false;
};

// This needs to come before all the routes. Why? Refer to Note 4.
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Handler code on the root path '/'
app.get('/', (req, res) => {
  res.send(`Hello!`);
});

// Handler code on additional endpoints.
// res.json sends a JSON response => expect to see a JSON string representing the entire urlDatabase object
app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

// Handler code on sending HTML, which would be rendered in the client browser
app.get('/hello', (req, res) => {
  res.send('<html><body>Hello <b>World</b></body></html>\n');
});

// Route handler code for "/urls" and use res.render() to pass the URL data to our template => send data to urls_index.ejs. Refer to Note 1 below for further explanation.
app.get('/urls', (req, res) => {
  const userID = req.cookies['user_id'];

  if (!userID) {
    return res.redirect("/login")
  }

  const user = usersDatabase[userID];

  const templateVars = {
    urls: urlsForUser(userID),                // templateVars object contains the urlDatabase under the key urls
    user: user,                               // To display the username, we need to pass the username to EJS template so it knows if user is logged and what the username is
  };
  res.render('urls_index', templateVars);     // rendering the templateVars in ejs files
});

// Route handler to render the urls_new.ejs template in the browser to present the form to the user
app.get('/urls/new', (req, res) => {
  const userID = req.cookies['user_id'];

  if (!userID) {
    return res.redirect('/login');
  }
  
  const user = usersDatabase[userID];
  const templateVars = { user: user };
  res.render('urls_new', templateVars);
});

// IMPORTANT WARNING - The order of route definitions matters! Refer to Note 3.

// Route handler that will match the POST request. Refer to end of Note 4 and Note 5.
app.post('/urls', (req, res) => {
  const userID = req.cookies['user_id'];

  // if user is not logged in, this route should response with that message. Refer to Note 5. 
  if (!userID) {
    return res.send(`Sorry, you do not have access to edit this. Please login in first.`)
  }

  const newID = generateRandomString();     // called the generateRandomString funciton created above to create newID
  urlDatabase[newID] = {
    longURL: req.body.longURL,              // Save the longURL and short URL id to the urlDatabase
    userID
  };   
  res.redirect(`/urls/${newID}`);           // Tell browser to go to a new page that shows them the new short url they created
});

// Route handler which renders the new template urls_show. Refer to Note 2.
app.get('/urls/:id', (req, res) => {

  const longURL = urlDatabase[req.params.id];

  const userID = req.cookies['user_id'];
  
  if (!userID) {
    return res.redirect("/login")
  }
  if (!longURL) {                                     // If statement so that if user tries to search up non-existing short-urls MEANING the long-url also does not exist, hence, if long URL does not exist, output error.
    return res.send(`Error. URL does not exist.`);
  }
  
  if (userID !== urlDatabase[req.params.id].userID) {
    return res.send(`Error. URL does not belong to you.`);
  }
  
  const user = usersDatabase[userID];

  const templateVars = { id: req.params.id, longURL, user: user };

  res.render('urls_show', templateVars);
});

// Route handler that redirects any request to /u/:id to its longURL. Refer to end of Note 5.
app.get('/u/:id', (req, res) => {
  const longURL = urlDatabase[req.params.id];
  if (!longURL) {                                               // If longURL does not exist in database, output error
    return res.send(`That's not the correct ID. Try again.`);
  }

  res.redirect(urlDatabase[req.params.id].longURL);
});

// Route handler to implement a DELETE operation to remove existing shortened URLs from our database
app.post('/urls/:id/delete', (req, res) => {
  const longURL = urlDatabase[req.params.id];

  const userID = req.cookies['user_id'];
  
  if (!userID) {
    return res.send(`Please log in first.`)
  }
  if (!longURL) {                                     // If statement so that if user tries to search up non-existing short-urls MEANING the long-url also does not exist, hence, if long URL does not exist, output error.
    return res.send(`Error. URL does not exist.`);
  }
  
  if (userID !== urlDatabase[req.params.id].userID) {
    return res.send(`Error. URL does not belong to you.`);
  }
  delete urlDatabase[req.params.id];
  res.redirect('/urls');
});

// Route handler to implement an UPDATE operation --> Click Edit button, take browser to /urls/:id so in template, it should be GET for the edit button. After browser submits the new URL, redirect browser back to /urls
app.post('/urls/:id', (req, res) => {
  const longURL = urlDatabase[req.params.id];

  const userID = req.cookies['user_id'];
  
  if (!userID) {
    return res.send(`Please log in first.`)
  }
  if (!longURL) {                                                    // If statement so that if user tries to search up non-existing short-urls MEANING the long-url also does not exist, hence, if long URL does not exist, output error.
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

// Login Route - Display the login form (get) - Refer to Note 7
app.get('/login', (req, res) => {
  const userID = req.cookies['user_id'];

  if (userID) {
    return res.redirect('/urls');
  }

  const user = usersDatabase[userID];

  const templateVars = { user: user };

  res.render('login', templateVars);
});

// Login Route -> Handle the login (post) and set cookies
app.post('/login', (req, res) => {
  // extract the form information
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(403).send("Please fill out the form")
  }
  // retrieve the user from the userDatabase with their email
  const user = findUserbyEmail(email) 

  if (!user) {
    return res.status(403).send("No user found with that email")
  }

  if (!bcrypt.compareSync(password, user.password)) {
    return res.status(403).send("Incorrect password")
  }

  // set cookie with user id
  res.cookie('user_id', user.id);
  res.redirect('/urls');
});

// Logout Route 
app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});

//// Register Routes

// Display the Register form
app.get('/register', (req, res) => {
  const userID = req.cookies['user_id'];

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
  const user = findUserbyEmail(email);

  if (user) {
    res.status(400).send(`Error 400: Sorry, that user already exists!`);
    return;
  }

  // check if email or password are empty strings => if they are, respond with error code
  if (email === '' || password === '') {
    res.status(400).send(`Error 400: Oops! You left some fields empty. Try again!`)
  }

  // create a new user in the user db -> provide a user id
  const userID = generateRandomString();

  usersDatabase[userID] = {
    id: userID,
    email: email,
    password: bcrypt.hashSync(password, 10),
  };

  // store the user id in the cookies
  res.cookie('user_id', userID);

  console.log(usersDatabase);
  // redirect users to /urls page
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

/*** NOTE 1
 *  Browse to http://localhost:8080/urls , it will be a blank page right now because there's no content as we haven't created the template yet
 **  HTML SYNTAX
 *  <h1><%= urls %></h1> // In our urls_index file, we can display the value stored in the templateVars object by calling the key urls
 *  Using the <%= %> syntax, we tell EJS that we want the result of this code to show up on our page.
 *  Use <% %> if we want to run some code without displaying on the page (ie. conditional statements)
 */

/*** NOTE 2
 *  We are adding another page to display a single URL and its shortened form. The end point for such a page will be in the format /urls/:id.
 *  The : in front of id indicates that id is a route parameter. This means that the value in this part of the url will be available in the req.params object.
 *  Use the id from the route parameter to lookup it's associated longURL from the urlDatabase
 * 
 *  Filled out the urls_show.ejs template to display the long URL and its shortened form.
 *  Added if statement for error.
 */

/*** NOTE 3
 *  The GET /urls/new route needs to be defined before the GET /urls/:id route. Because routes defined earlier will take precedence.
 *  So, if we place this route after the /urls/:id definition, any calls to /urls/new will be handled by app.get("/urls/:id", ...) because Express will think that new is a route parameter
 *  A good rule of thumb to follow is that routes should be ordered from most specific to least specific.
 *
 **  VISUALIZE HOW THE NEW GET ROUTE IS USED
 *     // Browser //                                                      // Server //
 *  1. Browser requests new url form    ->    2. GET/urls/new     ->    3. Server finds the "urls_new" template, generates the HTML, and sends it back to the browser
 *  5. Browser renders the HTML form received from server         <-    4. 200 ok
 *
 *  When we navigate to /urls/new in our browser, our browser makes a GET request to our newly created route.
 *  Our sever responds by finding urls_new template, generating the HTML, and sending it back to the browser.
 *  The browser then renders this HTML.
 */

/*** NOTE 4
 *  When our browser submits a POST request, the data in the request body is sent as a Buffer. While this data type is great for transmitting data, it's not readable for us humans.
 *  To make this data readable, we will need to use another piece of middleware which will translate, or parse the body. This feature is part of Express.
 *  The body-parser library will convert the request body from a Buffer into string that we can read. It will then add the data to the req(request) object under the key body.
 *  (If you find that req.body is undefined, it may be that the body-parser middleware is not being run correctly.)
 *  The data in the input field will be avaialbe to us in the req.body.longURL variable, which we can store in our urlDatabase object
 *
 *** EXPLANATION OF WHAT THE POST HANDLER CODE DOES
 * After our browser renders our new URL form, the user populates the form with a longURL and presses submit.
 * Our browser sends a POST request to our server
 * Our server logs the request body to the console, then responds with 200 OK.
 * Our browser renders the "Ok" message.
 *
 *** SIDE NOTE
 * We'll be able to see the new form in the browser at /urls/new. How? This is what we did in the form (in urls_new template) ->
 * a) The form has an action attribute set to /urls
 * b) The form's method is set to POST
 * c) The form has one named input, with the name attribute set to longURL
 * This means that when this form is submitted, it will make a request to POST /urls, and the body will contain one URL-encoded name-value pair with the name longURL.
 *
 * Note that the input has been parsed into a JS object, where longURL is the key; we specified this key using the input attribute name. The value is the content from the input field.
 * Input looked like this -> { longURL: '' }, without the body-parser middleware, the input would have looked like longURL=http%3A%2F%google.com
 */

/*** NOTE 5
 * GENERATE A RANDOM SHORT URL ID - returns a string of 6 random alphanumeric characters to be returned back to the browser. To do so, update the POST handler.
 *** EXPLANATION OF THE POST HANDLER AFTER CHANGES
 * We generated a new short URL id and then redirected the user to this new url.
 * We learned that when the browser receives a redirection response, it does another GET request to the url in the response
 * Using the id, our server looks up the longURL from the database, sends the id and longURL to the urls_show template, generates the HTML, and then sends this HTML back to the browser
 * The browser then renders this HTML
 *
 *** EXPLANATION OF NEW ROUTE HANDLER
 * We created a new route for handling our redirect links where requests to '/u/:id' is redirected to its actual longURL
 * This route obtained the id from the route parameters, looked up the corresponding longURL from our urlDatabase, and responded with a redirect to the longURL
 * We tested that our new route is working as expected by making requests to it with the command line tool curl and our browser
 * Added an if statement for errors
 * 
 *** EXPLANATION OF THE IF STATEMENT
 * Remember, even though we redirect the GET /urls/new requests to GET /login, we still have to protect the POST /urls route too. 
 * Hiding the page to submit new urls isn't enough - a malicious user could use simple curl commands to interact with our server.
 * Use this curl command to test the POST /urls => curl -X POST -d "longURL=http://www.lighthouselabs.com" localhost:8080/urls
 */

/*** NOTE 6 - WHAT IS EXPRESS?
* Express.js is a Node js web application server framework, which is specifically designed for building single-page, multi-page, and hybrid web applications.
* It has become the standard server framework for node.js. Express is the backend part of something known as the MEAN stack.
* The MEAN is a free and open-source JavaScript software stack for building dynamic web sites and web applications which has the following components;
* 1) MongoDB – The standard NoSQL database
* 2) Express.js – The default web applications framework
* 3) Angular.js – The JavaScript MVC framework used for web applications
* 4) Node.js – Framework used for scalable server-side and networking applications.
* The Express.js framework makes it very easy to develop an application which can be used to handle multiple types of requests like the GET, PUT, and POST and DELETE requests.
*** HOW DOES EXPRESS AND EJS WORK TOGETHER?
* Express is just sending and receiving requests. EJS translates those templates into actual HTML.
* EJS is like a filter that Express uses to turn templates into web pages, and as it sends its information through the filter, what you end up with is what the user ends up seeing in their browser.
*/

/*** CONCLUSION
*** NOTE 1 - 2
*  We used the Express render method to respond to requests by sending back a template, along with an object containing the data the template needs.
*  We then used EJS to render this data to our web page.
*  We used Express route parameters to pass data from our frontend to our backend via the request url.
*  Finally, we created a partial template for our header so that we can have the code for it in one location, but render it on multiple pages
*** NOTE 3 - 5
*  We first created a form (urls_new.ejs) that allowed a user to input a longURL and send that data to our API via a POST request
*  We then created a route that would render this form when the user visited /urls/new.
*  We also created a route to handle the POST requests from our form. We used the Express library's body parsing middleware to make the POST request body human readable
*  We generated a random string to serve as our shortURL and saved that in the database alongside the longURL submitted by the browser
*  We created a new route to handle redirect links where the short url redirects to the longURL
*/

/*** NOTE 7 - COOKIES and DISPLAY USERNAME
 * Username won't show yet just because a route was set up. We need to modify existing routes on the server in order to rener templates properly. 
 * This can be done by passing username to each EJS template so that it knows if the user is logged in, and what their username is.
 * Pass in the username to all views that include the _header.ejs partial
 * And modify the _header.ejs partial to display the passed-in username next to the form.
 */
