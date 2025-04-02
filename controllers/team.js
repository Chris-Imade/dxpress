const teamMembers = require("../data/teamMembers");

exports.getTeamPage = (req, res) => {
  res.render("team/index", {
    title: "Our Team",
    path: "/team",
    teamMembers: teamMembers,
  });
};

exports.getTeamDetailsPage = (req, res) => {
  const memberId = parseInt(req.params.id);
  const teamMember = teamMembers.find((member) => member.id === memberId);

  if (!teamMember) {
    return res.status(404).render("404", {
      title: "Team Member Not Found",
      path: "/team",
    });
  }

  res.render("team/details", {
    title: teamMember.name,
    path: "/team",
    member: teamMember,
  });
};
