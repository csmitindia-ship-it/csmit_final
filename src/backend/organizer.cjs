const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
module.exports = function(db) {
  // Get all organizers
  router.get('/', async (req, res) => {
    try {
      const sql = 'SELECT id, name, email, mobile, password FROM organizers';
      const [organizers] = await db.execute(sql);
      res.json(organizers);
    } catch (error) {
      res.status(500).json({ error: 'Error fetching organizers' });
    }
  });
  
  // Add a new organizer
  router.post('/', async (req, res) => {
    const { name, email, mobile, password } = req.body;
    if (!name || !email || !mobile || !password) {
      return res.status(400).json({ error: 'Please provide name, email, mobile and password' });
    }

    try {
      const hashedPassword = password;
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

  // Delete an organizer
  router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
      const sql = `DELETE FROM organizers WHERE id = ?`;
      const [result] = await db.execute(sql, [id]);
      if (result.affectedRows > 0) {
        res.status(200).json({ message: 'Organizer deleted successfully' });
      } else {
        res.status(404).json({ error: 'Organizer not found' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Error deleting organizer' });
    }
  });

  return router;
};