const express = require('express');



module.exports = function (db) {
    const router = express.Router();

    // Get all passes
    router.get('/', async (req, res) => {

        try {
            const [passes] = await db.execute('SELECT * FROM passes');
            res.json(passes);
        } catch (error) {
            console.error('Error fetching passes:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    });

    // Create a new pass
    router.post('/', async (req, res) => {

        const { name, cost, pass_limit, description, accountId, discountPercentage, discountReason } = req.body;
        if (!name || !cost || !pass_limit || !accountId) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        try {
            const [result] = await db.execute(
                'INSERT INTO passes (name, cost, pass_limit, description, accountId, discountPercentage, discountReason) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [name, cost, pass_limit, description || '', accountId, discountPercentage || 0, discountReason || null]
            );
            res.status(201).json({ id: result.insertId, name, cost, pass_limit, description, accountId, discountPercentage, discountReason });
        } catch (error) {
            console.error('Error creating pass:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    });

    // Update a pass
    router.put('/:id', async (req, res) => {
        const { id } = req.params;
        const { pass_limit, description, accountId, discountPercentage, discountReason } = req.body;

        if (!pass_limit && description === undefined && !accountId && discountPercentage === undefined && discountReason === undefined) {
            // Basic check, though frontend might send full object. Detailed check below covers partial updates.
        }

        let updateQuery = 'UPDATE passes SET ';
        const updateValues = [];

        if (pass_limit) {
            updateQuery += 'pass_limit = ?';
            updateValues.push(pass_limit);
        }

        if (description !== undefined) {
            if (updateValues.length > 0) updateQuery += ', ';
            updateQuery += 'description = ?';
            updateValues.push(description);
        }

        if (accountId) {
            if (updateValues.length > 0) updateQuery += ', ';
            updateQuery += 'accountId = ?';
            updateValues.push(accountId);
        }

        if (discountPercentage !== undefined) {
            if (updateValues.length > 0) updateQuery += ', ';
            updateQuery += 'discountPercentage = ?';
            updateValues.push(discountPercentage);
        }

        if (discountReason !== undefined) {
            if (updateValues.length > 0) updateQuery += ', ';
            updateQuery += 'discountReason = ?';
            updateValues.push(discountReason);
        }

        if (updateValues.length === 0) {
            return res.status(400).json({ message: 'No fields provided for update' });
        }

        updateQuery += ' WHERE id = ?';
        updateValues.push(id);

        try {
            const [result] = await db.execute(updateQuery, updateValues);

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Pass not found' });
            }

            res.json({ message: 'Pass updated successfully' });
        } catch (error) {
            console.error('Error updating pass:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    });

    // Delete a pass
    router.delete('/:id', async (req, res) => {
        const { id } = req.params;

        try {
            const [result] = await db.execute('DELETE FROM passes WHERE id = ?', [id]);

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Pass not found' });
            }

            res.json({ message: 'Pass deleted successfully' });
        } catch (error) {
            console.error('Error deleting pass:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    });

    return router;
};
