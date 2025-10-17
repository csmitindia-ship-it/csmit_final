const express = require('express');
const router = express.Router();

module.exports = function (db) {
  // Helper: return themed JSON response
  const themedResponse = (success, title, message, extra = {}) => ({
    success,
    title,
    message,
    ...extra,
  });

  // Start a symposium
  router.post('/start', async (req, res) => {
    const { symposiumName, startDate } = req.body;
    if (!symposiumName || !startDate) {
      return res
        .status(400)
        .json(themedResponse(false, "Error", "Symposium name and start date are required."));
    }

    try {
      await db.execute(
        'UPDATE symposium_status SET isOpen = 1, startDate = ? WHERE symposiumName = ?',
        [startDate, symposiumName]
      );
      res
        .status(200)
        .json(themedResponse(true, "Success", `${symposiumName} has been started.`));
    } catch (error) {
      res
        .status(500)
        .json(themedResponse(false, "Error", "Failed to start symposium."));
    }
  });

  // Stop a symposium
  router.post('/stop', async (req, res) => {
    const { symposiumName } = req.body;
    if (!symposiumName) {
      return res
        .status(400)
        .json(themedResponse(false, "Error", "Symposium name is required."));
    }

    try {
      await db.execute(
        'UPDATE symposium_status SET isOpen = 0 WHERE symposiumName = ?',
        [symposiumName]
      );
      res
        .status(200)
        .json(themedResponse(true, "Success", `${symposiumName} has been stopped.`));
    } catch (error) {
      res
        .status(500)
        .json(themedResponse(false, "Error", "Failed to stop symposium."));
    }
  });

  // Get symposium status
  router.get('/status', async (req, res) => {
    try {
      const [rows] = await db.execute('SELECT * FROM symposium_status');
      res
        .status(200)
        .json(themedResponse(true, "Symposium Status", "Fetched successfully.", { data: rows }));
    } catch (error) {
      console.error('Error fetching symposium status:', error);
      res
        .status(500)
        .json(themedResponse(false, "Error", "Failed to fetch symposium status."));
    }
  });

  return router;
};
