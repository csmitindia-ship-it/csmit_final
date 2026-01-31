const express = require('express');

console.log('--- passes.cjs module loaded ---');

module.exports = function(db) {
    const router = express.Router();

    // Get all passes
    router.get('/', async (req, res) => {
        console.log('GET /admin/passes reached');
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
        console.log(req.body);
        const { name, cost, pass_limit, description, accountId } = req.body;
        if (!name || !cost || !pass_limit || !accountId) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        try {
            const [result] = await db.execute(
                'INSERT INTO passes (name, cost, pass_limit, description, accountId) VALUES (?, ?, ?, ?, ?)',
                [name, cost, pass_limit, description || '', accountId]
            );
            res.status(201).json({ id: result.insertId, name, cost, pass_limit, description, accountId });
        } catch (error) {
            console.error('Error creating pass:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    });

    // Update a pass
    router.put('/:id', async (req, res) => {
        const { id } = req.params;
        const { pass_limit, description, accountId } = req.body;

        if (!pass_limit && description === undefined && !accountId) {
            return res.status(400).json({ message: 'Pass limit, description, or accountId is required' });
        }

        let updateQuery = 'UPDATE passes SET ';
        const updateValues = [];
        
        if (pass_limit) {
            updateQuery += 'pass_limit = ?';
            updateValues.push(pass_limit);
        }

        if (description !== undefined) {
            if (updateValues.length > 0) {
                updateQuery += ', ';
            }
            updateQuery += 'description = ?';
            updateValues.push(description);
        }

        if (accountId) {
            if (updateValues.length > 0) {
                updateQuery += ', ';
            }
            updateQuery += 'accountId = ?';
            updateValues.push(accountId);
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
