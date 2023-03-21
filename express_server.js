const { Template } = require("ejs");       // Import the ejs template engine  Read Note 6
const express = require("express");        // Import the express library      Read Note 6
const app = express();                     // Define our app as an instance of express
const PORT = 8080;                         // Define our base URL as http:\\localhost:8080

app.set("view engine", "ejs");             // This tells the Express app to use EJS as its templating engine

// Generate a random short URL ID to be used for when the browser submits a post request. Refer to Note 5. 
function generateRandomString() {
  return Math.random().toString(36).slice(2, 8);
};

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
  res.render("urls_index", templateVars);     // passing the templateVars object to the template called "urls_index"
});

// Route handler to render the urls_new.ejs template in the browser to present the form to the user
app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

// IMPORTANT WARNING - The order of route definitions matters! Refer to Note 3. 

// Route handler that will match the POST request. Refer to end of Note 4 and Note 5. 
app.post("/urls", (req, res) => {
  console.log(req.body);                    // Log the POST request body to the console
  const newID = generateRandomString();     // called the generateRandomString funciton created above to create newID
  urlDatabase[newID] = req.body.longURL;    // Save the longURL and short URL id to the urlDatabase
  res.redirect(`/urls/${newID}`);           // Tell browser to go to a new page that shows them the new short url they created
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
 * After we generate our new short URL id, we add it to our database.
 * Our server then responds with a redirect to /urls/:id
 * Our browser then makes a GET request to /urls/:id
 * Using the id, our server looks up the longURL from the database, sends the id and longURL to the urls_show template, generates the HTML, and then sends this HTML back to the browser
 * The browser then renders this HTML
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
*  We generated a random string to serve as our shortURL.
*
*/

