const express = require('express');
const router = express.Router();

module.exports = function (db) {

  // Helper function to "explode" a verified pass into individual event registrations
  async function explodePassRegistration(executor, userId, passId, transactionId) {
    // 1. Get Pass Details
    // Adjust column usage based on your schema. Assuming 'passes' has 'name'.
    const [passes] = await executor.execute('SELECT * FROM passes WHERE id = ?', [passId]);
    if (passes.length === 0) return;
    const pass = passes[0];

    // 2. Identify Tech vs Non-Tech
    let category = '';
    const passNameLower = pass.name.toLowerCase();

    // STRICT check for Non-Tech
    if (passNameLower.includes('non-tech') || passNameLower.includes('non tech') || passNameLower.includes('nontech')) {
      category = 'Non-Technical Events';
    }
    // If not non-tech, check for tech
    else if (passNameLower.includes('tech')) {
      category = 'Technical Events';
    } else {
      return; // Not a category pass we handle for explosion
    }

    // 3. Fetch Events
    const [events] = await executor.execute(`
        SELECT id, 'Enigma' as symposium FROM enigma_events WHERE eventCategory = ?
        UNION ALL
        SELECT id, 'Carteblanche' as symposium FROM carte_blanche_events WHERE eventCategory = ?
    `, [category, category]);

    // 4. Get User Details for Registration Entry
    const [users] = await executor.execute('SELECT fullName, email, mobile FROM users WHERE id = ?', [userId]);
    if (users.length === 0) return;
    const user = users[0];

    // 5. Insert Registrations & Verified Registrations
    for (const event of events) {
      // A. Ensure 'registrations' row exists
      const [existing] = await executor.execute('SELECT id FROM registrations WHERE userEmail = ? AND eventId = ?', [user.email, event.id]);
      if (existing.length === 0) {
        await executor.execute(`
                INSERT INTO registrations 
                (symposium, eventId, userName, userEmail, mobileNumber, transactionId, transactionAmount, round1, round2, round3)
                VALUES (?, ?, ?, ?, ?, ?, 0, 0, 0, 0)
             `, [event.symposium, event.id, user.fullName, user.email, user.mobile || null, 'PASS_ENTRY']);
      }

      // B. Ensure 'verified_registrations' row exists 
      // (Clean up old duplicate if any, though unlikely if clean)
      await executor.execute('DELETE FROM verified_registrations WHERE userId = ? AND eventId = ?', [userId, event.id]);
      await executor.execute(
        'INSERT INTO verified_registrations (userId, eventId, passId, verified, transactionId) VALUES (?, ?, ?, ?, ?)',
        [userId, event.id, passId, 1, transactionId]
      );
    }
  }

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
      if (verified) {
        await db.execute(
          'INSERT INTO verified_registrations (userId, eventId, passId, verified, transactionId) VALUES (?, ?, ?, ?, ?)',
          [userId, eventId, passId, verified, transactionId || null]
        );

        // [EXPLODE PASS] If verifying a pass, explode it!
        if (passId) {
          await explodePassRegistration(db, userId, passId, transactionId || 'ADMIN_VERIFY');
        }
      }

      res.status(200).json({ message: 'Verification status updated successfully.' });
    } catch (error) {
      console.error('Error verifying:', error);
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
          // (Accommodation logic unchanged)
          let [bookings] = await connection.execute(
            'SELECT * FROM accommodation_bookings WHERE userId = ? AND transactionId = ?',
            [userId, transactionId]
          );

          if (bookings.length === 0) {
            [bookings] = await connection.execute(
              'SELECT * FROM accommodation_bookings WHERE userId = ? AND status IN ("pending", "rejected") ORDER BY id DESC LIMIT 1',
              [userId]
            );
          }
          if (bookings.length > 0) {
            const booking = bookings[0];
            if (booking.status !== 'confirmed') {
              if (booking.status === 'rejected') {
                const { gender, quantity } = booking;
                await connection.execute(
                  'UPDATE accommodation SET available_rooms = available_rooms - ? WHERE gender = ?',
                  [quantity, gender]
                );
              }
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

          // [EXPLODE PASS] If verifying a pass, explode it!
          if (passId) {
            await explodePassRegistration(connection, userId, passId, transactionId);
          }

          itemsVerified++;
        }
      }

      await connection.commit();

      if (itemsVerified === 0) {
        return res.status(200).json({ message: 'Transaction ID valid, but items were already verified.' });
      }

      res.status(201).json({ message: `Transaction verified successfully. ${itemsVerified} items confirmed.` });

    } catch (error) {
      console.error('Verification error:', error);
      if (connection) await connection.rollback();
      res.status(500).json({ message: 'An error occurred during verification.' });
    } finally {
      if (connection) connection.release();
    }
  });

  return router;
};