const express = require('express');

module.exports = (db, uploadDocument) => {
  const router = express.Router();

  // Add new account details
  router.post('/', uploadDocument.single('qrCodePdf'), async (req, res) => {

    const { accountName, bankName, accountNumber, ifscCode } = req.body;
    const qrCodePdf = req.file ? req.file.buffer : null;

    if (!accountName || !bankName || !accountNumber || !ifscCode) {
      console.warn('Validation failed: Missing required fields.');
      return res.status(400).json({ message: 'All fields are required.' });
    }
    try {
      const [result] = await db.execute(
        'INSERT INTO accounts (accountName, bankName, accountNumber, ifscCode, qrCodePdf) VALUES (?, ?, ?, ?, ?)',
        [accountName, bankName, accountNumber, ifscCode, qrCodePdf]
      );
      res.status(201).json({ message: 'Account details added successfully', accountId: result.insertId });
    } catch (error) {
      // This is the most important log for debugging
      console.error('Error adding account:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Get all account details
  router.get('/', async (req, res) => {

    try {
      const [rows] = await db.execute('SELECT * FROM accounts');
      res.status(200).json(rows);
    } catch (error) {
      console.error('Error fetching all accounts:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Get account details for a specific event
  router.get('/event/:eventId', async (req, res) => {
    const { eventId } = req.params;

    try {
      // First, find the accountId linked to the eventId
      const [eventAccount] = await db.execute('SELECT accountId FROM event_accounts WHERE eventId = ?', [eventId]);

      if (eventAccount.length === 0) {
        console.warn(`No account mapping found for eventId: ${eventId}`);
        return res.status(404).json({ message: 'Account for this event not found.' });
      }

      const accountId = eventAccount[0].accountId;

      // Now, fetch the account details using the found accountId
      const [account] = await db.execute('SELECT id, accountName, bankName, accountNumber, ifscCode, qrCodePdf FROM accounts WHERE id = ?', [accountId]);

      if (account.length === 0) {
        console.warn(`Account details not found for accountId: ${accountId} (linked to eventId: ${eventId})`);
        return res.status(404).json({ message: 'Account details not found.' });
      }

      res.status(200).json(account[0]);
    } catch (error) {
      console.error(`Error fetching account for event ${eventId}:`, error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Get account details for a specific pass
  router.get('/pass/:passId', async (req, res) => {
    const { passId } = req.params;

    try {
      // First, find the accountId linked to the passId
      const [passAccount] = await db.execute('SELECT accountId FROM passes WHERE id = ?', [passId]);

      if (passAccount.length === 0) {
        console.warn(`No account mapping found for passId: ${passId}`);
        return res.status(404).json({ message: 'Account for this pass not found.' });
      }

      const accountId = passAccount[0].accountId;

      // Now, fetch the account details using the found accountId
      const [account] = await db.execute('SELECT id, accountName, bankName, accountNumber, ifscCode, qrCodePdf FROM accounts WHERE id = ?', [accountId]);

      if (account.length === 0) {
        console.warn(`Account details not found for accountId: ${accountId} (linked to passId: ${passId})`);
        return res.status(404).json({ message: 'Account details not found.' });
      }

      res.status(200).json(account[0]);
    } catch (error) {
      console.error(`Error fetching account for pass ${passId}:`, error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Get account details by ID
  router.get('/:id', async (req, res) => {
    const { id } = req.params;


    try {
      const [account] = await db.execute('SELECT id, accountName, bankName, accountNumber, ifscCode, qrCodePdf FROM accounts WHERE id = ?', [id]);

      if (account.length === 0) {
        console.warn(`Account details not found for accountId: ${id}`);
        return res.status(404).json({ message: 'Account details not found.' });
      }


      res.status(200).json(account[0]);
    } catch (error) {
      console.error(`Error fetching account for ID ${id}:`, error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Update account details
  router.put('/:id', uploadDocument.single('qrCodePdf'), async (req, res) => {
    const { id } = req.params;

    const { accountName, bankName, accountNumber, ifscCode } = req.body;
    const qrCodePdf = req.file ? req.file.buffer : null;

    if (!accountName || !bankName || !accountNumber || !ifscCode) {
      console.warn(`Validation failed for update on account ${id}: Missing required fields.`);
      return res.status(400).json({ message: 'All fields are required.' });
    }
    try {
      let sql = 'UPDATE accounts SET accountName = ?, bankName = ?, accountNumber = ?, ifscCode = ?';
      const params = [accountName, bankName, accountNumber, ifscCode];

      // Only add the PDF to the update query if a new one was uploaded
      if (qrCodePdf) {
        sql += ', qrCodePdf = ?';
        params.push(qrCodePdf);
      }

      sql += ' WHERE id = ?';
      params.push(id);

      const [result] = await db.execute(sql, params);

      if (result.affectedRows === 0) {
        console.warn(`Account not found for update: ${id}`);
        return res.status(404).json({ message: 'Account not found' });
      }

      res.status(200).json({ message: 'Account details updated successfully' });
    } catch (error) {
      console.error(`Error updating account ${id}:`, error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Delete account details
  router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
      const [result] = await db.execute('DELETE FROM accounts WHERE id = ?', [id]);

      if (result.affectedRows === 0) {
        console.warn(`Account not found for deletion: ${id}`);
        return res.status(404).json({ message: 'Account not found' });
      }

      res.status(200).json({ message: 'Account details deleted successfully' });
    } catch (error) {
      console.error(`Error deleting account ${id}:`, error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  return router;
};