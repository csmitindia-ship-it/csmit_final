const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'registrations.cjs');
let content = fs.readFileSync(filePath, 'utf8');

const target = '  return router;';
const replacement = `
  // Delete registration by ID
  router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
      const [result] = await db.execute('DELETE FROM registrations WHERE id = ?', [id]);
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Registration not found.' });
      }
      res.status(200).json({ message: 'Registration deleted successfully.' });
    } catch (error) {
      console.error('Error deleting registration:', error);
      res.status(500).json({ message: 'Failed to delete registration.' });
    }
  });

  return router;`;

// Replace the LAST occurrence to be safe, although we know it should be at the end.
const lastIndex = content.lastIndexOf(target);

if (lastIndex !== -1) {
    content = content.substring(0, lastIndex) + replacement + content.substring(lastIndex + target.length);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Successfully updated registrations.cjs');
} else {
    console.error('Target not found');
    process.exit(1);
}
