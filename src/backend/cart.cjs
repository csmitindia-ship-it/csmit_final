const express = require('express');
const router = express.Router();

module.exports = function (db) {
  // Add item to cart
  router.post('/', async (req, res) => {
    const { userEmail, eventId, symposiumName } = req.body;

    if (!userEmail || !eventId || !symposiumName) {
      return res.status(400).json({ message: 'Missing required cart fields.' });
    }

    try {
      // Find the user by email to get their ID
      const [users] = await db.execute('SELECT id FROM users WHERE email = ?', [userEmail]);

      if (users.length === 0) {
        return res.status(404).json({ message: 'User not found.' });
      }
      const userId = users[0].id;

      // Check if the item is already in the cart for this user
      const [existingCartItem] = await db.execute(
        'SELECT * FROM cart WHERE userId = ? AND eventId = ? AND symposiumName = ?',
        [userId, eventId, symposiumName]
      );

      if (existingCartItem.length > 0) {
        return res.status(409).json({ message: 'Event already in cart.' });
      }

      await db.execute(
        'INSERT INTO cart (userId, eventId, symposiumName) VALUES (?, ?, ?)',
        [userId, eventId, symposiumName]
      );

      res.status(201).json({ message: 'Event added to cart successfully.' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to add event to cart.' });
    }
  });

  // Get cart items for a user
  router.get('/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
      const [cartItems] = await db.execute(
        'SELECT cartId, eventId, symposiumName FROM cart WHERE userId = ?',
        [userId]
      );

      if (cartItems.length === 0) {
        return res.json([]); // Return empty array if cart is empty
      }

      // Fetch event details for each item in the cart
      const eventsWithDetails = await Promise.all(
        cartItems.map(async (item) => {
          let eventTable;
          if (item.symposiumName === 'Enigma') {
            eventTable = 'enigma_events';
          } else if (item.symposiumName === 'Carteblanche') {
            eventTable = 'carte_blanche_events';
          } else {
            console.warn(
              `Unknown symposiumName: ${item.symposiumName} for eventId: ${item.eventId}`
            );
            return null; // Skip this item
          }

          const [eventDetails] = await db.execute(
            `SELECT eventName, eventCategory, eventDescription, registrationFees, lastDateForRegistration, coordinatorName, coordinatorContactNo 
             FROM ${eventTable} WHERE id = ?`,
            [item.eventId]
          );

          if (eventDetails.length > 0) {
            return { ...item, eventDetails: eventDetails[0] };
          } else {
            return null; // Event not found, skip
          }
        })
      );

      // Filter out nulls
      res.json(eventsWithDetails.filter((item) => item !== null));
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch cart items.' });
    }
  });

  // Remove item from cart
  router.delete('/:cartId', async (req, res) => {
    const { cartId } = req.params;
    const { userEmail } = req.body; // Expect userEmail for verification

    if (!userEmail) {
      return res.status(400).json({ message: 'User email is required.' });
    }

    try {
      const [users] = await db.execute('SELECT id FROM users WHERE email = ?', [userEmail]);

      if (users.length === 0) {
        return res.status(404).json({ message: 'User not found.' });
      }
      const userId = users[0].id;

      const [result] = await db.execute(
        'DELETE FROM cart WHERE cartId = ? AND userId = ?',
        [cartId, userId]
      );

      if (result.affectedRows === 0) {
        return res
          .status(404)
          .json({ message: 'Cart item not found or not authorized.' });
      }

      res.status(200).json({ message: 'Event removed from cart successfully.' });
    } catch (error) {
      console.error('Error removing event from cart:', error);
      res.status(500).json({ message: 'Failed to remove event from cart.' });
    }
  });

  return router;
};
