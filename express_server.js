const express = require("express");
const morgan = require("morgan");
const cookieSession = require("cookie-session");
const bcrypt = require("bcryptjs");
const { getUserByEmail, generateRandomString, urlsForUser } = require('./helpers');
const methodOverride = require("method-override");
const app = express();
const PORT = 8080;


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


// MIDDLEWARE
app.use(morgan("dev"));
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(cookieSession({
  name: 'session',
  keys: ['abracadabra', 'expelliarmus']
}));


// ROUTES

// HOMEPAGE
app.get("/", (req, res) => {
  let user = users[req.session["user_id"]];

  if (user) {              // If user is already logged in
    return res.redirect("/urls");
  }
  res.redirect("/login");  // If user is not logged in
});


// REGISTER page
app.get("/register", (req, res) => {
  let user = users[req.session["user_id"]];

  if (user) {                           // If user is already logged in
    return res.redirect("/urls");
  }

  const templateVars = { user: user };  // If user is not logged in
  res.render("register", templateVars);
});


// REGISTER handler
app.post("/register", (req, res) => {
  let randomId = generateRandomString();
  let newEmail = req.body.email;
  let newPassword = req.body.password;

  if (!newEmail || !newPassword) {    // If email or password are empty
    let user = users[req.session["user_id"]];
    const templateVars = { user: user };
    return res.status(400).render("error_no_email", templateVars);
  }

  if (getUserByEmail(newEmail, users) !== null) {    // If email already exists in database
    let user = users[req.session["user_id"]];
    const templateVars = { user: user };
    return res.status(400).render("error_email_registered", templateVars);
  }

  bcrypt.genSalt(10)                  // Else
    .then((salt) => {
      return bcrypt.hashSync(newPassword, salt);
    })
    .then((hash) => {
      users[randomId] = {
        id: randomId,
        email: newEmail,
        password: hash
      };
      req.session["user_id"] = randomId;
      res.redirect("/urls");
    });
});


// LOGIN page
app.get("/login", (req, res) => {
  let user = users[req.session["user_id"]];

  if (user) {                          // If user is already logged in
    return res.redirect("/urls");
  }

  const templateVars = { user: user }; // If user is not logged in
  res.render("login", templateVars);
});


// LOGIN handler
app.post("/login", (req, res) => {
  const userLookup = getUserByEmail(req.body.email, users);

  if (userLookup === null) {     // If the email doesn't exist in the Users database
    let user = users[req.session["user_id"]];
    const templateVars = { user: user };
    return res.status(403).render("error_no_account", templateVars);
  }

  if (userLookup !== null) {     // If the email exists in the Users database
    const passwordCheck = bcrypt.compareSync(req.body.password, userLookup.password);
    
    if (!passwordCheck) {        // But the password doesn't match with the password in the database
      let user = users[req.session["user_id"]];
      const templateVars = { user: user };
      return res.status(403).render("error_no_email", templateVars);
    }

    req.session["user_id"] = userLookup.id;  // If the email is valid, and the passwords match
    res.redirect("/urls");
  }
});


// LOGOUT handler (button in Header)
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});


// URLS INDEX page
app.get("/urls", (req, res) => {
  let user = users[req.session["user_id"]];
  let userUrls = urlsForUser(req.session["user_id"], urlDatabase);
  const templateVars = {
    user: user,
    urls: userUrls
  };

  if (!user) {                            // If user is not logged in
    return res.render("error_not_logged_in", templateVars);
  }

  res.render("urls_index", templateVars); // If user is logged in
});


// NEW URL page
app.get("/urls/new", (req, res) => {
  let user = users[req.session["user_id"]];

  if (!user) {                          // If user is not logged in
    return res.redirect("/login");
  }

  const templateVars = { user: user };  // If user is logged in
  res.render("urls_new", templateVars);
});


// NEW URL handler
app.post("/urls", (req, res) => {
  let user = users[req.session["user_id"]];

  if (!user) {                     // If user is not logged in
    const templateVars = { user: user };
    return res.render("error_not_logged_in", templateVars);
  }

  let id = generateRandomString(); // If user is logged in
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
  let userUrls = urlsForUser(req.session["user_id"], urlDatabase);
  let id = req.params.id;
  
  if (!urlDatabase[id]) {      // If URL Id does not exist
    const templateVars = { user: user }
    return res.status(404).render("error_404", templateVars);
  }

  if (!user) {                 // If user is not logged in
    const templateVars = { user: user }
    return res.render("error_not_logged_in", templateVars);
  }

  if (!userUrls[id]) {         // If URL Id does not belong to the logged in user
    const templateVars = { user: user }
    return res.render("error_404", templateVars);
  }

  const templateVars = {       // If user is logged in and owns the URL Id
    user: user,
    id: id,
    longURL: urlDatabase[id].longURL
  };
  res.render("urls_show", templateVars);
});


// UPDATE URL handler
app.put("/urls/:id", (req, res) => {
  let user = users[req.session["user_id"]];
  let id = req.params.id;
  let userUrls = urlsForUser(req.session["user_id"], urlDatabase);
  const templateVars = { user: user };

  if (!urlDatabase[id]) {            // If URL Id does not exist
    return res.status(404).render("error_404", templateVars);
  }

  if (!user) {                       // If user is not logged in
    return res.render("error_not_logged_in", templateVars);
  }

  if (!userUrls[req.params.id]) {    // If URL Id does not belong to the logged in user
    return res.render("error_404", templateVars);
  }

  let newLongURL = req.body.longURL; // If user is logged in and owns the URL Id
  urlDatabase[id] = {
    longURL: newLongURL,
    userID: user.id
  };
  res.redirect("/urls");
});


// DELETE URL handler
app.delete("/urls/:id/delete", (req, res) => {
  let user = users[req.session["user_id"]];
  let id = req.params.id;
  let userUrls = urlsForUser(req.session["user_id"], urlDatabase);
  const templateVars = { user: user };

  if (!urlDatabase[id]) {            // If URL Id does not exist
    return res.status(404).render("error_404", templateVars);
  }

  if (!user) {                       // If user is not logged in
    return res.render("error_not_logged_in", templateVars);
  }

  if (!userUrls[req.params.id]) {    // If URL Id does not belong to the logged in user
    return res.render("error_404", templateVars);
  }

  delete urlDatabase[id];            // If user is logged in and owns the URL Id
  res.redirect("/urls");
});


// REDIRECTING short URLs to their long URLs
app.get("/u/:id", (req, res) => {
  let id = req.params.id;

  if (!urlDatabase[id]) {                 // If URL Id does not exist
    let user = users[req.session["user_id"]];
    const templateVars = { user: user };
    return res.status(404).render("error_404", templateVars);
  }

  res.redirect(urlDatabase[id].longURL);  // If URL id is valid
});


// CATCHALL for pages that don't exist
app.get('/*', (req, res) => {
  let user = users[req.session["user_id"]];
  const templateVars = { user: user };
  res.status(404).render("error_404", templateVars);
});


// Server LISTEN
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}!`);
});
