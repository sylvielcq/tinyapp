const express = require("express");
const morgan = require("morgan");
const cookieSession = require("cookie-session");
const bcrypt = require("bcryptjs");
const app = express();
const PORT = 8080; // default port 8080


// USERS DATABASE
const users = {
  UEheRY: {
    id: 'UEheRY',
    email: 'test@test.com',
    password: '$2a$10$zQtq1G7F0PYhDjHEP.QfEeJCXuGxwfZYMAd.lsS/N74r9QH/JnjM.'
  },
  IzA8hG: {
    id: 'IzA8hG',
    email: '123@123.com',
    password: '$2a$10$QTy5jDEzJijEF5LbH7zlmOLpu2WeJmd2RNH6LSNup5N47/6.lk2iO'
  }
};


// URLS DATABASE
const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "UEheRY"
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "IzA8hG"
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
app.use(cookieSession({
  name: 'session',
  keys: ['abracadabra', 'expelliarmus']
}));


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
  let user = users[req.session["user_id"]];

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

  bcrypt.genSalt(10)
    .then((salt) => {
      console.log("salt :", salt);
      return bcrypt.hashSync(newPassword, salt);
    })
    .then((hash) => {
      console.log("hash :", hash);
      users[randomId] = {
        id: randomId,
        email: newEmail,
        password: hash
      };
      console.log("users db :", users);
      req.session["user_id"] = randomId;
      res.redirect("/urls");
    });
});


// LOGIN page
app.get("/login", (req, res) => {
  let user = users[req.session["user_id"]];

  if (user) {    // Checking if user is already logged in
    return res.redirect("/urls");
  }

  const templateVars = { user: user };
  res.render("login", templateVars);
});


// LOGIN handler
app.post("/login", (req, res) => {
  const userLookup = getUserByEmail(req.body.email);
  const passwordCheck = bcrypt.compareSync(req.body.password, userLookup.password);

  if (userLookup === null) {    // If the email doesn't exist in the Users database
    res.statusCode = 403;
    return res.send("We cannot find an account with this email address. Please try again, or register a new Account.");
  }

  if (userLookup !== null) {    // If the email exists in the Users database
    if (!passwordCheck) {    // If the password doesn't match with the password in the database
      res.statusCode = 403;
      return res.send("Incorrect password. Please try again.");
    }
    req.session["user_id"] = userLookup.id;
    res.redirect("/urls");
  }
});


// LOGOUT handler (button in Header)
app.post("/logout", (req, res) => {
  delete req.session.user_id;
  res.redirect("/urls");
});


// URLS INDEX page
app.get("/urls", (req, res) => {
  let user = users[req.session["user_id"]];
  let userUrls = urlsForUser(req.session["user_id"]);
  const templateVars = {
    user: user,
    urls: userUrls
  };

  if (!user) {    // Checking if user is not logged in
    return res.render("not_logged_in", templateVars);
  }

  res.render("urls_index", templateVars);
});


// NEW URL page
app.get("/urls/new", (req, res) => {
  let user = users[req.session["user_id"]];

  if (!user) {    // Checking if user is not logged in
    return res.redirect("/login");
  }

  const templateVars = { user: user };
  res.render("urls_new", templateVars);
});


// NEW URL handler
app.post("/urls", (req, res) => {
  let user = users[req.session["user_id"]];

  if (!user) {    // Checking if user is not logged in
    const templateVars = { user: user };
    res.render("not_logged_in", templateVars);
  }

  let id = generateRandomString();
  let newUserId = req.session["user_id"];
  let newLongURL = req.body.longURL;
  urlDatabase[id] = {
    longURL: newLongURL,
    userID: newUserId
  };
  res.redirect(`/urls/${id}`);
});


// SPECIFIC URL page
app.get("/urls/:id", (req, res) => {
  let user = users[req.session["user_id"]];
  let userUrls = urlsForUser(req.session["user_id"]);
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
  let user = users[req.session["user_id"]];
  let id = req.params.id;
  let userUrls = urlsForUser(req.session["user_id"]);
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
  console.log("URL Database: ", urlDatabase);
  res.redirect("/urls");
});


// DELETE URL handler
app.post("/urls/:id/delete", (req, res) => {
  let user = users[req.session["user_id"]];
  let id = req.params.id;
  let userUrls = urlsForUser(req.session["user_id"]);
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
    let user = users[req.session["user_id"]];
    const templateVars = { user: user };
    res.StatusCode = 404;
    res.render("404", templateVars);
  }

  res.redirect(urlDatabase[id].longURL);
});


// CATCHALL for pages that don't exist
app.get('/*', (req, res) => {
  let user = users[req.session["user_id"]];
  const templateVars = { user: user };
  res.StatusCode = 404;
  res.render("404", templateVars);
});


// Server LISTEN
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
