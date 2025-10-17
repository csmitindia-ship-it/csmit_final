const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

module.exports = function(db, uploadEventPoster, transporter) {
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
      coordinatorName,
      coordinatorContactNo,
      coordinatorMail,
      lastDateForRegistration,
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

      const [eventResult] = await db.execute(
        `INSERT INTO ${eventTable} (
          eventName, eventCategory, eventDescription, numberOfRounds, teamOrIndividual,
          location, registrationFees, coordinatorName, coordinatorContactNo, coordinatorMail,
          lastDateForRegistration
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          eventName, eventCategory, eventDescription, numberOfRounds, teamOrIndividual,
          location, registrationFees, coordinatorName, coordinatorContactNo, coordinatorMail,
          lastDateForRegistration,
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

  router.get('/', async (req, res) => {
    try {
      const [enigmaEvents] = await db.execute('SELECT id, eventName, eventCategory, eventDescription, numberOfRounds, teamOrIndividual, location, registrationFees, coordinatorName, coordinatorContactNo, coordinatorMail, lastDateForRegistration, posterImage, createdAt FROM enigma_events');
      const [carteBlancheEvents] = await db.execute('SELECT id, eventName, eventCategory, eventDescription, numberOfRounds, teamOrIndividual, location, registrationFees, coordinatorName, coordinatorContactNo, coordinatorMail, lastDateForRegistration, posterImage, createdAt FROM carte_blanche_events');

      const allEvents = [];

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
      console.error('Error fetching events:', error);
      res.status(500).json({ message: 'Failed to fetch events.' });
    }
  });

  router.get('/:id', async (req, res) => {
    const { id } = req.params;
    const { symposium } = req.query;

    if (!symposium) {
      return res.status(400).json({ message: 'Symposium name is required.' });
    }

    let eventTable;
    if (symposium === 'Enigma') {
      eventTable = 'enigma_events';
    } else if (symposium === 'Carteblanche') {
      eventTable = 'carte_blanche_events';
    } else {
      return res.status(400).json({ message: 'Invalid symposium name.' });
    }

    try {
      const [rows] = await db.execute(`SELECT * FROM ${eventTable} WHERE id = ?`, [id]);
      if (rows.length === 0) {
        return res.status(404).json({ message: 'Event not found.' });
      }
      const event = rows[0];
      if (event.posterImage) {
        event.posterImage = event.posterImage.toString('base64');
      }
      res.json(event);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch event.' });
    }
  });

  router.get('/:eventId/registrations', async (req, res) => {
    const { eventId } = req.params;
    try {
      const [registrations] = await db.execute(
        `SELECT r.*, u.id as userId, u.fullName as name, u.email, u.mobile, u.department, u.yearOfPassing, u.college \n         FROM registrations r \n         JOIN users u ON r.userEmail = u.email \n         JOIN verified_registrations vr ON u.id = vr.userId AND r.eventId = vr.eventId\n         WHERE r.eventId = ? AND vr.verified = true`, 
        [eventId]
      );
      res.json(registrations);
    } catch (error) {
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
          lastDateForRegistration = ?
        WHERE id = ?`,
        [
          eventName, eventCategory, eventDescription, numberOfRounds, teamOrIndividual,
          location, registrationFees, coordinatorName, coordinatorContactNo, coordinatorMail,
          lastDateForRegistration, id,
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

    if (!userId || status === undefined) {
      return res.status(400).json({ message: 'userId and status are required.' });
    }

    if (![0, 1].includes(status)) {
      return res.status(400).json({ message: 'Status must be 0 or 1.' });
    }

    const roundColumn = `round${roundNumber}`;
    if (!['round1', 'round2', 'round3'].includes(roundColumn)) {
      return res.status(400).json({ message: 'Invalid round number.' });
    }

    try {
      const [[user]] = await db.execute('SELECT email FROM users WHERE id = ?', [userId]);
      if (!user) {
        return res.status(404).json({ message: 'User not found.' });
      }
      const userEmail = user.email;

      const [result] = await db.execute(
        `UPDATE registrations SET ${roundColumn} = ? WHERE userEmail = ? AND eventId = ?`,
        [status, userEmail, eventId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Registration not found for this user and event.' });
      }

      res.status(200).json({ message: `Round ${roundNumber} status updated successfully.` });
    } catch (error) {
      res.status(500).json({ message: 'Failed to update round status.' });
    }
  });

  router.post('/:eventId/rounds/:roundNumber/notify', async (req, res) => {
    const { eventId, roundNumber } = req.params;
    const { eligibleMessage, ineligibleMessage } = req.body;

    try {
      const [registrations] = await db.execute(
        `SELECT r.*, u.email 
         FROM registrations r 
         JOIN users u ON r.userEmail = u.email 
         WHERE r.eventId = ?`,
        [eventId]
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
        <h2 style="color: #2c3e50;">Congratulations!</h2>
        <p>You are <strong>eligible</strong> for <b>${event.eventName}</b> - Round ${roundNumber}.</p>
        <p style="color: green; font-size: 16px;">${eligibleMessage}</p>
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
              <h2 style="color: #e74c3c;">Update</h2>
              <p>Unfortunately, you are <strong>not eligible</strong> for <b>${event.eventName}</b> - Round ${roundNumber}.</p>
              <p style="color: #e74c3c; font-size: 16px;">${ineligibleMessage}</p>
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