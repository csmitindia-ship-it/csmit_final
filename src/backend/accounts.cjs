const express = require('express');

module.exports = (db, uploadPdf) => {
  const router = express.Router();

  // Add new account details
  router.post('/', uploadPdf.single('qrCodePdf'), async (req, res) => {
    const { accountName, bankName, accountNumber, ifscCode } = req.body;
    const qrCodePdf = req.file ? req.file.buffer : null;

    if (!accountName || !bankName || !accountNumber || !ifscCode) {
      return res.status(400).json({ message: 'All fields are required.' });
    }
    try {
      const [result] = await db.execute(
        'INSERT INTO accounts (accountName, bankName, accountNumber, ifscCode, qrCodePdf) VALUES (?, ?, ?, ?, ?)',
        [accountName, bankName, accountNumber, ifscCode, qrCodePdf]
      );
      res.status(201).json({ message: 'Account details added successfully', accountId: result.insertId });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Get all account details
  router.get('/', async (req, res) => {
    try {
      const [rows] = await db.execute('SELECT * FROM accounts');
      res.status(200).json(rows);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Get account details for a specific event
  router.get('/event/:eventId', async (req, res) => {
    const { eventId } = req.params;
    try {
      const [eventAccount] = await db.execute('SELECT accountId FROM event_accounts WHERE eventId = ?', [eventId]);
      if (eventAccount.length === 0) {
        return res.status(404).json({ message: 'Account for this event not found.' });
      }
      const accountId = eventAccount[0].accountId;
      const [account] = await db.execute('SELECT id, accountName, bankName, accountNumber, ifscCode, qrCodePdf FROM accounts WHERE id = ?', [accountId]);
      if (account.length === 0) {
        return res.status(404).json({ message: 'Account details not found.' });
      }
      res.status(200).json(account[0]);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Update account details
  router.put('/:id', uploadPdf.single('qrCodePdf'), async (req, res) => {
    const { id } = req.params;
    const { accountName, bankName, accountNumber, ifscCode } = req.body;
    const qrCodePdf = req.file ? req.file.buffer : null;

    if (!accountName || !bankName || !accountNumber || !ifscCode) {
      return res.status(400).json({ message: 'All fields are required.' });
    }
    try {
      let sql = 'UPDATE accounts SET accountName = ?, bankName = ?, accountNumber = ?, ifscCode = ?';
      const params = [accountName, bankName, accountNumber, ifscCode];
      
      if (qrCodePdf) {
        sql += ', qrCodePdf = ?';
        params.push(qrCodePdf);
      }
      
      sql += ' WHERE id = ?';
      params.push(id);

      const [result] = await db.execute(sql, params);
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Account not found' });
      }
      res.status(200).json({ message: 'Account details updated successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Delete account details
  router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
      const [result] = await db.execute('DELETE FROM accounts WHERE id = ?', [id]);
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Account not found' });
      }
      res.status(200).json({ message: 'Account details deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  return router;
};