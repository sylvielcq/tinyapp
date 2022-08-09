const express = require("express");
const morgan = require("morgan");
const app = express();
const PORT = 8080; // default port 8080

// Used during Post request to generate short URLs IDs
const generateRandomString = function() {
  const result = Math.random().toString(36).slice(2, 8);
  return result;
};

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

// middleware
app.use(morgan("dev"));
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));

// GET Homepage
app.get("/", (req, res) => {
  res.send("Hello!");
});

// GET /urls.son
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// GET /hello
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

// GET /urls
// Using an Object to send the UrlDatabase to the EJS template
app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

// GET /urls/new
app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

// POST /urls
// Generates a short URL ID, stores it with the long URL gotten from the user form in the UrlDatabase.
// Redirects user to /urls/:id
app.post("/urls", (req, res) => {
  let randomString = generateRandomString();
  urlDatabase[randomString] = req.body.longURL;
  console.log(req.body); // Log the POST request body to the console
  res.redirect(`/urls/${randomString}`);
});

// GET /urls/:id
// User redirected here after submitting a long URL through the form on /urls
app.get("/urls/:id", (req, res) => {
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id] };
  res.render("urls_show", templateVars);
});

// GET /u/:id
// Redirecting short URLs to their long URLs
app.get("/u/:id", (req, res) => {
  res.redirect(urlDatabase[req.params.id]);
});

// GET Catchall
app.get('*', (req, res) => {
  res.StatusCode = 404;
  res.render("Error: the page doesn't exist.");
});

// Server LISTEN
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
