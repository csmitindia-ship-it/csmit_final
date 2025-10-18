const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

module.exports = function(db, transporter) {
  // IMPORTANT: This is in-memory storage.
  // If your server restarts, all OTPs will be lost.
  // Consider using Redis or a database table for a production environment.
  const otpStore = {};

  router.post("/send-otp", async (req, res) => {
    const { email } = req.body;
    console.log(`POST /send-otp - Attempting to send OTP to: ${email}`);

    if (!email) {
      console.warn('Validation failed: Email is required.');
      return res.status(400).json({ message: "Email is required" });
    }

    try {
      // Check if user exists
      const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
      if (rows.length === 0) {
        console.warn(`OTP request for non-existent email: ${email}`);
        return res.status(404).json({ message: "Email not found. Please sign up first." });
      }

      // Generate and store OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      otpStore[email] = otp;
      console.log(`Generated OTP ${otp} for ${email} (stored in-memory)`);

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

      // Send the email
      await transporter.sendMail(mailOptions);
      console.log(`OTP email sent successfully to: ${email}`);
      res.json({ message: "OTP sent successfully to your email" });
    } catch (error) {
      console.error(`Failed to send OTP email to ${email}:`, error);
      res.status(500).json({ message: "Failed to send OTP email" });
    }
  });

  router.post("/verify-otp", (req, res) => {
    const { email, otp } = req.body;
    console.log(`POST /verify-otp - Attempting to verify OTP for: ${email}`);
    
    if (!email || !otp) {
      console.warn('Validation failed: Email and OTP are required.');
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const storedOtp = otpStore[email];
    console.log(`Verifying. Received: ${otp}, Stored: ${storedOtp}`);

    if (storedOtp === otp) {
      // OTP is correct, delete it from store
      delete otpStore[email];
      console.log(`OTP verified successfully for: ${email}. OTP removed from store.`);
      return res.json({ message: "OTP verified successfully" });
    }
    
    console.warn(`Invalid OTP for ${email}. Received: ${otp}, Expected: ${storedOtp}`);
    return res.status(400).json({ message: "Invalid OTP" });
  });

  router.post("/reset-password", async (req, res) => {
    const { email, newPassword, confirmPassword } = req.body;
    console.log(`POST /reset-password - Attempting password reset for: ${email}`);

    if (!email || !newPassword || !confirmPassword) {
      console.warn('Validation failed: Email and passwords are required.');
      return res.status(400).json({ message: "Email and passwords are required" });
    }
    if (newPassword !== confirmPassword) {
      console.warn(`Passwords do not match for: ${email}`);
      return res.status(400).json({ message: "Passwords do not match" });
    }

    try {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await db.execute('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, email]);
      
      console.log(`Password reset successfully for: ${email}`);
      res.json({ message: "Password reset successfully" });
    } catch (error) {
      console.error(`Failed to reset password for ${email}:`, error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    // DO NOT log the password, only the email
    console.log(`POST /login - Attempting login for: ${email}`);

    if (!email || !password) {
      console.warn('Validation failed: Email and password are required.');
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    try {
      // Check in organizers table first
      console.log(`Checking 'organizers' table for: ${email}`);
      const [organizerRows] = await db.execute('SELECT * FROM organizers WHERE email = ?', [email]);

      if (organizerRows.length > 0) {
        const organizer = organizerRows[0];
        const isPasswordValid = await bcrypt.compare(password, organizer.password);

        if (isPasswordValid) {
          const { password: _, ...organizerData } = organizer;
          console.log(`Login successful as 'organizer' for: ${email}`);
          return res.json({ message: 'Login successful', user: { ...organizerData, role: 'organizer' } });
        }
      }

      // If not in organizers, check in users table
      console.log(`Not in organizers. Checking 'users' table for: ${email}`);
      const [userRows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);

      if (userRows.length === 0) {
        console.warn(`Login failed: User not found in any table: ${email}`);
        return res.status(404).json({ message: 'User not found.' });
      }

      const user = userRows[0];
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        console.warn(`Login failed: Invalid password for user: ${email}`);
        return res.status(401).json({ message: 'Invalid credentials.' });
      }

      const { password: _, ...userData } = user;
      console.log(`Login successful as 'student' for: ${email}`);
      res.json({ message: 'Login successful', user: { ...userData, role: 'student' } });
    } catch (error) {
      console.error(`Login process failed for ${email}:`, error);
      res.status(500).json({ message: 'Failed to login.' });
    }
  });

  router.post('/signup', async (req, res) => {
    // Destructure all fields
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

    // Log non-sensitive info
    console.log(`POST /signup - Attempting signup for: ${email}`);

    if (!fullName || !email || !password) {
      console.warn('Validation failed: Full name, email, and password are required.');
      return res.status(400).json({ message: 'Full name, email, and password are required.' });
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const [result] = await db.execute(
        'INSERT INTO users (fullName, email, password, dob, mobile, college, department, yearOfPassing, state, district) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [fullName, email, hashedPassword, dob, mobile, college, department, yearOfPassing, state, district]
      );
      
      console.log(`User created successfully. New userId: ${result.insertId} for email: ${email}`);
      res.status(201).json({ message: 'User created successfully', userId: result.insertId });
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        console.warn(`Signup failed: Email already exists: ${email}`);
        return res.status(409).json({ message: 'Email already exists.' });
      }
      // Log the full database error
      console.error(`Failed to create user for ${email}:`, error);
      res.status(500).json({ message: 'Failed to create user.' });
    }
  });

  return router;
};