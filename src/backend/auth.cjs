const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

module.exports = function(db, transporter) {
  const otpStore = {};

  router.post("/send-otp", async (req, res) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    try {
      const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
      if (rows.length === 0) {
        return res.status(404).json({ message: "Email not found. Please sign up first." });
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      otpStore[email] = otp;
      const mailOptions = {
        from: "csmitindia@gmail.com",
        to: email,
        subject: "Your OTP for Password Reset",
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
              <h2 style="color: #2c3e50;">Your OTP Code</h2>
              <p><strong>Your OTP is:</strong> <span style="font-size: 18px; color: #e74c3c;">${otp}</span></p>
              <p>This OTP is valid for <strong>10 minutes</strong>.</p>
              <p>
                If you did not request this, please ignore this email
                and your password will remain unchanged.
              </p>
              <br/>
              <p style="margin-top: 20px;">Regards,</p>
              <p><strong>CSMIT Team</strong></p>
            </div>
          `,
      };
      await transporter.sendMail(mailOptions);
      res.json({ message: "OTP sent successfully to your email" });
    } catch (error) {
      res.status(500).json({ message: "Failed to send OTP email" });
    }
  });

  router.post("/verify-otp", (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }
    if (otpStore[email] === otp) {
      delete otpStore[email];
      return res.json({ message: "OTP verified successfully" });
    }
    return res.status(400).json({ message: "Invalid OTP" });
  });

  router.post("/reset-password", async (req, res) => {
    const { email, newPassword, confirmPassword } = req.body;
    if (!email || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "Email and passwords are required" });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    try {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await db.execute('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, email]);
      res.json({ message: "Password reset successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    try {
      // Check in organizers table first
      const [organizerRows] = await db.execute('SELECT * FROM organizers WHERE email = ?', [email]);

      if (organizerRows.length > 0) {
        const organizer = organizerRows[0];
        const isPasswordValid = await bcrypt.compare(password, organizer.password);

        if (isPasswordValid) {
          const { password: _, ...organizerData } = organizer;
          return res.json({ message: 'Login successful', user: { ...organizerData, role: 'organizer' } });
        }
      }

      // If not in organizers, check in users table
      const [userRows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);

      if (userRows.length === 0) {
        return res.status(404).json({ message: 'User not found.' });
      }

      const user = userRows[0];
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid credentials.' });
      }

      const { password: _, ...userData } = user;
      res.json({ message: 'Login successful', user: { ...userData, role: 'student' } });
    } catch (error) {
      res.status(500).json({ message: 'Failed to login.' });
    }
  });

  router.post('/signup', async (req, res) => {
    const { 
      fullName, 
      email, 
      password, 
      dob, 
      mobile, 
      college, 
      department, 
      yearOfPassing, 
      state, 
      district 
    } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: 'Full name, email, and password are required.' });
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const [result] = await db.execute(
        'INSERT INTO users (fullName, email, password, dob, mobile, college, department, yearOfPassing, state, district) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [fullName, email, hashedPassword, dob, mobile, college, department, yearOfPassing, state, district]
      );
      res.status(201).json({ message: 'User created successfully', userId: result.insertId });
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ message: 'Email already exists.' });
      }
      res.status(500).json({ message: 'Failed to create user.' });
    }
  });

  return router;
};