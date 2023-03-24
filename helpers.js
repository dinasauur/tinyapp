// Generate a random short URL ID to be used for when the browser submits a post request. Refer to Note 5.
const generateRandomString = () => {
    return Math.random().toString(36).slice(2, 8);
  };


const urlsForUser = function(id, urlDatabase) {
    const objURL = {};
  
    for (const key in urlDatabase) {
      if (urlDatabase[key].userID === id) {
        objURL[key] = urlDatabase[key].longURL
      }
    }
    return objURL;
  };
  
  const findUserbyEmail = (email, usersDatabase) => {
    for (let userID in usersDatabase) {
      if (email === usersDatabase[userID].email) {
        return usersDatabase[userID];
      }
    }
    return false;
  };

  module.exports = {
    generateRandomString,
    urlsForUser,
    findUserbyEmail
  }

