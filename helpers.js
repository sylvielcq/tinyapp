// Helper function that checks if an email already exists in a database.
// Takes in 2 arguments: an email address and a database object.
// If the email is found in the database, the function returns the corresponding user object.
// Otherwise, the function returns "null".
const getUserByEmail = function(email, database) {
  for (let user in database) {
    if (database[user]["email"] === email) {
      return database[user];
    }
  }
  return null;
};



// Helper function that returns only the URLs that were created by the logged in User.
// Takes in 2 arguments: a user ID, and a database of URLs (object).
// Returns an object containing only the URLs associated with the given user ID.
const urlsForUser = function(id, database) {
  let result = {};
  for (let url in database) {
    if (database[url].userID === id) {
      result[url] = database[url];
    }
  }
  return result;
};



// Helper function that generate random short URLs.
// Takes no argument. 
// Returns a string of 6 random alphanumeric characters.
const generateRandomString = function() {
  let alphNum = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890';
  let result = '';
  for (let i = 0; i < 6; i++) {
    let j = Math.floor(Math.random() * (alphNum.length - 1));
    result += alphNum[j];
  }
  return result;
};


module.exports = { getUserByEmail, generateRandomString, urlsForUser };