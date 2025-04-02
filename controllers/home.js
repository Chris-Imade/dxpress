const teamMembers = require("../data/teamMembers");

exports.getHomePage = (req, res) => {
  res.render("index", {
    title: "Home",
    path: "/",
    teamMembers: teamMembers,
  });
};
