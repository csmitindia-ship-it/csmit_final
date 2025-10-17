const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
module.exports = function(db) {
  // Add a new organizer
  router.post('/', async (req, res) => {
    const { name, email, mobile, password } = req.body;
    if (!name || !email || !mobile || !password) {
      return res.status(400).json({ error: 'Please provide name, email, mobile and password' });
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const sql = `INSERT INTO organizers (name, email, mobile, password) VALUES (?, ?, ?, ?)`;
      const [result] = await db.execute(sql, [name, email, mobile, hashedPassword]);
      res.status(201).json({ id: result.insertId });
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ error: 'Email already exists' });
      }
      res.status(500).json({ error: 'Error creating organizer' });
    }
  });

  return router;
};