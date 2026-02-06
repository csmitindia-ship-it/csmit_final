const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

module.exports = function (db, uploadEventPoster, transporter) {
  router.post('/', async (req, res) => {
    const {
      symposiumName,
      eventName,
      eventCategory,
      eventDescription,
      numberOfRounds,
      teamOrIndividual,
      location,
      registrationFees,
      organizerId,
      lastDateForRegistration,
      isOpenForNonMIT,
      rounds,
    } = req.body;

    if (!symposiumName || !eventName || !eventCategory || !eventDescription ||
      numberOfRounds === undefined || !teamOrIndividual || !location ||
      registrationFees === undefined || !organizerId || !lastDateForRegistration || !rounds) {
      return res.status(400).json({ message: 'Missing required event fields.' });
    }

    try {
      const [[organizer]] = await db.execute('SELECT name, mobile, email FROM organizers WHERE id = ?', [organizerId]);
      if (!organizer) {
        return res.status(404).json({ message: 'Organizer not found.' });
      }

      const { name: coordinatorName, mobile: coordinatorContactNo, email: coordinatorMail } = organizer;

      let eventTable;
      let roundsTable;
      if (symposiumName === 'Enigma') {
        eventTable = 'enigma_events';
        roundsTable = 'enigma_rounds';
      } else if (symposiumName === 'Carteblanche') {
        eventTable = 'carte_blanche_events';
        roundsTable = 'carte_blanche_rounds';
      } else {
        return res.status(400).json({ message: 'Invalid symposium name.' });
      }

      const [eventResult] = await db.execute(
        `INSERT INTO ${eventTable} (
          eventName, eventCategory, eventDescription, numberOfRounds, teamOrIndividual,
          location, registrationFees, coordinatorName, coordinatorContactNo, coordinatorMail,
          lastDateForRegistration, open_to_non_mit
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          eventName, eventCategory, eventDescription, numberOfRounds, teamOrIndividual,
          location, registrationFees, coordinatorName, coordinatorContactNo, coordinatorMail,
          lastDateForRegistration, isOpenForNonMIT ? 1 : 0,
        ]
      );


      const eventId = eventResult.insertId;

      for (const round of rounds) {
        await db.execute(
          `INSERT INTO ${roundsTable} (eventId, roundNumber, roundDetails, roundDateTime) VALUES (?, ?, ?, ?)`,
          [eventId, round.roundNumber, round.roundDetails, round.roundDateTime]
        );
      }

      res.status(201).json({ message: 'Event added successfully.', eventId });
    } catch (error) {
      res.status(500).json({ message: 'Failed to add event.' });
    }
  });
  router.post('/apply-discount', async (req, res) => {
    const { symposiumName, eventCategory, discountPercentage, discountReason, isForMIT } = req.body;

    if (!symposiumName || !eventCategory || discountPercentage === undefined) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

    let eventTable;
    if (symposiumName === 'Enigma') {
      eventTable = 'enigma_events';
    } else if (symposiumName === 'Carteblanche') {
      eventTable = 'carte_blanche_events';
    } else {
      return res.status(400).json({ message: 'Invalid symposium name.' });
    }

    try {
      if (isForMIT) {
        await db.execute(
          `UPDATE ${eventTable} SET mit_discount_percentage = ? WHERE eventCategory = ?`,
          [discountPercentage, eventCategory]
        );
      } else {
        await db.execute(
          `UPDATE ${eventTable} SET discountPercentage = ?, discountReason = ? WHERE eventCategory = ?`,
          [discountPercentage, discountReason || '', eventCategory]
        );
      }
      res.status(200).json({ message: 'Discounts updated successfully.' });
    } catch (error) {
      console.error('Error applying discount:', error);
      res.status(500).json({ message: 'Failed to apply discount.' });
    }
  });

  // [UPDATED] Get all events (Include discount columns in SELECT)
  router.get('/', async (req, res) => {
    try {
      // Added discountPercentage and discountReason to the SELECT query
      const [enigmaEvents] = await db.execute('SELECT id, eventName, eventCategory, eventDescription, numberOfRounds, teamOrIndividual, location, registrationFees, coordinatorName, coordinatorContactNo, coordinatorMail, lastDateForRegistration, posterImage, open_to_non_mit, discountPercentage, discountReason, mit_discount_percentage, createdAt FROM enigma_events');
      const [carteBlancheEvents] = await db.execute('SELECT id, eventName, eventCategory, eventDescription, numberOfRounds, teamOrIndividual, location, registrationFees, coordinatorName, coordinatorContactNo, coordinatorMail, lastDateForRegistration, posterImage, open_to_non_mit, discountPercentage, discountReason, mit_discount_percentage, createdAt FROM carte_blanche_events');

      const allEvents = [];
      // ... (Rest of the loop logic remains the same) ...
      for (const event of enigmaEvents) {
        if (event.posterImage) {
          event.posterImage = event.posterImage.toString('base64');
        }
        const [rounds] = await db.execute('SELECT roundNumber, roundDetails, roundDateTime FROM enigma_rounds WHERE eventId = ?', [event.id]);
        allEvents.push({ ...event, symposiumName: 'Enigma', rounds });
      }

      for (const event of carteBlancheEvents) {
        if (event.posterImage) {
          event.posterImage = event.posterImage.toString('base64');
        }
        const [rounds] = await db.execute('SELECT roundNumber, roundDetails, roundDateTime FROM carte_blanche_rounds WHERE eventId = ?', [event.id]);
        allEvents.push({ ...event, symposiumName: 'Carteblanche', rounds });
      }

      res.json(allEvents);
    } catch (error) {
      // ... existing error handling
      console.error('Error fetching events:', error);
      res.status(500).json({ message: 'Failed to fetch events.' });
    }
  });

  // [UPDATED] Get specific event (Include discount columns in SELECT)
  router.get('/:id', async (req, res) => {
    // ... existing setup ...
    const { id } = req.params;
    const { symposium } = req.query;

    // ... existing table selection logic ...
    let eventTable;
    if (symposium === 'Enigma') { eventTable = 'enigma_events'; }
    else if (symposium === 'Carteblanche') { eventTable = 'carte_blanche_events'; }
    else { return res.status(400).json({ message: 'Invalid symposium name.' }); }

    try {
      const [rows] = await db.execute(`SELECT * FROM ${eventTable} WHERE id = ?`, [id]);
      // ... rest of the function remains the same
      if (rows.length === 0) { return res.status(404).json({ message: 'Event not found.' }); }
      const event = rows[0];
      if (event.posterImage) { event.posterImage = event.posterImage.toString('base64'); }
      res.json(event);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch event.' });
    }
  });


  router.get('/:eventId/registrations', async (req, res) => {
    const { eventId } = req.params;
    const { symposium } = req.query;

    if (!symposium) {
      return res.status(400).json({ message: 'Symposium query parameter is required.' });
    }

    try {
      const [registrations] = await db.execute(
        `SELECT 
            u.id as userId, 
            u.fullName as name, 
            u.email, 
            u.mobile, 
            u.department, 
            u.yearOfPassing, 
            u.college,
            MAX(COALESCE(r_event.id, r_pass.id)) as id,
            u.email as userEmail,
            ? as eventId,
            MAX(COALESCE(r_event.round1, r_pass.round1, 0)) as round1,
            MAX(COALESCE(r_event.round2, r_pass.round2, 0)) as round2,
            MAX(COALESCE(r_event.round3, r_pass.round3, 0)) as round3,
            MAX(COALESCE(r_event.symposium, r_pass.symposium)) as symposium
         FROM users u
         JOIN (
            -- Case 1: Direct verified registration for this event
            SELECT DISTINCT userId FROM verified_registrations 
            WHERE eventId = ? AND verified = true
            
            UNION -- Use UNION to remove duplicates between direct and pass access
            
            -- Case 2: User has a verified pass that unlocks this event category
            SELECT DISTINCT vr.userId
            FROM verified_registrations vr
            JOIN passes p ON vr.passId = p.id
            JOIN (
                SELECT id, eventCategory, 'Enigma' as symposium FROM enigma_events WHERE id = ?
                UNION ALL
                SELECT id, eventCategory, 'Carteblanche' as symposium FROM carte_blanche_events WHERE id = ?
            ) e ON (
                ((p.name LIKE '%non-tech%' OR p.name LIKE '%non tech%' OR p.name LIKE '%nontech%') AND e.eventCategory = 'Non-Technical Events') OR
                (p.name LIKE '%tech%' AND NOT (p.name LIKE '%non-tech%' OR p.name LIKE '%non tech%' OR p.name LIKE '%nontech%') AND e.eventCategory = 'Technical Events')
            )
            WHERE vr.verified = true
         ) vr_all ON u.id = vr_all.userId
         LEFT JOIN registrations r_event ON u.email = r_event.userEmail AND r_event.eventId = ? AND r_event.symposium = ?
         LEFT JOIN registrations r_pass ON u.email = r_pass.userEmail AND r_pass.passId IS NOT NULL AND r_pass.symposium = ?
         WHERE (r_event.id IS NOT NULL OR r_pass.id IS NOT NULL)
         GROUP BY u.id, u.fullName, u.email, u.mobile, u.department, u.yearOfPassing, u.college`,
        [eventId, eventId, eventId, eventId, eventId, symposium, symposium]
      );
      res.json(registrations);
    } catch (error) {
      console.error('Error fetching registrations:', error);
      res.status(500).json({ message: 'Failed to fetch registrations.' });
    }
  });

  router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const {
      symposiumName,
      eventName,
      eventCategory,
      eventDescription,
      numberOfRounds,
      teamOrIndividual,
      location,
      registrationFees,
      coordinatorName,
      coordinatorContactNo,
      coordinatorMail,
      lastDateForRegistration,
      isOpenForNonMIT,
      rounds,
    } = req.body;

    if (!symposiumName || !eventName || !eventCategory || !eventDescription ||
      numberOfRounds === undefined || !teamOrIndividual || !location ||
      registrationFees === undefined || !coordinatorName || !coordinatorContactNo ||
      !coordinatorMail || !lastDateForRegistration || !rounds) {
      return res.status(400).json({ message: 'Missing required event fields.' });
    }

    try {
      let eventTable;
      let roundsTable;
      if (symposiumName === 'Enigma') {
        eventTable = 'enigma_events';
        roundsTable = 'enigma_rounds';
      } else if (symposiumName === 'Carteblanche') {
        eventTable = 'carte_blanche_events';
        roundsTable = 'carte_blanche_rounds';
      } else {
        return res.status(400).json({ message: 'Invalid symposium name.' });
      }

      await db.execute(
        `UPDATE ${eventTable} SET
          eventName = ?, eventCategory = ?, eventDescription = ?, numberOfRounds = ?, teamOrIndividual = ?,
          location = ?, registrationFees = ?, coordinatorName = ?, coordinatorContactNo = ?, coordinatorMail = ?,
          lastDateForRegistration = ?, open_to_non_mit = ?
        WHERE id = ?`,
        [
          eventName, eventCategory, eventDescription, numberOfRounds, teamOrIndividual,
          location, registrationFees, coordinatorName, coordinatorContactNo, coordinatorMail,
          lastDateForRegistration, isOpenForNonMIT ? 1 : 0, id,
        ]
      );


      // Delete existing rounds and insert new ones
      await db.execute(`DELETE FROM ${roundsTable} WHERE eventId = ?`, [id]);
      for (const round of rounds) {
        await db.execute(
          `INSERT INTO ${roundsTable} (eventId, roundNumber, roundDetails, roundDateTime) VALUES (?, ?, ?, ?)`,
          [id, round.roundNumber, round.roundDetails, round.roundDateTime]
        );
      }

      res.json({ message: `Event ${id} has been updated.` });
    } catch (error) {
      console.error('Error updating event:', error);
      res.status(500).json({ message: 'Failed to update event.', error: error.message });
    }
  });

  // Route to upload event poster
  router.post('/:id/poster', uploadEventPoster.single('poster'), async (req, res) => {
    const { id } = req.params;
    const { symposiumName } = req.body; // Get symposiumName from body

    if (!symposiumName) {
      return res.status(400).json({ message: 'Symposium name is required.' });
    }

    let eventTable;
    if (symposiumName === 'Enigma') {
      eventTable = 'enigma_events';
    } else if (symposiumName === 'Carteblanche') {
      eventTable = 'carte_blanche_events';
    } else {
      return res.status(400).json({ message: 'Invalid symposium name.' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    const posterImage = req.file.buffer;

    try {
      await db.execute(
        `UPDATE ${eventTable} SET posterImage = ? WHERE id = ?`,
        [posterImage, id]
      );
      res.status(200).json({ message: 'Poster uploaded successfully.' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to upload poster.' });
    }
  });

  // Route to delete event poster
  router.delete('/:id/poster', async (req, res) => {
    const { id } = req.params;
    const { symposiumName } = req.body; // Get symposiumName from body

    if (!symposiumName) {
      return res.status(400).json({ message: 'Symposium name is required.' });
    }

    let eventTable;
    if (symposiumName === 'Enigma') {
      eventTable = 'enigma_events';
    } else if (symposiumName === 'Carteblanche') {
      eventTable = 'carte_blanche_events';
    } else {
      return res.status(400).json({ message: 'Invalid symposium name.' });
    }

    try {
      await db.execute(`UPDATE ${eventTable} SET posterImage = NULL WHERE id = ?`, [id]);
      res.status(200).json({ message: 'Poster removed successfully.' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to remove poster.' });
    }
  });

  // Assign account to an event
  router.post('/:eventId/accounts', async (req, res) => {
    const { eventId } = req.params;
    const { accountId } = req.body;

    if (!accountId) {
      return res.status(400).json({ message: 'Account ID is required.' });
    }

    try {
      // Check if event exists (either in enigma_events or carte_blanche_events)
      const [enigmaEvent] = await db.execute('SELECT id FROM enigma_events WHERE id = ?', [eventId]);
      const [carteBlancheEvent] = await db.execute('SELECT id FROM carte_blanche_events WHERE id = ?', [eventId]);

      if (enigmaEvent.length === 0 && carteBlancheEvent.length === 0) {
        return res.status(404).json({ message: 'Event not found.' });
      }

      // Check if account exists
      const [account] = await db.execute('SELECT id FROM accounts WHERE id = ?', [accountId]);
      if (account.length === 0) {
        return res.status(404).json({ message: 'Account not found.' });
      }

      // Check if already assigned
      const [existingAssignment] = await db.execute(
        'SELECT * FROM event_accounts WHERE eventId = ? AND accountId = ?',
        [eventId, accountId]
      );
      if (existingAssignment.length > 0) {
        return res.status(409).json({ message: 'Account already assigned to this event.' });
      }

      await db.execute(
        'INSERT INTO event_accounts (eventId, accountId) VALUES (?, ?)',
        [eventId, accountId]
      );
      res.status(201).json({ message: 'Account assigned to event successfully.' });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error.' });
    }
  });

  // Get assigned accounts for an event
  router.get('/:eventId/accounts', async (req, res) => {
    const { eventId } = req.params;
    try {
      const [rows] = await db.execute(
        `SELECT ea.accountId AS id, a.accountName, a.bankName, a.accountNumber, a.ifscCode
         FROM event_accounts ea
         JOIN accounts a ON ea.accountId = a.id
         WHERE ea.eventId = ?`,
        [eventId]
      );
      res.status(200).json(rows);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error.' });
    }
  });

  // Remove account assignment from an event
  router.delete('/:eventId/accounts/:accountId', async (req, res) => {
    const { eventId, accountId } = req.params;
    try {
      const [result] = await db.execute(
        'DELETE FROM event_accounts WHERE eventId = ? AND accountId = ?',
        [eventId, accountId]
      );
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Assignment not found.' });
      }
      res.status(200).json({ message: 'Account assignment removed successfully.' });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error.' });
    }
  });

  router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    const { symposiumName } = req.body; // Get symposiumName from body

    if (!symposiumName) {
      return res.status(400).json({ message: 'Symposium name is required.' });
    }

    let eventTable;
    let roundsTable;
    if (symposiumName === 'Enigma') {
      eventTable = 'enigma_events';
      roundsTable = 'enigma_rounds';
    } else if (symposiumName === 'Carteblanche') {
      eventTable = 'carte_blanche_events';
      roundsTable = 'carte_blanche_rounds';
    } else {
      return res.status(400).json({ message: 'Invalid symposium name.' });
    }

    try {
      // Delete associated rounds first
      await db.execute(`DELETE FROM ${roundsTable} WHERE eventId = ?`, [id]);

      // Then delete the event
      await db.execute(`DELETE FROM ${eventTable} WHERE id = ?`, [id]);
      res.json({ message: 'Event deleted successfully.' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete event.' });
    }
  });

  router.get('/:eventId/registrations/search', async (req, res) => {
    const { eventId } = req.params;
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ message: 'Email query parameter is required.' });
    }

    try {
      const [registrations] = await db.execute(
        `SELECT r.*, u.id as userId, u.fullName, u.email, u.mobile, u.college, u.department, u.yearOfPassing 
         FROM registrations r 
         JOIN users u ON r.userEmail = u.email 
         WHERE r.eventId = ? AND u.email = ?`,
        [eventId, email]
      );

      if (registrations.length === 0) {
        return res.status(404).json({ message: 'User not found or not registered for this event.' });
      }

      res.json(registrations[0]);
    } catch (error) {
      res.status(500).json({ message: 'Failed to search for registration.' });
    }
  });

  router.post('/:eventId/rounds/:roundNumber/eligible', async (req, res) => {
    const { eventId, roundNumber } = req.params;
    const { userId, status } = req.body;
    const { symposium } = req.query;

    if (!symposium) {
      return res.status(400).json({ message: 'Symposium query parameter is required.' });
    }

    if (!userId || status === undefined) {
      return res.status(400).json({ message: 'userId and status are required.' });
    }

    if (![0, 1].includes(status)) {
      return res.status(400).json({ message: 'Status must be 0 or 1.' });
    }

    const dbStatus = Number(status) === 1 ? 1 : -1;

    const roundColumn = `round${roundNumber}`;
    if (!['round1', 'round2', 'round3'].includes(roundColumn)) {
      return res.status(400).json({ message: 'Invalid round number.' });
    }

    try {
      const [[user]] = await db.execute('SELECT fullName, email, mobile FROM users WHERE id = ?', [userId]);
      if (!user) {
        return res.status(404).json({ message: 'User not found.' });
      }
      const userEmail = user.email;

      const [result] = await db.execute(
        `UPDATE registrations SET ${roundColumn} = ? WHERE userEmail = ? AND eventId = ? AND symposium = ?`,
        [dbStatus, userEmail, eventId, symposium]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Registration not found for this user and event.' });
      }

      res.status(200).json({ message: `Round ${roundNumber} status updated successfully.` });
    } catch (error) {
      console.error('Error updating round status:', error);
      res.status(500).json({ message: 'Failed to update round status.' });
    }
  });

  router.post('/:eventId/rounds/:roundNumber/notify', async (req, res) => {
    const { eventId, roundNumber } = req.params;
    const { eligibleMessage, ineligibleMessage } = req.body;
    const { symposium } = req.query;

    if (!symposium) {
      return res.status(400).json({ message: 'Symposium query parameter is required.' });
    }

    try {
      const [registrations] = await db.execute(
        `SELECT r.*, u.email 
         FROM registrations r 
         JOIN users u ON r.userEmail = u.email 
         WHERE r.eventId = ? AND r.symposium = ?`,
        [eventId, symposium]
      );

      if (registrations.length === 0) {
        return res.status(404).json({ message: 'No registrations found for this event.' });
      }

      const symposiumName = registrations[0].symposium;
      let eventTable;
      if (symposiumName === 'Enigma') {
        eventTable = 'enigma_events';
      } else if (symposiumName === 'Carteblanche') {
        eventTable = 'carte_blanche_events';
      } else {
        return res.status(400).json({ message: 'Invalid symposium name found in registration.' });
      }

      const [[event]] = await db.execute(`SELECT eventName FROM ${eventTable} WHERE id = ?`, [eventId]);
      if (!event) {
        return res.status(404).json({ message: 'Event not found.' });
      }

      const roundColumn = `round${roundNumber}`;
      const eligibleUsers = registrations.filter(r => r[roundColumn] === 1);
      const ineligibleUsers = registrations.filter(r => r[roundColumn] === 0);

      const emailSubject = `Update for ${event.eventName} - Round ${roundNumber}`;

      if (eligibleUsers.length > 0) {
        const eligibleEmails = eligibleUsers.map(u => u.email);
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: eligibleEmails.join(', '),
          subject: emailSubject,
          text: eligibleMessage, // fallback for email clients not supporting HTML
          html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
        ${eligibleMessage}
        <br/>
        <p style="margin-top: 20px;">Regards,<br/><strong>CSMIT Team</strong></p>
      </div>
    `
        });
      }

      if (ineligibleUsers.length > 0) {
        const ineligibleEmails = ineligibleUsers.map(u => u.email);
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: ineligibleEmails.join(', '),
          subject: emailSubject,
          text: ineligibleMessage,
          html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
              ${ineligibleMessage}
              <br/>
              <p style="margin-top: 20px;">Regards,<br/><strong>CSMIT Team</strong></p>
            </div>
          `
        });
      }
      res.status(200).json({ message: 'Notifications sent successfully.' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to send notifications.' });
    }
  });

  return router;
};