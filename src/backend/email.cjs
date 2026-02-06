const express = require('express');
const router = express.Router();
require('dotenv').config();

module.exports = function (db, transporter, uploadDocument) {

  // Get users with verified registrations who haven't received a confirmation email
  router.get('/unconfirmed-users', async (req, res) => {
    try {
      // Fetch currently open symposium
      const [openStatus] = await db.execute('SELECT symposiumName FROM symposium_status WHERE isOpen = 1');
      const openSymposiums = openStatus.map(s => s.symposiumName);
      // Fallback to Carteblanche or Enigma if nothing is open, or just use the first open one
      const activeSymp = openSymposiums.length > 0 ? openSymposiums[0] : 'Carteblanche';

      const { includeSent } = req.query;

      const [users] = await db.execute(`
        SELECT
          u.id,
          u.fullName,
          u.email,
          COUNT(vr.id) as unconfirmedItems,
          GROUP_CONCAT(DISTINCT
            CASE
              WHEN ee.id IS NOT NULL THEN 'Enigma'
              WHEN cbe.id IS NOT NULL THEN 'Carteblanche'
              WHEN p.id IS NOT NULL THEN ?
              ELSE 'General'
            END
          ) as symposiums
        FROM users u
        JOIN verified_registrations vr ON u.id = vr.userId
        LEFT JOIN enigma_events ee ON vr.eventId = ee.id
        LEFT JOIN carte_blanche_events cbe ON vr.eventId = cbe.id
        LEFT JOIN passes p ON vr.passId = p.id
        WHERE vr.verified = true ${includeSent === 'true' ? '' : 'AND vr.confirmation_email_sent = false'}
        GROUP BY u.id, u.fullName, u.email
        HAVING unconfirmedItems > 0
      `, [activeSymp]);
      res.status(200).json(users);
    } catch (error) {
      console.error('Failed to fetch unconfirmed users:', error);
      res.status(500).json({ message: 'Failed to fetch unconfirmed users.' });
    }
  });

  // Send confirmation emails in bulk
  router.post('/bulk-send-confirmation', uploadDocument.single('attachment'), async (req, res) => {
    let { userIds, subject, emailContent, symposium, forceResend } = req.body;

    // If coming from FormData, userIds might be a JSON string
    if (typeof userIds === 'string') {
      try {
        userIds = JSON.parse(userIds);
      } catch (e) {
        console.error('Failed to parse userIds from body:', e);
      }
    }

    const attachment = req.file;

    if (!Array.isArray(userIds) || userIds.length === 0 || !subject) {
      return res.status(400).json({ message: 'User IDs array and subject are required.' });
    }

    let connection;
    try {
      connection = await db.getConnection();
      let sentCount = 0;

      for (const userId of userIds) {
        await connection.beginTransaction();

        try {
          const [[user]] = await connection.execute('SELECT email, fullName as name FROM users WHERE id = ?', [userId]);
          if (!user) {
            await connection.rollback();
            continue;
          }

          let query = `
            SELECT DISTINCT COALESCE(ee.eventName, cbe.eventName, p.name) as itemName
             FROM verified_registrations vr
             LEFT JOIN enigma_events ee ON vr.eventId = ee.id
             LEFT JOIN carte_blanche_events cbe ON vr.eventId = cbe.id
             LEFT JOIN passes p ON vr.passId = p.id
             WHERE vr.userId = ? AND vr.verified = true ${forceResend === 'true' || forceResend === true ? '' : 'AND vr.confirmation_email_sent = false'}
          `;

          const queryParams = [userId];

          if (symposium === 'Enigma') {
            query += " AND (ee.id IS NOT NULL OR (p.id IS NOT NULL AND p.name LIKE '%Tech%'))";
          } else if (symposium === 'Carteblanche') {
            query += " AND (cbe.id IS NOT NULL OR (p.id IS NOT NULL AND p.name NOT LIKE '%Tech%' AND p.name != 'Pass Unlocked'))";
          }

          const [items] = await connection.execute(query, queryParams);

          if (items.length === 0) {
            await connection.rollback();
            continue;
          }

          const eventList = items.map(item => `<li>${item.itemName}</li>`).join('');

          const htmlBody = `
            <p>Hello ${user.name},</p>
            <p>${emailContent.replace(/\\n/g, '<br>')}</p>
            <br>
            <p>Your registration for the following items has been confirmed:</p>
            <ul>
              ${eventList}
            </ul>
            <br>
            <p>Thank you,</p>
            <p>CSMIT Team</p>
          `;

          const mailOptions = {
            from: `"CSMIT Team" <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: subject,
            html: htmlBody,
          };

          if (attachment) {
            mailOptions.attachments = [{
              filename: attachment.originalname,
              content: attachment.buffer
            }];
          }

          await transporter.sendMail(mailOptions);

          await connection.execute(
            'UPDATE verified_registrations SET confirmation_email_sent = true WHERE userId = ? AND verified = true',
            [userId]
          );

          await connection.commit();
          sentCount++;

        } catch (error) {
          console.error(`Failed to process user ${userId}:`, error);
          await connection.rollback();
        }
      }

      res.status(200).json({ message: `Bulk email process completed. Sent ${sentCount} emails.` });

    } catch (error) {
      console.error('Failed to send bulk emails:', error);
      res.status(500).json({ message: 'An error occurred while sending bulk emails.' });
    } finally {
      if (connection) connection.release();
    }
  });

  router.post('/send-confirmation', async (req, res) => {
    const { userId, subject, emailContent } = req.body;

    if (!userId || !subject) {
      return res.status(400).json({ message: 'User ID and subject are required.' });
    }

    try {
      const [users] = await db.execute('SELECT email, fullName as name FROM users WHERE id = ?', [userId]);
      if (users.length === 0) {
        return res.status(404).json({ message: 'User not found.' });
      }
      const user = users[0];

      const [items] = await db.execute(
        `SELECT DISTINCT COALESCE(ee.eventName, cbe.eventName, p.name) as itemName
         FROM verified_registrations vr
         LEFT JOIN enigma_events ee ON vr.eventId = ee.id
         LEFT JOIN carte_blanche_events cbe ON vr.eventId = cbe.id
         LEFT JOIN passes p ON vr.passId = p.id
         WHERE vr.userId = ? AND vr.verified = true`,
        [userId]
      );

      const eventList = items.map(item => `<li>${item.itemName}</li>`).join('');

      const htmlBody = `
        <p>Hello ${user.name},</p>
        <p>${emailContent.replace(/\\n/g, '<br>')}</p>
        <br>
        <p>Here are the events you are registered for:</p>
        <ul>
          ${eventList}
        </ul>
        <br>
        <p>Thank you,</p>
        <p>CSMIT Team</p>
      `;

      await transporter.sendMail({
        from: `"CSMIT Team" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: subject,
        html: htmlBody,
      });

      res.status(200).json({ message: 'Confirmation email sent successfully.' });

    } catch (error) {
      console.error('Failed to send email:', error);
      res.status(500).json({ message: 'An error occurred while sending the email.' });
    }
  });

  return router;
};
