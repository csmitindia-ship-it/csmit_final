const express = require('express');
const router = express.Router();

module.exports = function(db) {
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
      return res.status(400).json({ message: 'Quantity must be positive.'});
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

  router.get('/bookings/all', async (req, res) => {
    try {
      const [bookings] = await db.execute(
        `SELECT ab.*, u.fullName, u.email, u.mobile 
         FROM accommodation_bookings ab 
         JOIN users u ON ab.userId = u.id 
         ORDER BY ab.createdAt DESC`
      );
      res.json(bookings);
    } catch (error) {
      console.error('Failed to get all accommodation bookings:', error);
      res.status(500).json({ message: 'Failed to get all accommodation bookings.' });
    }
  });

  // Verify an accommodation booking
  router.put('/bookings/:bookingId/verify', async (req, res) => {
    const { bookingId } = req.params;
    try {
      await db.execute(
        'UPDATE accommodation_bookings SET status = "confirmed", isVerified = true WHERE id = ?',
        [bookingId]
      );
      res.status(200).json({ message: 'Accommodation booking verified successfully.' });
    } catch (error) {
      console.error('Failed to verify accommodation booking:', error);
      res.status(500).json({ message: 'Failed to verify accommodation booking.' });
    }
  });

  // Verify an accommodation booking by userId
  router.put('/bookings/user/:userId/verify', async (req, res) => {
    const { userId } = req.params;
    try {
      // First, find the booking id for the user
      const [booking] = await db.execute('SELECT id FROM accommodation_bookings WHERE userId = ?', [userId]);
      if (booking.length === 0) {
        return res.status(404).json({ message: 'No accommodation booking found for this user.' });
      }
      const bookingId = booking[0].id;

      // Now, verify the booking
      await db.execute(
        'UPDATE accommodation_bookings SET status = "confirmed", isVerified = true WHERE id = ?',
        [bookingId]
      );
      res.status(200).json({ message: 'Accommodation booking verified successfully.' });
    } catch (error) {
      console.error('Failed to verify accommodation booking by user:', error);
      res.status(500).json({ message: 'Failed to verify accommodation booking.' });
    }
  });

  // Delete an accommodation booking by userId (for rejection)
  router.delete('/bookings/user/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
      // First, find the booking for the user to get quantity and gender
      const [booking] = await db.execute('SELECT quantity, gender FROM accommodation_bookings WHERE userId = ?', [userId]);
      if (booking.length === 0) {
        return res.status(404).json({ message: 'No accommodation booking found for this user to delete.' });
      }
      const { quantity, gender } = booking[0];

      // Start transaction
      const connection = await db.getConnection();
      await connection.beginTransaction();

      try {
        // Delete the booking
        await connection.execute('DELETE FROM accommodation_bookings WHERE userId = ?', [userId]);

        // Restore the room count
        await connection.execute(
          'UPDATE accommodation SET available_rooms = available_rooms + ? WHERE gender = ?',
          [quantity, gender]
        );

        await connection.commit();
        res.status(200).json({ message: 'Accommodation booking rejected and removed successfully.' });
      } catch (error) {
        await connection.rollback();
        throw error; // Let the outer catch handle it
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Failed to reject accommodation booking by user:', error);
      res.status(500).json({ message: 'Failed to reject accommodation booking.' });
    }
  });

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
          // If a booking exists, we don't create a new one.
          // This assumes a user can only have one accommodation booking.
          await connection.commit(); // commit transaction to not leave it open
          return res.status(200).json({ message: 'Accommodation already booked.' });
      }

      await connection.execute(
          'INSERT INTO accommodation_bookings (userId, gender, status, transactionId, quantity, isVerified) VALUES (?, ?, ?, ?, ?, ?)',
          [userId, gender, 'pending', transactionId, quantity, false]
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
