const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
};

// comparing urlDayabase[id].userID
// logged-in user's ID from their cookie

const urlsForUser = function(id) {
  const id = urlDayabase[id].userID
  console.log(id)
};

urlsForUser();
