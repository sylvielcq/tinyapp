// Helper function that checks if an email already exists in the users database
const getUserByEmail = function(email, database) {
  for (let user in database) {
    if (database[user]["email"] === email) {
      return database[user];
    }
  }
  return null;
};

module.exports = { getUserByEmail };