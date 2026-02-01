const express = require('express');
const router = express.Router();

module.exports = function(db) {
    // Get the current active offer
    router.get('/', async (req, res) => {
        try {
            const [rows] = await db.execute('SELECT * FROM offers WHERE active = TRUE LIMIT 1');
            res.json({ offer: rows[0] || null });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // Create or update an offer
    router.post('/', async (req, res) => {
        const { content } = req.body;
        if (!content) {
            return res.status(400).json({ error: 'Content is required' });
        }
        try {
            // In this application, we will only have one offer at a time.
            // So, we will first delete any existing offer and then create a new one.
            await db.execute('DELETE FROM offers');
            const [result] = await db.execute('INSERT INTO offers (content, active) VALUES (?, ?)', [content, true]);
            const [rows] = await db.execute('SELECT * FROM offers WHERE id = ?', [result.insertId]);
            res.json({ message: 'Offer updated successfully', offer: rows[0] });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // Stop the offer
    router.put('/stop', async (req, res) => {
        try {
            await db.execute('UPDATE offers SET active = FALSE');
            res.json({ message: 'Offer stopped successfully' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // Delete the offer
    router.delete('/', async (req, res) => {
        try {
            await db.execute('DELETE FROM offers');
            res.json({ message: 'Offer deleted successfully' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    return router;
};
