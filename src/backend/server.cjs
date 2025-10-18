console.log(__filename);

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mysql = require('mysql2/promise');
const nodemailer = require('nodemailer');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(cors({
  origin: ['http://localhost:5173'],
  methods: ['GET', 'POST', 'DELETE', 'UPDATE', 'PUT', 'PATCH']
}));

app.use((req, res, next) => {
  if (req.url.startsWith('/api')) {
    req.url = req.url.replace('/api', '');
  }
  next();
});

// --- File Upload Setup ---


const eventPosterDir = path.join(__dirname, 'uploads/event_posters');
if (!fs.existsSync(eventPosterDir)){
    fs.mkdirSync(eventPosterDir, { recursive: true });
}

const pdfStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, pdfDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const eventPosterStorage = multer.memoryStorage();

const uploadPdf = multer({ storage: multer.memoryStorage(), limits: { fileSize: 1 * 1024 * 1024 } });
const uploadEventPoster = multer({ storage: eventPosterStorage, limits: { fileSize: 5 * 1024 * 1024 } });
const uploadTransactionScreenshot = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- Database Connection ---
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'csmit_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const db = mysql.createPool(dbConfig);

async function connectToDatabase() {
  try {
    console.log("Attempting to connect to the database and create tables...");
    await createTablesIfNotExists();
    console.log("Database connection and table creation process completed successfully.");
  } catch (error) {
    console.error('Error connecting to MySQL database or creating tables:', error);
    process.exit(1); // Exit the process if connection fails
  }
}

async function createTablesIfNotExists() {
  const createUserTableQuery = `
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      fullName VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      dob DATE,
      mobile VARCHAR(20),
      college VARCHAR(255),
      department VARCHAR(255),
      yearOfPassing INT,
      state VARCHAR(255),
      district VARCHAR(255),
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  const createExperienceTableQuery = `
    CREATE TABLE IF NOT EXISTS experiences (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      type ENUM('Placement', 'Intern') NOT NULL,
      year_of_passing INT NOT NULL,
      company VARCHAR(255) NOT NULL,
      linkedin_url VARCHAR(255),
      pdf_file LONGBLOB NOT NULL,
      status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  const createEnigmaEventsTableQuery = `
    CREATE TABLE IF NOT EXISTS enigma_events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        eventName VARCHAR(255) NOT NULL,
        eventCategory VARCHAR(255) NOT NULL,
        eventDescription TEXT NOT NULL,
        numberOfRounds INT NOT NULL,
        teamOrIndividual ENUM('Team', 'Individual') NOT NULL,
        location VARCHAR(255) NOT NULL,
        registrationFees INT NOT NULL,
        coordinatorName VARCHAR(255) NOT NULL,
        coordinatorContactNo VARCHAR(20) NOT NULL,
        coordinatorMail VARCHAR(255) NOT NULL,
        lastDateForRegistration DATETIME NOT NULL,
        posterImage LONGBLOB,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  const createCarteBlancheEventsTableQuery = `
    CREATE TABLE IF NOT EXISTS carte_blanche_events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        eventName VARCHAR(255) NOT NULL,
        eventCategory VARCHAR(255) NOT NULL,
        eventDescription TEXT NOT NULL,
        numberOfRounds INT NOT NULL,
        teamOrIndividual ENUM('Team', 'Individual') NOT NULL,
        location VARCHAR(255) NOT NULL,
        registrationFees INT NOT NULL,
        coordinatorName VARCHAR(255) NOT NULL,
        coordinatorContactNo VARCHAR(20) NOT NULL,
        coordinatorMail VARCHAR(255) NOT NULL,
        lastDateForRegistration DATETIME NOT NULL,
        posterImage LONGBLOB,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  const createEnigmaRoundsTableQuery = `
    CREATE TABLE IF NOT EXISTS enigma_rounds (
        id INT AUTO_INCREMENT PRIMARY KEY,
        eventId INT NOT NULL,
        roundNumber INT NOT NULL,
        roundDetails TEXT NOT NULL,
        roundDateTime DATETIME NOT NULL,
        FOREIGN KEY (eventId) REFERENCES enigma_events(id) ON DELETE CASCADE
    );
  `;
  const createCarteBlancheRoundsTableQuery = `
    CREATE TABLE IF NOT EXISTS carte_blanche_rounds (
        id INT AUTO_INCREMENT PRIMARY KEY,
        eventId INT NOT NULL,
        roundNumber INT NOT NULL,
        roundDetails TEXT NOT NULL,
        roundDateTime DATETIME NOT NULL,
        FOREIGN KEY (eventId) REFERENCES carte_blanche_events(id) ON DELETE CASCADE
    );
  `;

  const createAccountsTableQuery = `
    CREATE TABLE IF NOT EXISTS accounts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      accountName VARCHAR(255) NOT NULL,
      bankName VARCHAR(255) NOT NULL,
      accountNumber VARCHAR(255) NOT NULL,
      ifscCode VARCHAR(255) NOT NULL,
      qrCodePdf BLOB,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const createEventAccountsTableQuery = `
    CREATE TABLE IF NOT EXISTS event_accounts (
      eventId INT NOT NULL,
      accountId INT NOT NULL,
      PRIMARY KEY (eventId, accountId),
      FOREIGN KEY (accountId) REFERENCES accounts(id) ON DELETE CASCADE
    );
  `;

  const createRegistrationsTableQuery = `
    CREATE TABLE IF NOT EXISTS registrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      symposium VARCHAR(255) NOT NULL,
      eventId INT NOT NULL,
      userName VARCHAR(255) NOT NULL,
      userEmail VARCHAR(255) NOT NULL,
      mobileNumber VARCHAR(20),
      transactionId VARCHAR(255),
      transactionUsername VARCHAR(255),
      transactionTime VARCHAR(255),
      transactionDate VARCHAR(255),
      transactionAmount DECIMAL(10, 2),
      transactionScreenshot MEDIUMBLOB,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const createEnigmaNonWorkshopRegistrationsTableQuery = `
    CREATE TABLE IF NOT EXISTS enigma_non_workshop_registrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      userEmail VARCHAR(255) NOT NULL,
      eventId INT NOT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const createCartTableQuery = `
    CREATE TABLE IF NOT EXISTS cart (
      cartId INT AUTO_INCREMENT PRIMARY KEY,
      userId INT NOT NULL,
      eventId INT NOT NULL,
      symposiumName VARCHAR(255) NOT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );
  `;

  const createVerifiedRegistrationsTableQuery = `
    CREATE TABLE IF NOT EXISTS verified_registrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      userId INT NOT NULL,
      eventId INT NOT NULL,
      verified BOOLEAN NOT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );
  `;

  try {
    await db.execute(createUserTableQuery);
    await db.execute(createExperienceTableQuery);
    await db.execute('DROP TABLE IF EXISTS events;');
    await db.execute(createEnigmaEventsTableQuery);
    await db.execute(createCarteBlancheEventsTableQuery);
    await db.execute(createEnigmaRoundsTableQuery);
    await db.execute(createCarteBlancheRoundsTableQuery);
    await db.execute(createAccountsTableQuery);
    await db.execute(createEventAccountsTableQuery);
    
    await db.execute(createRegistrationsTableQuery);
    await db.execute(createEnigmaNonWorkshopRegistrationsTableQuery);
    await db.execute(createCartTableQuery);
    await db.execute(createVerifiedRegistrationsTableQuery);

    const createOrganizersTableQuery = `
      CREATE TABLE IF NOT EXISTS organizers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        mobile VARCHAR(20) NOT NULL,
        password VARCHAR(255) NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await db.execute(createOrganizersTableQuery);

    const createRoundWinnersTableQuery = `
      CREATE TABLE IF NOT EXISTS round_winners (
        id INT AUTO_INCREMENT PRIMARY KEY,
        eventId INT NOT NULL,
        roundNumber INT NOT NULL,
        userId INT NOT NULL,
        status VARCHAR(255) NOT NULL DEFAULT 'eligible',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      );
    `;
    await db.execute(createRoundWinnersTableQuery);

    const createSymposiumStatusTableQuery = `
      CREATE TABLE IF NOT EXISTS symposium_status (
        id INT AUTO_INCREMENT PRIMARY KEY,
        symposiumName VARCHAR(255) NOT NULL UNIQUE,
        isOpen BOOLEAN DEFAULT FALSE,
        startDate DATE,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `;
    await db.execute(createSymposiumStatusTableQuery);

    // Check if startDate column exists and add it if it doesn't
    const [columns] = await db.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'csmit_db' 
      AND TABLE_NAME = 'symposium_status' 
      AND COLUMN_NAME = 'startDate'
    `);

    if (columns.length === 0) {
      await db.execute('ALTER TABLE symposium_status ADD COLUMN startDate DATE');
    }

    const symposiums = ['Enigma', 'Carteblanche'];

    for (const symposium of symposiums) {
      await db.execute('INSERT IGNORE INTO symposium_status (symposiumName) VALUES (?)', [symposium]);
    }

    const createRegistrationTimerTableQuery = `
      CREATE TABLE IF NOT EXISTS registration_timer (
        id INT AUTO_INCREMENT PRIMARY KEY,
        end_time DATETIME NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await db.execute(createRegistrationTimerTableQuery);

  } catch (error) {
    process.exit(1);
  }
}

