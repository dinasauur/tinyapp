const { assert } = require('chai');

const { findUserbyEmail } = require('../helpers.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

describe('findUserbyEmail', function() {
  it('should return a user with valid email', function() {
    const user = findUserbyEmail("user@example.com", testUsers)
    const expectedUserID = "userRandomID";
    assert.equal(expectedUserID, user.id)
  });

  it('should return undefined for a non-existent email', function() {
    const user = findUserbyEmail("user@exae.com", testUsers)
    const expectedUserID = false;
    assert.equal(expectedUserID, user)
  });
});