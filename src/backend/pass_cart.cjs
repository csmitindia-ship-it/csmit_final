const express = require('express');
const router = express.Router();

module.exports = function (db) {
  // Add item to pass cart
  router.post('/', async (req, res) => {
    const { userId, passId } = req.body;

    if (!userId || !passId) {
      return res.status(400).json({ message: 'Missing userId or passId.' });
    }

    try {
      // Get user email
      const [users] = await db.execute('SELECT email FROM users WHERE id = ?', [userId]);
      if (users.length === 0) {
        return res.status(404).json({ message: 'User not found.' });
      }
      const userEmail = users[0].email;

      // Check if already registered
      const [existingRegistration] = await db.execute(
        'SELECT id FROM registrations WHERE userEmail = ? AND passId = ?',
        [userEmail, passId]
      );

      if (existingRegistration.length > 0) {
        return res.status(409).json({ message: 'You have already purchased this pass.' });
      }

      // Check if the item is already in the cart for this user
      const [existingCartItem] = await db.execute(
        'SELECT * FROM pass_cart WHERE userId = ? AND passId = ?',
        [userId, passId]
      );

      if (existingCartItem.length > 0) {
        return res.status(409).json({ message: 'Pass already in cart.' });
      }

      await db.execute(
        'INSERT INTO pass_cart (userId, passId) VALUES (?, ?)',
        [userId, passId]
      );

      res.status(201).json({ message: 'Pass added to cart successfully.' });
    } catch (error) {
      console.error('Error adding pass to cart:', error);
      res.status(500).json({ message: 'Failed to add pass to cart.' });
    }
  });

  // Get cart items for a user
  router.get('/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
      const [cartItems] = await db.execute(
        'SELECT pc.id, p.id as passId, p.name, p.cost, p.description FROM pass_cart pc JOIN passes p ON pc.passId = p.id WHERE pc.userId = ?',
        [userId]
      );

      res.json(cartItems);
    } catch (error) {
        console.error('Error fetching pass cart items:', error);
      res.status(500).json({ message: 'Failed to fetch pass cart items.' });
    }
  });

  // Remove item from cart
  router.delete('/:cartId', async (req, res) => {
    const { cartId } = req.params;

    try {
      const [result] = await db.execute(
        'DELETE FROM pass_cart WHERE id = ?',
        [cartId]
      );

      if (result.affectedRows === 0) {
        return res
          .status(404)
          .json({ message: 'Cart item not found.' });
      }

      res.status(200).json({ message: 'Pass removed from cart successfully.' });
    } catch (error) {
      console.error('Error removing pass from cart:', error);
      res.status(500).json({ message: 'Failed to remove pass from cart.' });
    }
  });

  return router;
};
