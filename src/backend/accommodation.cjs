const express = require('express');
const router = express.Router();

module.exports = function (db) {
  // GET all accommodation details
  router.get('/', async (req, res) => {
    try {
      const [rows] = await db.execute('SELECT * FROM accommodation');
      res.json(rows);
    } catch (error) {
      console.error('Failed to get accommodation details:', error);
      res.status(500).json({ message: 'Failed to get accommodation details.' });
    }
  });

  // PUT (update) accommodation details - For Admin
  router.put('/', async (req, res) => {
    const { male, female } = req.body;

    if (!male || !female) {
      return res.status(400).json({ message: 'Male and female accommodation details are required.' });
    }

    try {
      const connection = await db.getConnection();
      await connection.beginTransaction();

      try {
        // Update male accommodation
        await connection.execute(
          'UPDATE accommodation SET total_rooms = ?, available_rooms = ?, fees = ?, accountId = ? WHERE gender = ?',
          [male.total_rooms, male.available_rooms, male.fees, male.accountId, 'male']
        );

        // Update female accommodation
        await connection.execute(
          'UPDATE accommodation SET total_rooms = ?, available_rooms = ?, fees = ?, accountId = ? WHERE gender = ?',
          [female.total_rooms, female.available_rooms, female.fees, female.accountId, 'female']
        );

        await connection.commit();
        res.json({ message: 'Accommodation details updated successfully.' });
      } catch (error) {
        await connection.rollback();
        console.error('Failed to update accommodation details:', error);
        res.status(500).json({ message: 'Failed to update accommodation details.' });
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Database connection error:', error);
      res.status(500).json({ message: 'Database connection error.' });
    }
  });

  // POST to add accommodation to cart
  router.post('/cart', async (req, res) => {
    const { userId, gender, quantity } = req.body;
    if (!userId || !gender || !quantity) {
      return res.status(400).json({ message: 'User ID, gender, and quantity are required.' });
    }

    if (quantity <= 0) {
      return res.status(400).json({ message: 'Quantity must be positive.' });
    }

    try {
      // Check if user has already booked
      const [existingBooking] = await db.execute(
        'SELECT id FROM accommodation_bookings WHERE userId = ? AND status = ?',
        [userId, 'confirmed']
      );
      if (existingBooking.length > 0) {
        return res.status(409).json({ message: 'You have already booked accommodation.' });
      }

      // Check for availability
      const [accommodation] = await db.execute('SELECT available_rooms FROM accommodation WHERE gender = ?', [gender]);
      if (accommodation.length === 0 || accommodation[0].available_rooms < quantity) {
        return res.status(409).json({ message: 'Not enough rooms available for the selected gender.' });
      }

      // Add to cart or update quantity if already exists
      await db.execute(
        'INSERT INTO accommodation_cart (userId, gender, quantity) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE gender = VALUES(gender), quantity = VALUES(quantity)',
        [userId, gender, quantity]
      );
      res.status(201).json({ message: 'Accommodation added to cart.' });
    } catch (error) {
      console.error('Failed to add accommodation to cart:', error);
      res.status(500).json({ message: 'Failed to add accommodation to cart.' });
    }
  });

  // DELETE from accommodation cart
  router.delete('/cart/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
      await db.execute('DELETE FROM accommodation_cart WHERE userId = ?', [userId]);
      res.status(200).json({ message: 'Accommodation removed from cart.' });
    } catch (error) {
      console.error('Failed to remove accommodation from cart:', error);
      res.status(500).json({ message: 'Failed to remove accommodation from cart.' });
    }
  });

  // Get all accommodation bookings (for admin)
  router.get('/bookings/all', async (req, res) => {
    try {
      const [bookings] = await db.execute(
        `SELECT ab.*, u.fullName, u.email, u.mobile 
         FROM accommodation_bookings ab 
         JOIN users u ON ab.userId = u.id 
         ORDER BY ab.createdAt DESC`
      );


      if (!bookings) {
        return res.json([]);
      }

      res.json(bookings);
    } catch (error) {
      console.error('Failed to get all accommodation bookings:', error);
      res.status(500).json({ message: 'Failed to get all accommodation bookings.' });
    }
  });

  // GET user's accommodation booking
  router.get('/bookings/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
      const [booking] = await db.execute(
        'SELECT * FROM accommodation_bookings WHERE userId = ? AND status = ?',
        [userId, 'confirmed']
      );
      if (booking.length > 0) {
        res.json(booking[0]);
      } else {
        res.json(null);
      }
    } catch (error) {
      console.error('Failed to get accommodation booking:', error);
      res.status(500).json({ message: 'Failed to get accommodation booking.' });
    }
  });


  // Verify an accommodation booking
  router.put('/bookings/:bookingId/verify', async (req, res) => {
    const { bookingId } = req.params;
    try {
      const connection = await db.getConnection();
      await connection.beginTransaction();

      try {
        const [booking] = await connection.execute('SELECT * FROM accommodation_bookings WHERE id = ?', [bookingId]);

        if (booking.length === 0) {
          await connection.rollback();
          return res.status(404).json({ message: 'Booking not found.' });
        }

        const { status, gender, quantity } = booking[0];

        if (status === 'confirmed') {
          await connection.rollback();
          return res.status(200).json({ message: 'Already verified.' });
        }

        if (status === 'rejected') {
          // Check availability again
          const [[accommodation]] = await connection.execute(
            'SELECT available_rooms FROM accommodation WHERE gender = ?',
            [gender]
          );

          if (!accommodation || accommodation.available_rooms < quantity) {
            await connection.rollback();
            return res.status(409).json({ message: 'Not enough rooms available to re-verify.' });
          }

          // Deduct rooms
          await connection.execute(
            'UPDATE accommodation SET available_rooms = available_rooms - ? WHERE gender = ?',
            [quantity, gender]
          );
        }

        // Update status
        await connection.execute(
          'UPDATE accommodation_bookings SET status = "confirmed" WHERE id = ?',
          [bookingId]
        );

        await connection.commit();
        res.status(200).json({ message: 'Accommodation booking verified successfully.' });
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Failed to verify accommodation booking:', error);
      res.status(500).json({ message: 'Failed to verify accommodation booking.' });
    }
  });

  // Verify an accommodation booking by userId
  router.put('/bookings/user/:userId/verify', async (req, res) => {
    const { userId } = req.params;
    try {
      const connection = await db.getConnection();
      await connection.beginTransaction();

      try {
        const [booking] = await connection.execute('SELECT * FROM accommodation_bookings WHERE userId = ?', [userId]);

        // --- RECOVERY LOGIC START ---
        if (booking.length === 0) {
          // Attempt to recover from registrations table
          // First get user email since registrations table doesn't have userId
          const [userRecord] = await connection.execute('SELECT email FROM users WHERE id = ?', [userId]);

          if (userRecord.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'User not found.' });
          }
          const userEmail = userRecord[0].email;

          const [registration] = await connection.execute(
            'SELECT transactionAmount, transactionId FROM registrations WHERE userEmail = ? AND symposium = "Accommodation" ORDER BY id DESC LIMIT 1',
            [userEmail]
          );

          if (registration.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'No accommodation booking or registration found for this user.' });
          }

          const amount = registration[0].transactionAmount;
          const recoveredTransactionId = registration[0].transactionId || "RECOVERED";

          // Fetch current fees to deduce gender/quantity
          const [accommodations] = await connection.execute('SELECT gender, fees, available_rooms FROM accommodation');

          let matchedGender = null;
          let matchedQuantity = 0;
          let matchCount = 0;

          for (const acc of accommodations) {
            if (acc.fees > 0 && amount % acc.fees === 0) {
              const qty = amount / acc.fees;
              if (qty > 0) {
                matchedGender = acc.gender;
                matchedQuantity = qty;
                matchCount++;
              }
            }
          }

          if (matchCount === 1 && matchedGender) {
            // Unique match found, recreate booking
            const accInfo = accommodations.find(a => a.gender === matchedGender);

            if (accInfo.available_rooms < matchedQuantity) {
              await connection.rollback();
              return res.status(409).json({ message: 'Found registration but not enough rooms to re-book.' });
            }

            // Insert new confirmed booking
            // Corrected order: quantity is number, transactionId is string
            await connection.execute(
              'INSERT INTO accommodation_bookings (userId, gender, status, quantity, transactionId) VALUES (?, ?, "confirmed", ?, ?)',
              [userId, matchedGender, matchedQuantity, recoveredTransactionId]
            );

            // Deduct inventory
            await connection.execute(
              'UPDATE accommodation SET available_rooms = available_rooms - ? WHERE gender = ?',
              [matchedQuantity, matchedGender]
            );

            await connection.commit();
            return res.status(200).json({ message: 'Accommodation booking recovered and verified successfully.' });

          } else if (matchCount > 1) {
            await connection.rollback();
            return res.status(409).json({ message: 'Cannot recover booking: Ambiguous gender/quantity based on amount.' });
          } else {
            await connection.rollback();
            return res.status(404).json({ message: 'Cannot recover booking: Amount does not match current fees.' });
          }
        }
        // --- RECOVERY LOGIC END ---

        const bookingId = booking[0].id; // Use primary key for updates
        const { status, gender, quantity } = booking[0];

        if (status === 'confirmed') {
          await connection.rollback();
          return res.status(200).json({ message: 'Already verified.' });
        }

        if (status === 'rejected') {
          // Check availability again
          const [[accommodation]] = await connection.execute(
            'SELECT available_rooms FROM accommodation WHERE gender = ?',
            [gender]
          );

          if (!accommodation || accommodation.available_rooms < quantity) {
            await connection.rollback();
            return res.status(409).json({ message: 'Not enough rooms available to re-verify.' });
          }

          // Deduct rooms
          await connection.execute(
            'UPDATE accommodation SET available_rooms = available_rooms - ? WHERE gender = ?',
            [quantity, gender]
          );
        }

        // Update status
        await connection.execute(
          'UPDATE accommodation_bookings SET status = "confirmed" WHERE id = ?',
          [bookingId]
        );

        await connection.commit();
        res.status(200).json({ message: 'Accommodation booking verified successfully.' });
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Failed to verify accommodation booking by user:', error);
      res.status(500).json({ message: 'Failed to verify accommodation booking.' });
    }
  });

  // Reject (Soft Delete) an accommodation booking by userId
  router.delete('/bookings/user/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
      // First, find the booking
      const [booking] = await db.execute('SELECT quantity, gender, status FROM accommodation_bookings WHERE userId = ?', [userId]);
      if (booking.length === 0) {
        return res.status(404).json({ message: 'No accommodation booking found for this user to reject.' });
      }
      const { quantity, gender, status } = booking[0];

      if (status === 'rejected') {
        return res.status(200).json({ message: 'Already rejected.' });
      }

      // Start transaction
      const connection = await db.getConnection();
      await connection.beginTransaction();

      try {
        // Soft delete: Update status to 'rejected'
        await connection.execute('UPDATE accommodation_bookings SET status = "rejected" WHERE userId = ?', [userId]);

        // Restore the room count (only if it was pending or confirmed, which implies rooms were held)
        // Logic assumption: Pending and Confirmed bookings hold rooms. Rejected/Cancelled do not.
        // Since we checked status != rejected, we assume we hold rooms.
        await connection.execute(
          'UPDATE accommodation SET available_rooms = available_rooms + ? WHERE gender = ?',
          [quantity, gender]
        );
        await connection.commit();
        res.status(200).json({ message: 'Accommodation booking rejected successfully.' });
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Failed to reject accommodation booking by user:', error);
      res.status(500).json({ message: 'Failed to reject accommodation booking.' });
    }
  });

  // Book accommodation (Manual/Direct)
  router.post('/book', async (req, res) => {
    const { userId, gender, quantity, transactionId } = req.body;

    if (!userId || !gender || !quantity || !transactionId) {
      return res.status(400).json({ message: 'Missing required fields for booking.' });
    }

    let connection;
    try {
      connection = await db.getConnection();
      await connection.beginTransaction();

      const [[accommodation]] = await connection.execute(
        'SELECT fees, available_rooms FROM accommodation WHERE gender = ?',
        [gender]
      );

      if (!accommodation || accommodation.available_rooms < quantity) {
        throw new Error(`Not enough rooms available for ${gender}.`);
      }

      const [existingBooking] = await connection.execute(
        'SELECT id FROM accommodation_bookings WHERE userId = ?',
        [userId]
      );

      if (existingBooking.length > 0) {
        await connection.commit();
        return res.status(200).json({ message: 'Accommodation already booked.' });
      }

      // FIX: Removed 'isVerified' column and value
      await connection.execute(
        'INSERT INTO accommodation_bookings (userId, gender, status, transactionId, quantity) VALUES (?, ?, ?, ?, ?)',
        [userId, gender, 'pending', transactionId, quantity]
      );

      const [updateResult] = await connection.execute(
        'UPDATE accommodation SET available_rooms = available_rooms - ? WHERE gender = ?',
        [quantity, gender]
      );

      if (updateResult.affectedRows === 0) {
        throw new Error(`Failed to update accommodation room count for ${gender}.`);
      }

      await connection.commit();
      res.status(201).json({ message: 'Accommodation booked successfully.' });
    } catch (error) {
      if (connection) await connection.rollback();
      res.status(500).json({ message: error.message || 'Failed to book accommodation.' });
    } finally {
      if (connection) connection.release();
    }
  });

  return router;
};