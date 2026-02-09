const express = require('express');
const router = express.Router();

module.exports = function (db, uploadTransactionScreenshot) {

  // Helper function to "explode" a verified pass into individual event registrations
  async function explodePassRegistration(executor, userId, passId, transactionId) {
    const [passes] = await executor.execute('SELECT * FROM passes WHERE id = ?', [passId]);
    if (passes.length === 0) return;
    const pass = passes[0];

    // Identify Tech vs Non-Tech
    let category = '';
    const passNameLower = pass.name.toLowerCase();

    if (passNameLower.includes('non-tech') || passNameLower.includes('non tech') || passNameLower.includes('nontech')) {
      category = 'Non-Technical Events';
    } else if (passNameLower.includes('tech')) {
      category = 'Technical Events';
    } else {
      return; // Not a category pass we handle for explosion
    }

    // Fetch Events
    const [events] = await executor.execute(`
        SELECT id, 'Enigma' as symposium FROM enigma_events WHERE eventCategory = ?
        UNION ALL
        SELECT id, 'Carteblanche' as symposium FROM carte_blanche_events WHERE eventCategory = ?
    `, [category, category]);

    // Get User Details for Registration Entry
    const [users] = await executor.execute('SELECT fullName, email, mobile FROM users WHERE id = ?', [userId]);
    if (users.length === 0) return;
    const user = users[0];

    // Insert Registrations & Verified Registrations
    for (const event of events) {
      const [existing] = await executor.execute('SELECT id FROM registrations WHERE userEmail = ? AND eventId = ?', [user.email, event.id]);
      if (existing.length === 0) {
        await executor.execute(`
          INSERT INTO registrations 
          (symposium, eventId, userName, userEmail, mobileNumber, transactionId, transactionAmount, round1, round2, round3)
          VALUES (?, ?, ?, ?, ?, ?, 0, 0, 0, 0)
        `, [event.symposium, event.id, user.fullName, user.email, user.mobile || null, 'PASS_ENTRY']);
      }

      await executor.execute('DELETE FROM verified_registrations WHERE userId = ? AND eventId = ?', [userId, event.id]);
      await executor.execute(
        'INSERT INTO verified_registrations (userId, eventId, passId, verified, transactionId) VALUES (?, ?, ?, ?, ?)',
        [userId, event.id, passId, 1, transactionId]
      );
    }
  }

  router.get('/all', async (req, res) => {
    try {
      const [registrations] = await db.execute(`
        SELECT 
            MIN(r.id) as id,
            u.id as userId,
            r.symposium,
            r.eventId,
            r.passId,
            r.userName,
            r.userEmail,
            r.mobileNumber,
            r.transactionId,
            r.transactionUsername,
            r.transactionTime,
            r.transactionDate,
            r.transactionAmount,
            r.transactionScreenshot,
            CASE
                WHEN r.symposium = 'Accommodation' THEN (CASE WHEN ab.status = 'confirmed' THEN 1 WHEN ab.status = 'rejected' THEN 0 ELSE NULL END)
                ELSE IF(vr.verified IS NULL, NULL, IF(vr.verified, 1, 0))
            END as verified,
            u.college,
            CASE
                WHEN r.symposium = 'Accommodation' THEN 'Accommodation'
                ELSE COALESCE(ee.eventName, cbe.eventName, p.name)
            END as itemName,
            CASE
                WHEN r.symposium = 'Accommodation' THEN 'accommodation'
                WHEN r.passId IS NOT NULL THEN 'pass'
                ELSE 'event'
            END as itemType
        FROM registrations r
        LEFT JOIN users u ON r.userEmail = u.email
        LEFT JOIN enigma_events ee ON r.eventId = ee.id AND r.symposium = 'Enigma'
        LEFT JOIN carte_blanche_events cbe ON r.eventId = cbe.id AND r.symposium = 'Carteblanche'
        LEFT JOIN passes p ON r.passId = p.id
        LEFT JOIN verified_registrations vr ON u.id = vr.userId AND ((r.eventId IS NOT NULL AND r.eventId = vr.eventId) OR (r.passId IS NOT NULL AND r.passId = vr.passId))
        LEFT JOIN accommodation_bookings ab ON u.id = ab.userId AND r.symposium = 'Accommodation'
        WHERE (r.transactionId IS NULL OR r.transactionId != 'PASS_ENTRY')
        GROUP BY r.transactionId, u.id, r.symposium, r.eventId, r.passId, r.userName, r.userEmail, 
                 r.mobileNumber, r.transactionUsername, r.transactionTime, r.transactionDate, 
                 r.transactionAmount, r.transactionScreenshot, u.college, ee.eventName, cbe.eventName, 
                 p.name, vr.verified, ab.status
        ORDER BY MAX(r.createdAt) DESC
      `);
      res.status(200).json(registrations);
    } catch (error) {
      console.error('Failed to fetch all registrations:', error);
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
        passIds,
        transactionId,
        transactionUsername,
        transactionTime,
        transactionDate,
        transactionAmount,
        mobileNumber,
      } = req.body;

      const transactionScreenshot = req.file ? req.file.buffer : null;
      const parsedEventIds = eventIds ? JSON.parse(eventIds) : [];
      const parsedPassIds = passIds ? JSON.parse(passIds) : [];
      const accommodationInfo = req.body.accommodation ? JSON.parse(req.body.accommodation) : null;

      if (!userId) return res.status(400).json({ message: 'Missing required field: userId.' });
      if (parsedEventIds.length === 0 && parsedPassIds.length === 0 && !accommodationInfo) return res.status(400).json({ message: 'No items to register.' });
      if (!transactionId) return res.status(400).json({ message: 'Missing required field: transactionId.' });
      if (!transactionTime) return res.status(400).json({ message: 'Missing required field: transactionTime.' });
      if (!transactionDate) return res.status(400).json({ message: 'Missing required field: transactionDate.' });
      if (transactionAmount === undefined) return res.status(400).json({ message: 'Missing required field: transactionAmount.' });
      if (!mobileNumber) return res.status(400).json({ message: 'Missing required field: mobileNumber.' });
      if (!transactionScreenshot) return res.status(400).json({ message: 'Missing required field: transactionScreenshot.' });

      let connection;
      try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        // --- Check for unique transaction ID ---
        const [existingTransaction] = await connection.execute(
          'SELECT id FROM registrations WHERE transactionId = ?',
          [transactionId]
        );
        if (existingTransaction.length > 0) {
          return res
            .status(409)
            .json({ message: 'Transaction ID already used for another registration.' });
        }

        // --- Get User Details ---
        const [[user]] = await connection.execute(
          'SELECT fullName, email FROM users WHERE id = ?',
          [userId]
        );
        if (!user) {
          throw new Error(`User with ID ${userId} not found.`);
        }

        // --- Process Event Registrations ---
        for (const eventId of parsedEventIds) {
          const [[event]] = await connection.execute(
            `SELECT eventName, registrationFees, discountPercentage, 'Enigma' as symposium 
             FROM enigma_events WHERE id = ? 
             UNION 
             SELECT eventName, registrationFees, discountPercentage, 'Carteblanche' as symposium 
             FROM carte_blanche_events WHERE id = ?`,
            [eventId, eventId]
          );
          if (!event) {
            console.warn(`Event with ID ${eventId} not found. Skipping.`);
            continue;
          }

          const discount = event.discountPercentage || 0;
          const effectiveFee = Math.floor(event.registrationFees * (1 - discount / 100));

          const [existing] = await connection.execute(
            'SELECT id FROM registrations WHERE userEmail = ? AND eventId = ?',
            [user.email, eventId]
          );
          if (existing.length > 0) {
            console.warn(`Already registered for event ${event.eventName}. Skipping.`);
            continue;
          }

          await connection.execute(
            `INSERT INTO registrations 
             (symposium, eventId, userName, userEmail, mobileNumber, transactionId, transactionUsername, transactionTime, transactionDate, transactionAmount, transactionScreenshot, round1, round2, round3) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0)`,
            [
              event.symposium,
              eventId,
              user.fullName,
              user.email,
              mobileNumber,
              transactionId,
              transactionUsername || user.fullName,
              transactionTime,
              transactionDate,
              effectiveFee,
              transactionScreenshot,
            ]
          );
        }

        // --- Process Pass Registrations ---
        for (const passId of parsedPassIds) {
          const [[pass]] = await connection.execute(
            'SELECT name, cost FROM passes WHERE id = ?',
            [passId]
          );
          if (!pass) {
            console.warn(`Pass with ID ${passId} not found. Skipping.`);
            continue;
          }

          const [existing] = await connection.execute(
            'SELECT id FROM registrations WHERE userEmail = ? AND passId = ?',
            [user.email, passId]
          );
          if (existing.length > 0) {
            console.warn(`Already registered for pass ${pass.name}. Skipping.`);
            continue;
          }
          const [symposiumStatus] = await connection.execute(
            'SELECT symposiumName FROM symposium_status WHERE isOpen = 1'
          );
          const activeSymposium = symposiumStatus.length > 0 ? symposiumStatus[0].symposiumName : 'Carteblanche';

          const symposium = activeSymposium;

          await connection.execute(
            `INSERT INTO registrations 
                 (symposium, passId, userName, userEmail, mobileNumber, transactionId, transactionUsername, transactionTime, transactionDate, transactionAmount, transactionScreenshot) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              symposium,
              passId,
              user.fullName,
              user.email,
              mobileNumber,
              transactionId,
              transactionUsername || user.fullName,
              transactionTime,
              transactionDate,
              pass.cost,
              transactionScreenshot,
            ]
          );
        }

        // --- Process Accommodation Booking ---
        if (accommodationInfo) {
          ('Accommodation info found, processing booking...');
          const { gender, accommodationDetails } = accommodationInfo;
          const quantity = accommodationDetails.quantity;

          const [[accommodation]] = await connection.execute(
            'SELECT fees, available_rooms FROM accommodation WHERE gender = ?',
            [gender]
          );


          if (!accommodation || accommodation.available_rooms < quantity) {
            console.error(`Not enough rooms available for ${gender}. Available: ${accommodation ? accommodation.available_rooms : 0}, Required: ${quantity}`);
            throw new Error(`Not enough rooms available for ${gender}.`);
          }
          const accommodationFee = accommodation.fees * quantity;

          await connection.execute(
            `INSERT INTO registrations 
             (symposium, userName, userEmail, mobileNumber, transactionId, transactionUsername, transactionTime, transactionDate, transactionAmount, transactionScreenshot) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              'Accommodation',
              user.fullName,
              user.email,
              mobileNumber,
              transactionId,
              transactionUsername || user.fullName,
              transactionTime,
              transactionDate,
              accommodationFee,
              transactionScreenshot,
            ]
          );

          const [existingBooking] = await connection.execute(
            'SELECT id FROM accommodation_bookings WHERE userId = ?',
            [userId]
          );

          if (existingBooking.length === 0) {

            // FIX: Removed 'isVerified' from the INSERT columns and values
            await connection.execute(
              'INSERT INTO accommodation_bookings (userId, gender, status, transactionId, quantity) VALUES (?, ?, ?, ?, ?)',
              [userId, gender, 'pending', transactionId, quantity]
            );

            const [updateResult] = await connection.execute(
              'UPDATE accommodation SET available_rooms = available_rooms - ? WHERE gender = ?',
              [quantity, gender]
            );

            if (updateResult.affectedRows === 0) {
              console.error(`Failed to update accommodation room count for ${gender}.`);
              throw new Error(`Failed to update accommodation room count for ${gender}.`);
            }
          } else {
          }
        }

        await connection.commit();

        res
          .status(201)
          .json({ message: 'Registration successful for all items.' });
      } catch (error) {
        if (connection) {
          await connection.rollback();
        }
        res
          .status(500)
          .json({ message: error.message || 'Failed to register.' });
      } finally {
        if (connection) {
          connection.release();
        }
      }
    }
  );

  router.get('/registered-users', async (req, res) => {
    try {
      let query = `
        SELECT 
          u.id, 
          u.fullName, 
          u.email, 
          u.mobile, 
          u.college, 
          u.department, 
          u.yearOfPassing, 
          u.state, 
          u.district,
          COUNT(r.id) AS totalEvents,
          COALESCE(CAST(GROUP_CONCAT(DISTINCT r.symposium SEPARATOR ', ') AS CHAR), 'N/A') AS symposiums
        FROM users u
        INNER JOIN registrations r ON u.email = r.userEmail
      `;

      const queryParams = [];
      const { symposium } = req.query;

      if (symposium && symposium !== 'All') {
        query += ` WHERE r.symposium = ? `;
        queryParams.push(symposium);
      }

      query += `
        GROUP BY u.id, u.fullName, u.email, u.mobile, u.college, 
                 u.department, u.yearOfPassing, u.state, u.district
        ORDER BY totalEvents DESC;
      `;

      const [users] = await db.execute(query, queryParams);
      res.status(200).json(users);
    } catch (error) {
      console.error('Error fetching active users:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });

  router.get('/event/:eventId', async (req, res) => {
    const { eventId } = req.params;
    try {
      const [registrations] = await db.execute(
        `SELECT r.id, r.transactionId, r.transactionUsername, r.transactionTime, r.transactionDate, r.transactionAmount, 
                u.fullName as userName, u.email, u.college, u.mobile AS mobileNumber 
         FROM registrations r 
         JOIN users u ON r.userEmail = u.email 
         WHERE r.eventId = ?`,
        [eventId]
      );

      const allRegistrations = registrations.map((reg) => ({
        ...reg,
        email: reg.email || 'N/A',
        college: reg.college || 'N/A',
      }));

      res.status(200).json(allRegistrations);
    } catch (error) {
      console.error("Error fetching user registrations:", error);
      res.status(500).json({ message: "Failed to fetch user registrations." });
    }
  });

  router.get('/by-email/:userEmail', async (req, res) => {
    const { userEmail } = req.params;
    try {
      const [registrations] = await db.execute(
        'SELECT eventId FROM registrations WHERE userEmail = ?',
        [userEmail]
      );
      res.status(200).json(registrations);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch registered events.' });
    }
  });

  router.get('/verified/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
      const [verifiedItems] = await db.execute(
        `SELECT vr.eventId, vr.passId, p.name as passName 
         FROM verified_registrations vr
         LEFT JOIN passes p ON vr.passId = p.id
         WHERE vr.userId = ? AND vr.verified = true`,
        [userId]
      );
      res.status(200).json(verifiedItems);
    } catch (error) {
      console.error('Error fetching verified items:', error);
      res.status(500).json({ message: 'Failed to fetch verified items.' });
    }
  });

  router.post('/simple', async (req, res) => {
    const { userEmail, eventId, userName, college } = req.body;

    if (!userEmail || !eventId || !userName || !college) {
      return res
        .status(400)
        .json({ message: 'Missing required fields for simple registration.' });
    }

    try {
      // [MODIFIED] Fetch discountPercentage to check if event is effectively free
      const [[event]] = await db.execute(
        `SELECT eventName, registrationFees, discountPercentage, 'Enigma' as symposium 
         FROM enigma_events WHERE id = ? 
         UNION 
         SELECT eventName, registrationFees, discountPercentage, 'Carteblanche' as symposium 
         FROM carte_blanche_events WHERE id = ?`,
        [eventId, eventId]
      );

      if (!event) {
        return res.status(404).json({ message: 'Event not found.' });
      }

      // [MODIFIED] Calculate effective price
      const discount = event.discountPercentage || 0;
      const effectiveFee = Math.floor(event.registrationFees * (1 - discount / 100));

      // [MODIFIED] Check effective fee instead of raw registrationFees
      if (effectiveFee > 0) {
        return res.status(400).json({ message: 'This endpoint is only for free events.' });
      }

      const [existing] = await db.execute(
        'SELECT id FROM registrations WHERE userEmail = ? AND eventId = ?',
        [userEmail, eventId]
      );

      if (existing.length > 0) {
        return res
          .status(409)
          .json({ message: 'Already registered for this event.' });
      }

      await db.execute(
        `INSERT INTO registrations 
         (symposium, eventId, userName, userEmail, transactionAmount, round1, round2, round3) 
         VALUES (?, ?, ?, ?, ?, 0, 0, 0)`,
        [
          event.symposium,
          eventId,
          userName,
          userEmail,
          0,
        ]
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

      const [allRegistrations] = await db.execute(
        `SELECT r.id, r.eventId, r.passId, r.userEmail, r.round1, r.round2, r.round3, r.symposium, 
                IF(r.passId IS NOT NULL, 'pass', 'event') as itemType
         FROM registrations r
         JOIN users u ON r.userEmail = u.email
         JOIN verified_registrations vr ON u.id = vr.userId 
           AND (
             (r.eventId IS NOT NULL AND r.eventId = vr.eventId) 
             OR 
             (r.passId IS NOT NULL AND r.eventId IS NULL AND vr.passId = r.passId AND vr.eventId IS NULL)
           )
         WHERE u.id = ? AND vr.verified = 1
         GROUP BY r.id`,
        [userId]
      );

      const registrationsWithDetails = [];
      const eventIds = new Set();
      let hasTechPass = false;
      let hasNonTechPass = false;
      let techPassRounds = { r1: 0, r2: 0, r3: 0 };
      let nonTechPassRounds = { r1: 0, r2: 0, r3: 0 };

      for (const reg of allRegistrations) {
        if (reg.itemType === 'event') {
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
            const [eventRows] = await db.execute(
              `SELECT * FROM ${eventTable} WHERE id = ?`,
              [reg.eventId]
            );
            event = eventRows[0];
            if (event) {
              const [roundsResult] = await db.execute(
                `SELECT * FROM ${roundsTable} WHERE eventId = ?`,
                [reg.eventId]
              );
              event.rounds = roundsResult;
              registrationsWithDetails.push({ ...reg, event });
              eventIds.add(reg.eventId);
            }
          }
        } else if (reg.itemType === 'pass') {
          const [[pass]] = await db.execute(
            `SELECT * FROM passes WHERE id = ?`,
            [reg.passId]
          );
          if (pass) {
            registrationsWithDetails.push({ ...reg, pass });
            const passNameLower = pass.name.toLowerCase();
            const passRounds = { r1: reg.round1, r2: reg.round2, r3: reg.round3 };

            // IMPORTANT: Check 'non-tech' FIRST before 'tech' because 'non-tech' contains 'tech'
            if (passNameLower.includes('non-tech') || passNameLower.includes('nontech') || passNameLower.includes('non tech')) {
              hasNonTechPass = true;
              nonTechPassRounds = passRounds;
            } else if (passNameLower.includes('tech')) {
              hasTechPass = true;
              techPassRounds = passRounds;
            }
          }
        }
      }


      const fetchEventsByCategory = async (category, symposium, rounds) => {
        const eventTable = symposium === 'Enigma' ? 'enigma_events' : 'carte_blanche_events';
        const roundsTable = symposium === 'Enigma' ? 'enigma_rounds' : 'carte_blanche_rounds';

        const [events] = await db.execute(`SELECT * FROM ${eventTable} WHERE eventCategory = ?`, [category]);

        for (const event of events) {
          if (!eventIds.has(event.id)) {
            const [roundsResult] = await db.execute(`SELECT * FROM ${roundsTable} WHERE eventId = ?`, [event.id]);
            event.rounds = roundsResult;
            registrationsWithDetails.push({
              id: `pass-${event.id}`,
              itemType: 'event',
              eventId: event.id,
              symposium,
              round1: rounds.r1, round2: rounds.r2, round3: rounds.r3,
              pass: { name: 'Pass Unlocked' },
              event,
            });
            eventIds.add(event.id);
          }
        }
      };

      const [symposiumStatusRows] = await db.execute('SELECT symposiumName, isOpen FROM symposium_status');
      const symposiumStatus = symposiumStatusRows.reduce((acc, row) => {
        acc[row.symposiumName] = row.isOpen === 1;
        return acc;
      }, {});

      if (hasTechPass) {
        if (symposiumStatus['Enigma']) await fetchEventsByCategory('Technical Events', 'Enigma', techPassRounds);
        if (symposiumStatus['Carteblanche']) await fetchEventsByCategory('Technical Events', 'Carteblanche', techPassRounds);
      }
      if (hasNonTechPass) {
        if (symposiumStatus['Enigma']) await fetchEventsByCategory('Non-Technical Events', 'Enigma', nonTechPassRounds);
        if (symposiumStatus['Carteblanche']) await fetchEventsByCategory('Non-Technical Events', 'Carteblanche', nonTechPassRounds);
      }

      res.status(200).json(registrationsWithDetails);
    } catch (error) {
      console.error("Failed to fetch user registrations:", error);
      res.status(500).json({ message: 'Failed to fetch user registrations.' });
    }
  });

  // Get all users for admin registration
  router.get('/users', async (req, res) => {
    try {
      const [users] = await db.execute('SELECT id, fullName, email FROM users');
      res.status(200).json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Failed to fetch users.' });
    }
  });

  // Admin/Organizer registration of a user for events/passes
  router.post('/admin-register', async (req, res) => {
    const { userId, eventIds, passIds } = req.body;

    if (!userId || (!eventIds && !passIds)) {
      return res.status(400).json({ message: 'Missing userId or event/pass selections.' });
    }

    let connection;
    try {
      connection = await db.getConnection();
      await connection.beginTransaction();

      const [[user]] = await connection.execute('SELECT fullName, email, mobile FROM users WHERE id = ?', [userId]);
      if (!user) {
        throw new Error(`User with ID ${userId} not found.`);
      }

      // Process Event Registrations
      if (eventIds && eventIds.length > 0) {
        for (const eventId of eventIds) {
          const [[enigmaEvent]] = await connection.execute('SELECT eventName FROM enigma_events WHERE id = ?', [eventId]);
          const [[cbEvent]] = await connection.execute('SELECT eventName FROM carte_blanche_events WHERE id = ?', [eventId]);

          const event = enigmaEvent || cbEvent;
          if (!event) {
            console.warn(`Event with ID ${eventId} not found. Skipping.`);
            continue;
          }
          const symposium = enigmaEvent ? 'Enigma' : 'Carteblanche';

          const [existing] = await connection.execute('SELECT id FROM registrations WHERE userEmail = ? AND eventId = ?', [user.email, eventId]);
          if (existing.length > 0) {
            console.warn(`User ${user.email} already registered for event ${eventId}. Skipping.`);
            continue;
          }

          await connection.execute(
            `INSERT INTO registrations (symposium, eventId, userName, userEmail, mobileNumber, transactionId, transactionAmount, round1, round2, round3) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, 0)`,
            [symposium, eventId, user.fullName, user.email, user.mobile || null, 'ADMIN_REG', 0]
          );

          await connection.execute(
            'INSERT INTO verified_registrations (userId, eventId, verified) VALUES (?, ?, ?)',
            [userId, eventId, true]
          );
        }
      }

      // Process Pass Registrations
      if (passIds && passIds.length > 0) {
        for (const passId of passIds) {
          const [[pass]] = await connection.execute('SELECT name FROM passes WHERE id = ?', [passId]);
          if (!pass) {
            console.warn(`Pass with ID ${passId} not found. Skipping.`);
            continue;
          }

          const [existing] = await connection.execute('SELECT id FROM registrations WHERE userEmail = ? AND passId = ?', [user.email, passId]);
          if (existing.length > 0) {
            console.warn(`User ${user.email} already registered for pass ${passId}. Skipping.`);
            continue;
          }

          // Use the active symposium for passes (consistent with user payment flow)
          const [symposiumStatus] = await connection.execute(
            'SELECT symposiumName FROM symposium_status WHERE isOpen = 1'
          );
          const symposium = symposiumStatus.length > 0 ? symposiumStatus[0].symposiumName : 'Carteblanche';

          await connection.execute(
            `INSERT INTO registrations (symposium, passId, userName, userEmail, mobileNumber, transactionId, transactionAmount) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [symposium, passId, user.fullName, user.email, user.mobile || null, 'ADMIN_REG', 0]
          );

          await connection.execute(
            'INSERT INTO verified_registrations (userId, passId, verified) VALUES (?, ?, ?)',
            [userId, passId, true]
          );

          // [EXPLOSION] Trigger pass explosion to create individual event registrations
          await explodePassRegistration(connection, userId, passId, 'ADMIN_REG');
        }
      }

      await connection.commit();
      connection.release();

      res.status(201).json({ message: 'User successfully registered for selected items.' });

    } catch (error) {
      if (connection) {
        await connection.rollback();
        connection.release();
      }
      console.error('Admin registration failed:', error);
      res.status(500).json({ message: error.message || 'Failed to register user.' });
    }
  });


  // Delete registration by ID
  router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    let connection;
    try {
      connection = await db.getConnection();
      await connection.beginTransaction();

      // 1. Get the registration details before deleting
      const [[registration]] = await connection.execute(
        'SELECT r.userEmail, r.eventId, r.passId, u.id as userId FROM registrations r LEFT JOIN users u ON r.userEmail = u.email WHERE r.id = ?',
        [id]
      );

      if (!registration) {
        await connection.rollback();
        return res.status(404).json({ message: 'Registration not found.' });
      }

      // 2. Delete from verified_registrations if userId exists
      if (registration.userId) {
        if (registration.eventId) {
          await connection.execute(
            'DELETE FROM verified_registrations WHERE userId = ? AND eventId = ?',
            [registration.userId, registration.eventId]
          );
        } else if (registration.passId) {
          // For passes, also delete all exploded event verified_registrations linked to this pass
          await connection.execute(
            'DELETE FROM verified_registrations WHERE userId = ? AND passId = ?',
            [registration.userId, registration.passId]
          );
        }
      }

      // 3. Delete the registration itself
      const [result] = await connection.execute('DELETE FROM registrations WHERE id = ?', [id]);
      if (result.affectedRows === 0) {
        await connection.rollback();
        return res.status(404).json({ message: 'Registration not found.' });
      }

      await connection.commit();
      res.status(200).json({ message: 'Registration deleted successfully.' });
    } catch (error) {
      if (connection) await connection.rollback();
      console.error('Error deleting registration:', error);
      res.status(500).json({ message: 'Failed to delete registration.' });
    } finally {
      if (connection) connection.release();
    }
  });

  return router;
};