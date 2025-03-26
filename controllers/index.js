exports.getHomePage = (req, res) => {
  res.render("index", {
    title: "Dxpress Logistics - Home",
    path: "/",
  });
};
