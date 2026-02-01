const express = require('express');
const router = express.Router();

module.exports = function (db) {
  // Manual toggle of verification status (Admin Panel Toggle)
  router.post('/', async (req, res) => {
    const { userId, verified, transactionId } = req.body;
    const eventId = req.body.eventId === undefined ? null : req.body.eventId;
    const passId = req.body.passId === undefined ? null : req.body.passId;

    if (userId === undefined || verified === undefined) {
      return res.status(400).json({ message: 'User ID and verification status are required.' });
    }

    if (eventId === null && passId === null) {
      return res.status(400).json({ message: 'Either eventId or passId must be provided.' });
    }

    try {
      // 1. DELETE any existing records (removes duplicates)
      if (eventId) {
        await db.execute('DELETE FROM verified_registrations WHERE userId = ? AND eventId = ?', [userId, eventId]);
      } else if (passId) {
        await db.execute('DELETE FROM verified_registrations WHERE userId = ? AND passId = ?', [userId, passId]);
      }

      // 2. INSERT new authoritative record (ONLY IF VERIFIED)
      // If verified is false (rejected), we simply remove the record (step 1) and do not insert anything.
      if (verified) {
        await db.execute(
          'INSERT INTO verified_registrations (userId, eventId, passId, verified, transactionId) VALUES (?, ?, ?, ?, ?)',
          [userId, eventId, passId, verified, transactionId || null]
        );
      }

      res.status(200).json({ message: 'Verification status updated successfully.' });
    } catch (error) {
      res.status(500).json({ message: 'An error occurred while updating verification status.' });
    }
  });

  // Verify by Transaction ID (Scanning or Manual Entry)
  router.post('/verify-transaction', async (req, res) => {
    const { transactionId } = req.body;

    if (!transactionId) {
      return res.status(400).json({ message: 'Transaction ID is required.' });
    }

    let connection;
    try {
      connection = await db.getConnection();
      await connection.beginTransaction();

      // 1. Find ALL registrations by transactionId
      const [registrations] = await connection.execute(
        'SELECT * FROM registrations WHERE transactionId = ?',
        [transactionId]
      );

      if (registrations.length === 0) {
        await connection.rollback();
        return res.status(404).json({ message: 'Registration with this Transaction ID not found.' });
      }

      // 2. Get User ID (Assuming all items in one transaction belong to the same user)
      const userEmail = registrations[0].userEmail;
      const [users] = await connection.execute(
        'SELECT id FROM users WHERE email = ?',
        [userEmail]
      );

      if (users.length === 0) {
        await connection.rollback();
        return res.status(404).json({ message: 'User associated with this transaction not found.' });
      }
      const userId = users[0].id;
      let itemsVerified = 0;

      // 3. Iterate through ALL items in the transaction
      for (const reg of registrations) {

        // --- CASE A: ACCOMMODATION ---
        if (reg.symposium === 'Accommodation') {
          // 1. Try to find the booking (by TransactionID or fallback to UserID)
          let [bookings] = await connection.execute(
            'SELECT * FROM accommodation_bookings WHERE userId = ? AND transactionId = ?',
            [userId, transactionId]
          );

          if (bookings.length === 0) {
            // Fallback: Find by UserId and (Pending or Rejected)
            [bookings] = await connection.execute(
              'SELECT * FROM accommodation_bookings WHERE userId = ? AND status IN ("pending", "rejected") ORDER BY id DESC LIMIT 1',
              [userId]
            );
          }
          if (bookings.length > 0) {
            const booking = bookings[0];

            if (booking.status === 'confirmed') {
              // Already confirmed
            } else {
              // If REJECTED, we must deduct inventory again (since rejection released it)
              if (booking.status === 'rejected') {
                const { gender, quantity } = booking;
                // Deduct rooms
                await connection.execute(
                  'UPDATE accommodation SET available_rooms = available_rooms - ? WHERE gender = ?',
                  [quantity, gender]
                );
              }

              // Update status to confirmed and ensure transactionId is linked
              await connection.execute(
                'UPDATE accommodation_bookings SET status = "confirmed", transactionId = ? WHERE id = ?',
                [transactionId, booking.id]
              );
              itemsVerified++;
            }
          }
        }

        // --- CASE B: EVENTS OR PASSES ---
        else if (reg.eventId || reg.passId) {
          const eventId = reg.eventId || null;
          const passId = reg.passId || null;

          // CLEAN UP AND INSERT (Enforce Unique Status)
          if (eventId) {
            await connection.execute('DELETE FROM verified_registrations WHERE userId = ? AND eventId = ?', [userId, eventId]);
          } else if (passId) {
            await connection.execute('DELETE FROM verified_registrations WHERE userId = ? AND passId = ?', [userId, passId]);
          }

          // Insert new verified record
          await connection.execute(
            'INSERT INTO verified_registrations (userId, eventId, passId, verified, transactionId) VALUES (?, ?, ?, ?, ?)',
            [userId, eventId, passId, 1, transactionId]
          );
          itemsVerified++;
        }
      }

      await connection.commit();

      if (itemsVerified === 0) {
        return res.status(200).json({ message: 'Transaction ID valid, but items were already verified.' });
      }

      res.status(201).json({ message: `Transaction verified successfully. ${itemsVerified} items confirmed.` });

    } catch (error) {
      if (connection) await connection.rollback();
      res.status(500).json({ message: 'An error occurred during verification.' });
    } finally {
      if (connection) connection.release();
    }
  });

  return router;
};