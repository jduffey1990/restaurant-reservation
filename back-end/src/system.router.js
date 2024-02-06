const router = require('express').Router();
const methodNotAllowed = require("./errors/methodNotAllowed");

router.get('/ping', (req, res) => {
  res.status(200).json({ message: 'Pong' });
});

// Handle non-allowed methods on system routes
router.all('*', methodNotAllowed);

module.exports = router;