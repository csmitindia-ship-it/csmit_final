const express = require('express');

function createTimerRouter(db) {
  const router = express.Router();

  // POST /timer - Start a new timer
  router.post('/timer', async (req, res) => {
    const { endTime } = req.body;
    console.log(`POST /timer - Attempting to start a new timer.`);
    console.log('Request Body:', req.body);

    if (!endTime) {
      console.warn('Validation failed: endTime is required.');
      return res.status(400).json({ message: 'endTime is required' });
    }

    try {
      // Deactivate any existing active timers
      console.log('Deactivating existing timers...');
      await db.execute('UPDATE registration_timer SET is_active = FALSE WHERE is_active = TRUE');

      // Insert the new timer
      console.log(`Inserting new timer with endTime: ${endTime}`);
      await db.execute('INSERT INTO registration_timer (end_time, is_active) VALUES (?, TRUE)', [endTime]);

      console.log('Timer started successfully.');
      res.status(200).json({ message: 'Timer started successfully' });
    } catch (error) {
      // This is the most important log for debugging
      console.error('Error starting timer:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // GET /timer - Get the active timer
  router.get('/timer', async (req, res) => {
    console.log('GET /timer - Fetching active timer...');
    try {
      const [rows] = await db.execute('SELECT end_time FROM registration_timer WHERE is_active = TRUE');
      
      if (rows.length > 0) {
        console.log('Active timer found:', rows[0]);
        res.json(rows[0]); // Send just the timer object: { "end_time": "..." }
      } else {
        console.log('No active timer found.');
        res.json(null); // Send null as the response body
      }
    } catch (error) {
      // This will log the specific database error
      console.error('Error fetching active timer:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // DELETE /timer - Stop the active timer
  router.delete('/timer', async (req, res) => {
    console.log('DELETE /timer - Attempting to stop active timer...');
    try {
      await db.execute('UPDATE registration_timer SET is_active = FALSE WHERE is_active = TRUE');
      console.log('Active timer stopped successfully.');
      res.status(200).json({ message: 'Timer stopped successfully' });
    } catch (error) {
      // This will log the specific database error
      console.error('Error stopping active timer:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  return router;
}

module.exports = createTimerRouter;