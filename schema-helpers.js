const axios = require("axios");

const getUserById = id =>
  axios.get(`http://localhost:3000/users/${id}`).then(res => res.data);

exports.getUserById = getUserById;
