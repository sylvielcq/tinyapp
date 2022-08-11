const express = require("express");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const app = express();
const PORT = 8080; // default port 8080


// USERS DATABASE
const users = {
  aJ48lW: {
    id: "aJ48lW",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  test12: {
    id: "test12",
    email: "123@123.com",
    password: "123",
  },
};


// URLS DATABASE
const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW"
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW"
  }
};


// Helper function that generate short URLs IDs
const generateRandomString = function() {
  let alphNum = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890';
  let result = '';
  for (let i = 0; i < 6; i++) {
    let j = Math.floor(Math.random() * (alphNum.length - 1));
    result += alphNum[j];
  }
  return result;
};


// Helper function that checks if an email already exists in the users database
const getUserByEmail = function(email) {
  for (let user in users) {
    if (users[user]["email"] === email) {
      return users[user];
    }
  }
  return null;
};


// Helper function that returns only the URLs that were created by the logged in User
const urlsForUser = function(id) {
  let result = {};
  for (let url in urlDatabase) {
    if (urlDatabase[url].userID === id) {
      result[url] = urlDatabase[url];
    }
  }
  return result;
};


// MIDDLEWARE
app.use(morgan("dev"));
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


// ROUTES

// HOMEPAGE
app.get("/", (req, res) => {
  res.send("Hello!");
});


// GET /urls.json
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});


// HELLO page
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});


// REGISTER page
app.get("/register", (req, res) => {
  let user = users[req.cookies["user_id"]];

  if (user) {    // Checking if user is already logged in
    return res.redirect("/urls");
  }

  const templateVars = { user: user };
  res.render("register", templateVars);
});


// REGISTER handler
app.post("/register", (req, res) => {
  let randomId = generateRandomString();
  let newEmail = req.body.email;
  let newPassword = req.body.password;

  if (!newEmail || !newPassword) {    // If email or password are empty
    res.statusCode = 400;
    return res.send("ERROR: Email or Password cannot be empty. Please try again.");
  }

  if (getUserByEmail(newEmail) !== null) {    // If email already exists in database
    res.statusCode = 400;
    return res.send("ERROR: This email is already registered. Please log in.");
  }

  users[randomId] = {
    id: randomId,
    email: newEmail,
    password: newPassword
  };
  res.cookie("user_id", randomId);
  res.redirect("/urls");
});


// LOGIN page
app.get("/login", (req, res) => {
  let user = users[req.cookies["user_id"]];

  if (user) {    // Checking if user is already logged in
    return res.redirect("/urls");
  }

  const templateVars = { user: user };
  res.render("login", templateVars);
});


// LOGIN handler
app.post("/login", (req, res) => {
  const userLookup = getUserByEmail(req.body.email);

  if (userLookup === null) {
    res.statusCode = 403;
    return res.send("We cannot find an account with this email address. Please try again, or register a new Account.");
  }

  if (userLookup !== null) {
    if (req.body.password !== userLookup.password) {
      res.statusCode = 403;
      return res.send("Incorrect password. Please try again.");
    }
    res.cookie("user_id", userLookup.id);
    res.redirect("/urls");
  }
});


// LOGOUT handler (button in Header)
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});


// URLS INDEX page
app.get("/urls", (req, res) => {
  let user = users[req.cookies["user_id"]];
  let userUrls = urlsForUser(req.cookies["user_id"]);
  const templateVars = {
    user: user,
    urls: userUrls
  };

  if (!user) {    // Checking if user is not logged in
    res.render("not_logged_in", templateVars);
  }

  res.render("urls_index", templateVars);
});


// NEW URL page
app.get("/urls/new", (req, res) => {
  let user = users[req.cookies["user_id"]];

  if (!user) {    // Checking if user is not logged in
    return res.redirect("/login");
  }

  const templateVars = { user: user };
  res.render("urls_new", templateVars);
});


// NEW URL handler
app.post("/urls", (req, res) => {
  let user = users[req.cookies["user_id"]];

  if (!user) {    // Checking if user is not logged in
    const templateVars = { user: user };
    res.render("not_logged_in", templateVars);
  }

  let id = generateRandomString();
  let newUserId = req.cookies["user_id"];
  let newLongURL = req.body.longURL;
  urlDatabase[id] = {
    longURL: newLongURL,
    userID: newUserId
  };
  res.redirect(`/urls/${id}`);
});


// SPECIFIC URL page
app.get("/urls/:id", (req, res) => {
  let user = users[req.cookies["user_id"]];
  let userUrls = urlsForUser(req.cookies["user_id"]);
  const templateVars = {
    user: user,
    id: req.params.id,
    longURL: urlDatabase[req.params.id].longURL
  };

  if (!user) {    // Checking if user is not logged in
    res.render("not_logged_in", templateVars);
  }

  if (!userUrls[req.params.id]) {    // If URL Id does not belong to the logged in user
    res.StatusCode = 404;
    res.render("404", templateVars);
  }

  res.render("urls_show", templateVars);
});


// UPDATE URL handler
app.post("/urls/:id", (req, res) => {
  let user = users[req.cookies["user_id"]];
  let id = req.params.id;
  let userUrls = urlsForUser(req.cookies["user_id"]);
  const templateVars = { user: user };

  if (!urlDatabase[id]) {    // If URL Id does not exist
    res.StatusCode = 404;
    res.render("404", templateVars);
  }

  if (!user) {    // If user is not logged in
    res.render("not_logged_in", templateVars);
  }

  if (!userUrls[req.params.id]) {    // If URL Id does not belong to the logged in user
    res.StatusCode = 404;
    res.render("404", templateVars);
  }

  let newLongURL = req.body.longURL;
  urlDatabase[id] = {
    longURL: newLongURL,
    userID: user.id
  };
  console.log("URL Database: ", urlDatabase)
  res.redirect("/urls");
});


// DELETE URL handler
app.post("/urls/:id/delete", (req, res) => {
  let user = users[req.cookies["user_id"]];
  let id = req.params.id;
  let userUrls = urlsForUser(req.cookies["user_id"]);
  const templateVars = { user: user };

  if (!urlDatabase[id]) {    // If URL Id does not exist
    res.StatusCode = 404;
    res.render("404", templateVars);
  }

  if (!user) {    // If user is not logged in
    res.render("not_logged_in", templateVars);
  }

  if (!userUrls[req.params.id]) {    // If URL Id does not belong to the logged in user
    res.StatusCode = 404;
    res.render("404", templateVars);
  }

  delete urlDatabase[id];
  res.redirect("/urls");
});


// REDIRECTING short URLs to their long URLs
app.get("/u/:id", (req, res) => {
  let id = req.params.id;

  if (!urlDatabase[id]) {
    let user = users[req.cookies["user_id"]];
    const templateVars = { user: user };
    res.StatusCode = 404;
    res.render("404", templateVars);
  }

  res.redirect(urlDatabase[id].longURL);
});


// CATCHALL for pages that don't exist
app.get('/*', (req, res) => {
  let user = users[req.cookies["user_id"]];
  const templateVars = { user: user };
  res.StatusCode = 404;
  res.render("404", templateVars);
});


// Server LISTEN
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
