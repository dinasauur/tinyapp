const { Template } = require("ejs");
const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs"); // This tells the Express app to use EJS as its templating engine

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

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

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


/*** NOTE 1
 * Browse to http://localhost:8080/urls , it will be a blank page right now because there's no content as we haven't created the template yet
 ** HTML SYNTAX
 * <h1><%= urls %></h1> // In our urls_index file, we can display the value stored in the templateVars object by calling the key urls
 * Using the <%= %> syntax, we tell EJS that we want the result of this code to show up on our page.
 * Use <% %> if we want to run some code without displaying on the page (ie. conditional statements)
 */