// --- Nodemailer Transporter ---
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "csmitindia@gmail.com",
    pass: "kjue fgfj pwqy fqvk",
  },
});

async function startServer() {
  await connectToDatabase();

  // --- Routers ---
  const authRouter = require('./auth.cjs')(db, transporter);
  const eventsRouter = require('./events.cjs')(db, uploadEventPoster, transporter);
  const placementsRouter = require('./placements.cjs')(db, uploadPdf);
  const accountsRouter = require('./accounts.cjs')(db, uploadPdf);
  const registrationsRouter = require('./registrations.cjs')(db, uploadTransactionScreenshot);
  const cartRouter = require('./cart.cjs')(db);
  const verificationRouter = require('./verification.cjs')(db);
  const symposiumRouter = require('./symposium.cjs')(db);
  const organizerRouter = require('./organizer.cjs')(db);
  const timerRouter = require('./timer.cjs')(db);

  app.use('/auth', authRouter);
  app.use('/events', eventsRouter);
  app.use('/placements', placementsRouter);
  app.use('/admin/accounts', accountsRouter);
  app.use('/registrations', registrationsRouter);
  app.use('/cart', cartRouter);
  app.use('/verification', verificationRouter);
  app.use('/symposium', symposiumRouter);
  app.use('/organizers', organizerRouter);
  app.use('/timer', timerRouter);

  // --- Start Server ---
  app.use((req, res, next) => {
    res.status(404).json({ message: 'Not Found' });
  });

  const PORT = 5001;
  app.listen(PORT, () => {
    console.log(`Unified server is running on http://localhost:${PORT}`);
  });
}

startServer();
