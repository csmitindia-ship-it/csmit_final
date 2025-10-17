const express = require('express');
const router = express.Router();

module.exports = function (db, uploadTransactionScreenshot) {
  router.get('/all', async (req, res) => {
    try {
      const [registrations] = await db.execute(`
        SELECT r.*, u.id as userId, vr.verified
        FROM registrations r 
        LEFT JOIN users u ON r.userEmail = u.email
        LEFT JOIN verified_registrations vr ON u.id = vr.userId AND r.eventId = vr.eventId
      `);
      res.status(200).json(registrations);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch all registrations.' });
    }
  });

  router.get('/check-transaction/:transactionId', async (req, res) => {
    const { transactionId } = req.params;
    try {
      const [existing] = await db.execute(
        'SELECT id FROM registrations WHERE transactionId = ?',
        [transactionId]
      );
      if (existing.length > 0) {
        return res
          .status(200)
          .json({ exists: true, message: 'Transaction ID already used.' });
      }
      res
        .status(200)
        .json({ exists: false, message: 'Transaction ID is available.' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to check transaction ID.' });
    }
  });

  router.post(
    '/',
    uploadTransactionScreenshot.single('transactionScreenshot'),
    async (req, res) => {
      const {
        userId,
        eventIds,
        transactionId,
        transactionUsername,
        transactionTime,
        transactionDate,
        transactionAmount,
        mobileNumber,
      } = req.body;

      const transactionScreenshot = req.file ? req.file.buffer : null;
      const parsedEventIds = JSON.parse(eventIds);

      if (
        !userId ||
        !parsedEventIds ||
        !Array.isArray(parsedEventIds) ||
        parsedEventIds.length === 0 ||
        !transactionId ||
        !transactionUsername ||
        !transactionTime ||
        !transactionDate ||
        transactionAmount === undefined ||
        !mobileNumber ||
        !transactionScreenshot
      ) {
        return res
          .status(400)
          .json({ message: 'Missing required fields for registration.' });
      }

      try {
        const [existingTransaction] = await db.execute(
          'SELECT id FROM registrations WHERE transactionId = ?',
          [transactionId]
        );
        if (existingTransaction.length > 0) {
          return res
            .status(409)
            .json({ message: 'Transaction ID already used for another registration.' });
        }

        for (const eventId of parsedEventIds) {
          const [[event]] = await db.execute(
            `SELECT eventName, registrationFees, 'Enigma' as symposium 
             FROM enigma_events WHERE id = ? 
             UNION 
             SELECT eventName, registrationFees, 'Carteblanche' as symposium 
             FROM carte_blanche_events WHERE id = ?`,
            [eventId, eventId]
          );
          if (!event) {
            throw new Error(`Event with ID ${eventId} not found.`);
          }

          const [[user]] = await db.execute(
            'SELECT fullName, email FROM users WHERE id = ?',
            [userId]
          );
          if (!user) {
            throw new Error(`User with ID ${userId} not found.`);
          }

          const [existing] = await db.execute(
            'SELECT id FROM registrations WHERE userEmail = ? AND eventId = ?',
            [user.email, eventId]
          );
          if (existing.length > 0) {
            throw new Error(`Already registered for event ${event.eventName}.`);
          }

          await db.execute(
            `INSERT INTO registrations 
             (symposium, eventId, userName, userEmail, mobileNumber, transactionId, transactionUsername, transactionTime, transactionDate, transactionAmount, transactionScreenshot) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              event.symposium,
              eventId,
              user.fullName,
              user.email,
              mobileNumber,
              transactionId,
              transactionUsername,
              transactionTime,
              transactionDate,
              event.registrationFees,
              transactionScreenshot,
            ]
          );
        }

        res
          .status(201)
          .json({ message: 'Registration successful for all events.' });
      } catch (error) {
        res
          .status(500)
          .json({ message: error.message || 'Failed to register.' });
      }
    }
  );

  router.get('/event/:eventId', async (req, res) => {
    const { eventId } = req.params;
    try {
      const [workshopRegistrations] = await db.execute(
        `SELECT r.transactionId, r.transactionUsername, r.transactionTime, r.transactionDate, r.transactionAmount, 
                u.fullName as userName, u.email, u.college 
         FROM registrations r 
         JOIN users u ON r.userEmail = u.email 
         JOIN verified_registrations vr ON u.id = vr.userId AND r.eventId = vr.eventId
         WHERE r.eventId = ? AND vr.verified = true`,
        [eventId]
      );

      const [nonWorkshopRegistrations] = await db.execute(
        `SELECT u.fullName as userName, u.email, u.college, 
                NULL as transactionId, NULL as transactionUsername, NULL as transactionTime, NULL as transactionDate, NULL as transactionAmount 
         FROM enigma_non_workshop_registrations enr 
         JOIN users u ON enr.userEmail = u.email 
         JOIN verified_registrations vr ON u.id = vr.userId AND enr.eventId = vr.eventId
         WHERE enr.eventId = ? AND vr.verified = true`,
        [eventId]
      );

      const allRegistrations = [
        ...workshopRegistrations.map((reg) => ({
          ...reg,
          email: reg.email || 'N/A',
          college: reg.college || 'N/A',
        })),
        ...nonWorkshopRegistrations.map((reg) => ({
          ...reg,
          email: reg.email || 'N/A',
          college: reg.college || 'N/A',
        })),
      ];

      res.status(200).json(allRegistrations);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch event registrations.' });
    }
  });

  router.get('/by-email/:userEmail', async (req, res) => {
    const { userEmail } = req.params;
    try {
      const [workshopRegistrations] = await db.execute(
        'SELECT eventId FROM registrations WHERE userEmail = ?',
        [userEmail]
      );

      const [nonWorkshopRegistrations] = await db.execute(
        'SELECT eventId FROM enigma_non_workshop_registrations WHERE userEmail = ?',
        [userEmail]
      );

      const allRegistrations = [
        ...workshopRegistrations,
        ...nonWorkshopRegistrations,
      ];

      res.status(200).json(allRegistrations);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch registered events.' });
    }
  });

  router.get('/verified/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
      const [verifiedEvents] = await db.execute(
        `SELECT e.*, 'Enigma' as symposiumName 
         FROM enigma_events e
         JOIN verified_registrations vr ON e.id = vr.eventId
         WHERE vr.userId = ? AND vr.verified = true
         UNION
         SELECT e.*, 'Carteblanche' as symposiumName
         FROM carte_blanche_events e
         JOIN verified_registrations vr ON e.id = vr.eventId
         WHERE vr.userId = ? AND vr.verified = true`,
        [userId, userId]
      );
      res.status(200).json(verifiedEvents);
    } catch (error) {
      res
        .status(500)
        .json({ message: 'Failed to fetch verified registered events.' });
    }
  });

  router.post('/simple', async (req, res) => {
    const { userEmail, eventId } = req.body;

    if (!userEmail || !eventId) {
      return res
        .status(400)
        .json({ message: 'Missing required fields for simple registration.' });
    }

    try {
      const [existing] = await db.execute(
        'SELECT id FROM enigma_non_workshop_registrations WHERE userEmail = ? AND eventId = ?',
        [userEmail, eventId]
      );
      if (existing.length > 0) {
        return res
          .status(409)
          .json({ message: 'Already registered for this event.' });
      }

      await db.execute(
        'INSERT INTO enigma_non_workshop_registrations (userEmail, eventId) VALUES (?, ?)',
        [userEmail, eventId]
      );

      res.status(201).json({ message: 'Registration successful.' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to register.' });
    }
  });

  router.get('/user/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
      const [[user]] = await db.execute(
        'SELECT email FROM users WHERE id = ?',
        [userId]
      );
      if (!user) {
        return res.status(404).json({ message: 'User not found.' });
      }
      const userEmail = user.email;

      const [allRegistrations] = await db.execute(
        `SELECT id, eventId, userEmail, round1, round2, round3, symposium 
         FROM registrations WHERE userEmail = ?
         UNION
         SELECT id, eventId, userEmail, -1 as round1, -1 as round2, -1 as round3, 'Enigma' as symposium 
         FROM enigma_non_workshop_registrations WHERE userEmail = ?`,
        [userEmail, userEmail]
      );

      const registrationsWithEvents = [];
      for (const reg of allRegistrations) {
        let event;
        let eventTable = '';
        let roundsTable = '';

        if (reg.symposium === 'Enigma') {
          eventTable = 'enigma_events';
          roundsTable = 'enigma_rounds';
        } else if (reg.symposium === 'Carteblanche') {
          eventTable = 'carte_blanche_events';
          roundsTable = 'carte_blanche_rounds';
        }

        if (eventTable) {
          const [[eventResult]] = await db.execute(
            `SELECT * FROM ${eventTable} WHERE id = ?`,
            [reg.eventId]
          );
          event = eventResult;
          if (event) {
            const [roundsResult] = await db.execute(
              `SELECT * FROM ${roundsTable} WHERE eventId = ?`,
              [reg.eventId]
            );
            event.rounds = roundsResult;
          }
        }

        registrationsWithEvents.push({ ...reg, event });
      }

      res.status(200).json(registrationsWithEvents);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch user registrations.' });
    }
  });

  return router;
};
