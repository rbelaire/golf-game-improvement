const db = require("../lib/db");
const { requestHandler } = require("../server");

let initPromise = null;

module.exports = async (req, res) => {
  try {
    if (!initPromise) {
      initPromise = db.init();
    }
    await initPromise;
    await requestHandler(req, res, { apiOnly: true });
  } catch (err) {
    console.error(err);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Internal server error" }));
  }
};
