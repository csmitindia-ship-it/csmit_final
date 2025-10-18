const express = require('express');

module.exports = (db, uploadPdf) => {
  const router = express.Router();

  // Add new account details
  router.post('/', uploadPdf.single('qrCodePdf'), async (req, res) => {
    console.log('POST /accounts - Attempting to add new account...');
    console.log('Request Body:', req.body);
    console.log('File Received:', req.file ? req.file.originalname : 'No file uploaded');

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
      console.log(`Account added successfully. New accountId: ${result.insertId}`);
      res.status(201).json({ message: 'Account details added successfully', accountId: result.insertId });
    } catch (error) {
      // This is the most important log for debugging
      console.error('Error adding account:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Get all account details
  router.get('/', async (req, res) => {
    console.log('GET /accounts - Fetching all accounts...');
    try {
      const [rows] = await db.execute('SELECT * FROM accounts');
      console.log(`Successfully fetched ${rows.length} accounts.`);
      res.status(200).json(rows);
    } catch (error) {
      console.error('Error fetching all accounts:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Get account details for a specific event
  router.get('/event/:eventId', async (req, res) => {
    const { eventId } = req.params;
    console.log(`GET /accounts/event/${eventId} - Fetching account for event...`);

    try {
      // First, find the accountId linked to the eventId
      const [eventAccount] = await db.execute('SELECT accountId FROM event_accounts WHERE eventId = ?', [eventId]);
      
      if (eventAccount.length === 0) {
        console.warn(`No account mapping found for eventId: ${eventId}`);
        return res.status(404).json({ message: 'Account for this event not found.' });
      }

      const accountId = eventAccount[0].accountId;
      console.log(`Found mapping: eventId ${eventId} -> accountId ${accountId}. Fetching details...`);

      // Now, fetch the account details using the found accountId
      const [account] = await db.execute('SELECT id, accountName, bankName, accountNumber, ifscCode, qrCodePdf FROM accounts WHERE id = ?', [accountId]);
      
      if (account.length === 0) {
        console.warn(`Account details not found for accountId: ${accountId} (linked to eventId: ${eventId})`);
        return res.status(404).json({ message: 'Account details not found.' });
      }

      console.log(`Successfully fetched account details for eventId: ${eventId}`);
      res.status(200).json(account[0]);
    } catch (error) {
      console.error(`Error fetching account for event ${eventId}:`, error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Update account details
  router.put('/:id', uploadPdf.single('qrCodePdf'), async (req, res) => {
    const { id } = req.params;
    console.log(`PUT /accounts/${id} - Attempting to update account...`);
    console.log('Request Body:', req.body);
    console.log('File Received:', req.file ? req.file.originalname : 'No new file uploaded');
    
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
        console.log(`Updating qrCodePdf for account ${id}.`);
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

      console.log(`Account ${id} updated successfully.`);
      res.status(200).json({ message: 'Account details updated successfully' });
    } catch (error) {
      console.error(`Error updating account ${id}:`, error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Delete account details
  router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    console.log(`DELETE /accounts/${id} - Attempting to delete account...`);

    try {
      const [result] = await db.execute('DELETE FROM accounts WHERE id = ?', [id]);
      
      if (result.affectedRows === 0) {
        console.warn(`Account not found for deletion: ${id}`);
        return res.status(404).json({ message: 'Account not found' });
      }

      console.log(`Account ${id} deleted successfully.`);
      res.status(200).json({ message: 'Account details deleted successfully' });
    } catch (error) {
      console.error(`Error deleting account ${id}:`, error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  return router;
};