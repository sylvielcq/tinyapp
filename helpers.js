// Helper function that checks if an email already exists in the users database
const getUserByEmail = function(email, database) {
  for (let user in database) {
    if (database[user]["email"] === email) {
      return database[user];
    }
  }
  return null;
};



// Helper function that returns only the URLs that were created by the logged in User
const urlsForUser = function(id, database) {
  let result = {};
  for (let url in database) {
    if (database[url].userID === id) {
      result[url] = database[url];
    }
  }
  return result;
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


module.exports = { getUserByEmail, generateRandomString, urlsForUser };