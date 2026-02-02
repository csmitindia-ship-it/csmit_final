const express = require('express');
const router = express.Router();

module.exports = function (db) {
  // Helper: return themed JSON response
  // (No logging needed here as it's just a helper)
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
      // This will log the specific database error
      console.error(`Failed to start symposium '${symposiumName}':`, error);
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
      // This will log the specific database error
      console.error(`Failed to stop symposium '${symposiumName}':`, error);
      res
        .status(500)
        .json(themedResponse(false, "Error", "Failed to stop symposium."));
    }
  });

  // Get symposium status
  router.get('/status', async (req, res) => {
    // Note: You already had good logging in this endpoint!
    // I've kept it as it's well-implemented.


    try {
      const [rows] = await db.execute('SELECT * FROM symposium_status');
      res.status(200).json({ success: true, data: rows });
    } catch (error) {
      console.error('Error fetching symposium status:', error);
      res
        .status(500)
        .json({ success: false, message: "Failed to fetch symposium status." });
    }
  });

  return router;
};