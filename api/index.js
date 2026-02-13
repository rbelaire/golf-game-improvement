const { requestHandler } = require("../server");

module.exports = async (req, res) => {
  try {
    await requestHandler(req, res, { apiOnly: true });
  } catch (err) {
    console.error(err);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Internal server error" }));
  }
};
