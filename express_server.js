const { Template } = require("ejs");
const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs"); // This tells the Express app to use EJS as its templating engine

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

// This needs to come before all the routes. Why? Refer to Note 4.
app.use(express.urlencoded({ extended: true }));

// Handler code on the root path '/'
app.get("/", (req, res) => {
  res.send("Hello!");
});

// Handler code on additional endpoints.
// res.json sends a JSON response => expect to see a JSON string representing the entire urlDatabase object 
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// Handler code on sending HTML, which would be rendered in the client browser
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

// Route handler code for "/urls" and use res.render() to pass the URL data to our template => send data to urls_index.ejs. Refer to Note 1 below for further explanation.
app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase }; // templateVars object contains the urlDatabase under the key urls
  res.render("urls_index", templateVars); // passing the templateVars object to the template called "urls_index"
});   

// Route handler to render the urls_new.ejs template in the browser to present the form to the user
app.get("/urls/new", (req, res) => {
  res.render("urls_new");
})

// IMPORTANT WARNING - The order of route definitions matters! Refer to Note 3. 

// Route handler that will match the POST request. Refer to end of Note 4. 
app.post("/urls", (req, res) => {
  console.log(req.body); // Log the POST request body to the console
  res.send("Ok"); // Respond with 'Ok' (we will replace this)
});

// Route handler which renders the new template urls_show. Refer to Note 2. 
app.get("/urls/:id", (req, res) => {
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id] }; 
  res.render("urls_show", templateVars);
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
  *  Filled out the urls_show.ejs template to display the long URL and its shortened form. Also included a link (href="#") for creating a new url.
  */

 /*** CONCLUSION
  *  We used the Express render method to respond to requests by sending back a template, along with an object containing the data the template needs. 
  *  We then used EJS to render this data to our web page. 
  *  We used Express route parameters to pass data from our frontend to our backend via the request url. 
  *  Finally, we created a partial template for our header so that we can have the code for it in one location, but render it on multiple pages
  */

 /*** NOTE 3
  *  The GET /urls/new route needs to be defined before the GET /urls/:id route. Because routes defined earlier will take precedence.
  *  So, if we place this route after the /urls/:id definition, any calls to /urls/new will be handled by app.get("/urls/:id", ...) because Express will think that new is a route parameter
  *  A good rule of thumb to follow is that routes should be ordered from most specific to least specific.
  * 
  **  VISUALIZE HOW THE NEW GET ROUTE IS USED
  *     // Browser //                                                      // Server //
  *  1. Browser requests new url form    ->    2. GET/urls/new     ->    3. Server finds the "urls_nwe" template, generates the HTML, and sends it back to the browser
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
  ** EXPLANATION OF WHAT THE POST HANDLER CODE DOES
  * We'll be able to see the new form in the browser at /urls/new. How? This is what we did in the form (in urls_new template) ->
  * a) The form has an action attribute set to /urls
  * b) The form's method is set to POST
  * c) The form has one named input, with the name attribute set to longURL
  * This means that when this form is submitted, it will make a request to POST /urls, and the body will contain one URL-encoded name-value pair with the name longURL.
  *
  *  Note that the input has been parsed into a JS object, where longURL is the key; we specified this key using the input attribute name. The value is the content from the input field. 
  *  Input looked like this -> { longURL: '' }, without the body-parser middleware, the input would have looked like longURL=http%3A%2F%google.com
  */



