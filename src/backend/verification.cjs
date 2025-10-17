const express = require('express');
const router = express.Router();

module.exports = function(db) {
  router.post('/', async (req, res) => {
    const { userId, eventId, verified } = req.body;

    if (userId === undefined || eventId === undefined || verified === undefined) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

    try {
      const [existing] = await db.execute('SELECT * FROM verified_registrations WHERE userId = ? AND eventId = ?', [userId, eventId]);

      if (existing.length > 0) {
        await db.execute('UPDATE verified_registrations SET verified = ? WHERE userId = ? AND eventId = ?', [verified, userId, eventId]);
        res.status(200).json({ message: 'Verification status updated successfully.' });
      } else {
        await db.execute('INSERT INTO verified_registrations (userId, eventId, verified) VALUES (?, ?, ?)', [userId, eventId, verified]);
        res.status(201).json({ message: 'Verification status created successfully.' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Failed to handle verification status.' });
    }
  });

  return router;
};
