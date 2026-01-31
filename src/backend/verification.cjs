const express = require('express');
const router = express.Router();

module.exports = function(db) {
  router.post('/', async (req, res) => {
    const { userId, verified } = req.body;
    const eventId = req.body.eventId === undefined ? null : req.body.eventId;
    const passId = req.body.passId === undefined ? null : req.body.passId;

    if (userId === undefined || verified === undefined) {
      return res.status(400).json({ message: 'User ID and verification status are required.' });
    }

    if (eventId === null && passId === null) {
      return res.status(400).json({ message: 'Either eventId or passId must be provided.' });
    }

    try {
      // Check if a record already exists
      const [existing] = await db.execute(
        'SELECT * FROM verified_registrations WHERE userId = ? AND (eventId = ? OR passId = ?)',
        [userId, eventId, passId]
      );

      if (existing.length > 0) {
        // Update existing record
        await db.execute(
          'UPDATE verified_registrations SET verified = ? WHERE id = ?',
          [verified, existing[0].id]
        );
      } else {
        // Insert new record
        await db.execute(
          'INSERT INTO verified_registrations (userId, eventId, passId, verified) VALUES (?, ?, ?, ?)',
          [userId, eventId, passId, verified]
        );
      }

      res.status(200).json({ message: 'Verification status updated successfully.' });

    } catch (error) {
      console.error('Error updating verification status:', error);
      res.status(500).json({ message: 'An error occurred while updating verification status.' });
    }
  });

  router.post('/verify-transaction', async (req, res) => {
    const { transactionId } = req.body;

    if (!transactionId) {
      return res.status(400).json({ message: 'Transaction ID is required.' });
    }

    try {
      // 1. Find registration by transactionId
      const [registrations] = await db.execute(
        'SELECT * FROM registrations WHERE transactionId = ?',
        [transactionId]
      );

      if (registrations.length === 0) {
        return res.status(404).json({ message: 'Registration with this Transaction ID not found.' });
      }
      const registration = registrations[0];
      const userEmail = registration.userEmail;

      // 2. Get userId from email
      const [users] = await db.execute(
        'SELECT id FROM users WHERE email = ?',
        [userEmail]
      );

      if (users.length === 0) {
        return res.status(404).json({ message: 'User associated with this transaction not found.' });
      }
      const userId = users[0].id;

      // 3. Check verified_registrations table
      const [verifiedRegistrations] = await db.execute(
        'SELECT * FROM verified_registrations WHERE userId = ? AND (eventId = ? OR passId = ?)',
        [userId, registration.eventId, registration.passId]
      );

      if (verifiedRegistrations.length > 0) {
        const existingRegistration = verifiedRegistrations[0];
        if (existingRegistration.verified) {
          return res.status(200).json({ message: 'This transaction has already been verified.' });
        }
      }

      // 4. Insert into verified_registrations
      await db.execute(
        'INSERT INTO verified_registrations (userId, eventId, passId, verified) VALUES (?, ?, ?, ?)',
        [userId, registration.eventId, registration.passId, true]
      );

      res.status(201).json({ message: 'Transaction verified and recorded successfully.' });

    } catch (error) {
      console.error('Verification failed:', error);
      res.status(500).json({ message: 'An error occurred during verification.' });
    }
  });

  return router;
};