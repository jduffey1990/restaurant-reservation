const router = require('express').Router();
const methodNotAllowed = require("./errors/methodNotAllowed");
const { ensureDemoData } = require("./demo/demo.service");

// The front end pings this on load, which makes it the natural place to keep the
// demo data fresh. We await it so the dashboard's own fetch cannot race ahead of
// the top-up and render an empty day. ensureDemoData throttles itself and
// swallows its own errors, so this stays cheap and cannot fail the ping.
router.get('/ping', async (req, res) => {
  const demo = await ensureDemoData();
  res.status(200).json({ message: 'Pong', demo });
});

// Handle non-allowed methods on system routes
router.all('*', methodNotAllowed);

module.exports = router;
