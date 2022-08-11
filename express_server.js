const express = require("express");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const app = express();
const PORT = 8080; // default port 8080

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

// USERS DATABASE
const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

// URLS DATABASE
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

// MIDDLEWARE
app.use(morgan("dev"));
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

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
  if (req.cookies["user_id"]) {
    res.redirect("/urls");
  }
  const user = users[req.cookies["user_id"]];
  const templateVars = { user: user };
  res.render("register", templateVars);
});

// REGISTER handler
app.post("/register", (req, res) => {
  if (!req.body.email || !req.body.password) {
    res.statusCode = 400;
    res.send("ERROR: Email or Password cannot be empty. Please try again.");
  }
  if (getUserByEmail(req.body.email) !== null) {
    res.statusCode = 400;
    res.send("ERROR: This email is already registered. Please log in.");
  }
  let randomId = generateRandomString();
  let newEmail = req.body.email;
  let newPassword = req.body.password;
  users[randomId] = {
    id: randomId,
    email: newEmail,
    password: newPassword
  };
  res.cookie("user_id", randomId);
  console.log(users); // log users database
  res.redirect("/urls");
});

// LOGIN page
app.get("/login", (req, res) => {
  if (req.cookies["user_id"]) {
    res.redirect("/urls");
  }
  const user = users[req.cookies["user_id"]];
  const templateVars = { user: user };
  res.render("login", templateVars);
});

// LOGIN handler
app.post("/login", (req, res) => {
  const userLookup = getUserByEmail(req.body.email);
  if (userLookup === null) {
    res.statusCode = 403;
    res.send("We cannot find an account with this email address. Please try again, or register a new Account.");
  }
  if (userLookup !== null) {
    if (req.body.password !== userLookup.password) {
      res.statusCode = 403;
      res.send("Incorrect password. Please try again.");
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

// NEW URL page
app.get("/urls/new", (req, res) => {
  const user = users[req.cookies["user_id"]];
  const templateVars = { user: user };
  res.render("urls_new", templateVars);
});

// NEW URL handler
app.post("/urls", (req, res) => {
  let randomString = generateRandomString();
  urlDatabase[randomString] = req.body.longURL;
  console.log(req.body); // Log the POST request body to the console
  res.redirect(`/urls/${randomString}`);
});

// URLS INDEX page
app.get("/urls", (req, res) => {
  const user = users[req.cookies["user_id"]];
  const templateVars = {
    user: user,
    urls: urlDatabase
  };
  res.render("urls_index", templateVars);
});

// SPECIFIC URL page
app.get("/urls/:id", (req, res) => {
  const user = users[req.cookies["user_id"]];
  const templateVars = {
    user: user,
    id: req.params.id,
    longURL: urlDatabase[req.params.id]
  };
  res.render("urls_show", templateVars);
});

// UPDATE URL handler
app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body.longURL;
  res.redirect("/urls");
});

// DELETE URL handler
app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

// REDIRECTING short URLs to their long URLs
app.get("/u/:id", (req, res) => {
  res.redirect(urlDatabase[req.params.id]);
});

// CATCHALL for pages that don't exist
app.get('/*', (req, res) => {
  res.StatusCode = 404;
  res.send("Error: the page doesn't exist.");
});

// Server LISTEN
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
