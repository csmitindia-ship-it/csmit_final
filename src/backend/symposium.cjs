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
    console.log(`POST /symposium/start - Attempting to start symposium: ${symposiumName}`);
    console.log('Request Body:', req.body);

    if (!symposiumName || !startDate) {
      console.warn('Validation failed: Symposium name and start date are required.');
      return res
        .status(400)
        .json(themedResponse(false, "Error", "Symposium name and start date are required."));
    }

    try {
      await db.execute(
        'UPDATE symposium_status SET isOpen = 1, startDate = ? WHERE symposiumName = ?',
        [startDate, symposiumName]
      );
      
      console.log(`Symposium '${symposiumName}' started successfully.`);
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
    console.log(`POST /symposium/stop - Attempting to stop symposium: ${symposiumName}`);
    console.log('Request Body:', req.body);

    if (!symposiumName) {
      console.warn('Validation failed: Symposium name is required.');
      return res
        .status(400)
        .json(themedResponse(false, "Error", "Symposium name is required."));
    }

    try {
      await db.execute(
        'UPDATE symposium_status SET isOpen = 0 WHERE symposiumName = ?',
        [symposiumName]
      );
      
      console.log(`Symposium '${symposiumName}' stopped successfully.`);
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
    console.log("GET /symposium/status - Received request");
    
    try {
      console.log("Executing query: SELECT * FROM symposium_status");
      const [rows] = await db.execute('SELECT * FROM symposium_status');
      
      console.log(`Query successful, fetched ${rows.length} status rows. Sending response.`);
      res
        .status(200)
        .json(themedResponse(true, "Symposium Status", "Fetched successfully.", { data: rows }));
    } catch (error) {
      // This is the most critical log
      console.error('Error fetching symposium status:', error);
      res
        .status(500)
        .json(themedResponse(false, "Error", "Failed to fetch symposium status."));
    }
  });

  return router;
};