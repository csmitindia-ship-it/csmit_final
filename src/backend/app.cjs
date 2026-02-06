
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const nodemailer = require('nodemailer');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();

/* -------------------- Middleware -------------------- */
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cors({
  origin: ['http://localhost:5173', 'https://csmit.mitindia.edu'],
  methods: ['GET', 'POST', 'DELETE', 'UPDATE', 'PUT', 'PATCH']
}));

/* -------------------- Test Route -------------------- */
app.get('/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

/* -------------------- Upload Directories -------------------- */
const uploadBaseDir = path.join(__dirname, 'uploads');
const pdfDir = path.join(uploadBaseDir, 'pdfs');
const eventPosterDir = path.join(uploadBaseDir, 'event_posters');

[pdfDir, eventPosterDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

/* -------------------- Multer -------------------- */
const uploadDocument = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 } });
const uploadEventPoster = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
const uploadTransactionScreenshot = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

app.use('/uploads', express.static(uploadBaseDir));

/* -------------------- Database -------------------- */
const db = mysql.createPool({
  host: 'localhost',
  user: 'backend_user',
  password: 'Backend@123!',
  database: 'csmit_db',
  waitForConnections: true,
  connectionLimit: 10
});

async function createTablesIfNotExists() {
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        fullName VARCHAR(255),
        email VARCHAR(255) UNIQUE,
        password VARCHAR(255),
        dob DATE,
        mobile VARCHAR(20),
        college VARCHAR(255),
        department VARCHAR(255),
        yearOfPassing INT,
        state VARCHAR(255),
        district VARCHAR(255),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Helper function to check and add column if missing
    async function addColumnIfNotExists(tableName, columnName, columnDef) {
      const [columns] = await db.execute(`
        SELECT * FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?
      `, [tableName, columnName]);

      if (columns.length === 0) {

        await db.execute(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDef}`);
      }
    }

    // Ensure users table has all new columns (Migrate existing data)
    await addColumnIfNotExists('users', 'dob', 'DATE');
    await addColumnIfNotExists('users', 'mobile', 'VARCHAR(20)');
    await addColumnIfNotExists('users', 'college', 'VARCHAR(255)');
    await addColumnIfNotExists('users', 'department', 'VARCHAR(255)');
    await addColumnIfNotExists('users', 'yearOfPassing', 'INT');
    await addColumnIfNotExists('users', 'state', 'VARCHAR(255)');
    await addColumnIfNotExists('users', 'district', 'VARCHAR(255)');

    await db.execute(`
      CREATE TABLE IF NOT EXISTS experiences (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255),
        type ENUM('Placement','Intern','Off-Campus Placement','Off-Campus Intern'),
        year_of_passing INT,
        company VARCHAR(255),
        pdf_file LONGBLOB,
        status ENUM('pending','approved','rejected') DEFAULT 'pending',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS passes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        cost INT NOT NULL,
        pass_limit INT NOT NULL,
        description TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);


    // Check if accountId column exists and add it if not
    const [columns] = await db.execute(`
      SELECT * FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'passes' AND COLUMN_NAME = 'accountId'
    `);

    if (columns.length === 0) {
      await db.execute(`
        ALTER TABLE passes
        ADD COLUMN accountId INT,
        ADD FOREIGN KEY (accountId) REFERENCES accounts(id) ON DELETE SET NULL;
      `);
    }

    // Check if discountPercentage column exists and add it if not
    const [discountCol] = await db.execute(`
      SELECT * FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'passes' AND COLUMN_NAME = 'discountPercentage'
    `);

    if (discountCol.length === 0) {

      await db.execute(`
        ALTER TABLE passes
        ADD COLUMN discountPercentage INT DEFAULT 0,
        ADD COLUMN discountReason VARCHAR(255) NULL;
      `);
    }

    await db.execute(`
      CREATE TABLE IF NOT EXISTS registration_timer (
        id INT AUTO_INCREMENT PRIMARY KEY,
        end_time DATETIME,
        is_active BOOLEAN DEFAULT TRUE,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS organizers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255),
        email VARCHAR(255) UNIQUE,
        mobile VARCHAR(20),
        password VARCHAR(255),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS symposium_status (
        id INT AUTO_INCREMENT PRIMARY KEY,
        symposiumName VARCHAR(255) UNIQUE,
        isOpen BOOLEAN DEFAULT FALSE,
        startDate DATE,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);

    const symposiums = ['Enigma', 'Carteblanche'];
    for (const s of symposiums) {
      await db.execute(
        'INSERT IGNORE INTO symposium_status (symposiumName) VALUES (?)',
        [s]
      );
    }

    await db.execute(`
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
        open_to_non_mit BOOLEAN DEFAULT TRUE,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.execute(`
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
        open_to_non_mit BOOLEAN DEFAULT TRUE,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Add discount columns to enigma_events if not exists
    await addColumnIfNotExists('enigma_events', 'discountPercentage', 'INT DEFAULT 0');
    await addColumnIfNotExists('enigma_events', 'discountReason', 'VARCHAR(255) NULL');
    await addColumnIfNotExists('enigma_events', 'mit_discount_percentage', 'INT DEFAULT 0');

    // Add discount columns to carte_blanche_events if not exists
    await addColumnIfNotExists('carte_blanche_events', 'discountPercentage', 'INT DEFAULT 0');
    await addColumnIfNotExists('carte_blanche_events', 'discountReason', 'VARCHAR(255) NULL');
    await addColumnIfNotExists('carte_blanche_events', 'mit_discount_percentage', 'INT DEFAULT 0');

    await db.execute(`
      CREATE TABLE IF NOT EXISTS enigma_rounds (
        id INT AUTO_INCREMENT PRIMARY KEY,
        eventId INT NOT NULL,
        roundNumber INT NOT NULL,
        roundDetails TEXT NOT NULL,
        roundDateTime DATETIME NOT NULL,
        FOREIGN KEY (eventId) REFERENCES enigma_events(id) ON DELETE CASCADE
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS carte_blanche_rounds (
        id INT AUTO_INCREMENT PRIMARY KEY,
        eventId INT NOT NULL,
        roundNumber INT NOT NULL,
        roundDetails TEXT NOT NULL,
        roundDateTime DATETIME NOT NULL,
        FOREIGN KEY (eventId) REFERENCES carte_blanche_events(id) ON DELETE CASCADE
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS accounts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        accountName VARCHAR(255) NOT NULL,
        bankName VARCHAR(255) NOT NULL,
        accountNumber VARCHAR(255) NOT NULL,
        ifscCode VARCHAR(255) NOT NULL,
        qrCodePdf BLOB,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS event_accounts (
        eventId INT NOT NULL,
        accountId INT NOT NULL,
        PRIMARY KEY (eventId, accountId),
        FOREIGN KEY (accountId) REFERENCES accounts(id) ON DELETE CASCADE
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS pass_accounts (
        passId INT NOT NULL,
        accountId INT NOT NULL,
        PRIMARY KEY (passId, accountId),
        FOREIGN KEY (passId) REFERENCES passes(id) ON DELETE CASCADE,
        FOREIGN KEY (accountId) REFERENCES accounts(id) ON DELETE CASCADE
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS registrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        symposium VARCHAR(255),
        eventId INT,
        passId INT,
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
    `);

    // Check and alter existing table for backward compatibility
    const [registrationsColumns] = await db.execute(`
      SELECT COLUMN_NAME, IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'registrations'
    `);

    const hasPassId = registrationsColumns.some(c => c.COLUMN_NAME === 'passId');
    if (!hasPassId) {
      await db.execute(`ALTER TABLE registrations ADD COLUMN passId INT NULL AFTER eventId`);
    }

    const eventIdCol = registrationsColumns.find(c => c.COLUMN_NAME === 'eventId');
    if (eventIdCol && eventIdCol.IS_NULLABLE === 'NO') {
      await db.execute(`ALTER TABLE registrations MODIFY COLUMN eventId INT NULL`);
    }

    const symposiumCol = registrationsColumns.find(c => c.COLUMN_NAME === 'symposium');
    if (symposiumCol && symposiumCol.IS_NULLABLE === 'NO') {
      await db.execute(`ALTER TABLE registrations MODIFY COLUMN symposium VARCHAR(255) NULL`);
    }

    await db.execute(`
      CREATE TABLE IF NOT EXISTS enigma_non_workshop_registrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userEmail VARCHAR(255) NOT NULL,
        eventId INT NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS cart (
        cartId INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL,
        eventId INT NOT NULL,
        symposiumName VARCHAR(255) NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS pass_cart (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL,
        passId INT NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(userId, passId),
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (passId) REFERENCES passes(id) ON DELETE CASCADE
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS verified_registrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL,
        eventId INT,
        passId INT,
        verified BOOLEAN NOT NULL,
        confirmation_email_sent BOOLEAN DEFAULT FALSE,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    // Check and alter existing verified_registrations table for backward compatibility
    const [verifiedRegistrationsColumns] = await db.execute(`
        SELECT COLUMN_NAME, IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'verified_registrations'
    `);

    const hasVerifiedPassId = verifiedRegistrationsColumns.some(c => c.COLUMN_NAME === 'passId');
    if (!hasVerifiedPassId) {
      await db.execute(`ALTER TABLE verified_registrations ADD COLUMN passId INT NULL AFTER eventId`);
    }

    const verifiedEventIdCol = verifiedRegistrationsColumns.find(c => c.COLUMN_NAME === 'eventId');
    if (verifiedEventIdCol && verifiedEventIdCol.IS_NULLABLE === 'NO') {
      await db.execute(`ALTER TABLE verified_registrations MODIFY COLUMN eventId INT NULL`);
    }

    const hasConfirmationEmailSent = verifiedRegistrationsColumns.some(c => c.COLUMN_NAME === 'confirmation_email_sent');
    if (!hasConfirmationEmailSent) {
      await db.execute(`ALTER TABLE verified_registrations ADD COLUMN confirmation_email_sent BOOLEAN DEFAULT FALSE`);
    }

    const hasTransactionId = verifiedRegistrationsColumns.some(c => c.COLUMN_NAME === 'transactionId');
    if (!hasTransactionId) {
      await db.execute(`ALTER TABLE verified_registrations ADD COLUMN transactionId VARCHAR(255) NULL`);
    }

    await db.execute(`
      CREATE TABLE IF NOT EXISTS \`accommodation\` (
        \`id\` INT AUTO_INCREMENT,
        \`gender\` ENUM('male', 'female') NOT NULL,
        \`total_rooms\` INT NOT NULL DEFAULT 0,
        \`available_rooms\` INT NOT NULL DEFAULT 0,
        \`fees\` INT NOT NULL DEFAULT 0,
        \`createdAt\` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`gender_UNIQUE\` (\`gender\`)
      );
    `);

    await db.execute(`
      INSERT IGNORE INTO accommodation (gender) VALUES ('male'), ('female');
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS \`accommodation_bookings\` (
        \`id\` INT AUTO_INCREMENT,
        \`userId\` INT NOT NULL,
        \`gender\` ENUM('male', 'female') NOT NULL,
        \`status\` ENUM('pending', 'confirmed', 'cancelled', 'rejected') NULL DEFAULT 'pending',
        \`transactionId\` VARCHAR(255) NULL,
        \`createdAt\` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        INDEX \`fk_bookings_user_idx\` (\`userId\` ASC),
        CONSTRAINT \`fk_bookings_user\`
          FOREIGN KEY (\`userId\`)
          REFERENCES \`users\` (\`id\`)
          ON DELETE CASCADE
          ON UPDATE NO ACTION
      );
    `);

    const [bookingColumns] = await db.execute(`
      SELECT * FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'accommodation_bookings' AND COLUMN_NAME = 'quantity'
    `);
    if (bookingColumns.length === 0) {
      await db.execute(`ALTER TABLE accommodation_bookings ADD COLUMN quantity INT NOT NULL DEFAULT 1`);
    }

    await db.execute(`
      CREATE TABLE IF NOT EXISTS \`accommodation_cart\` (
        \`id\` INT AUTO_INCREMENT,
        \`userId\` INT NOT NULL,
        \`gender\` ENUM('male', 'female') NOT NULL,
        \`createdAt\` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        UNIQUE INDEX \`userId_UNIQUE\` (\`userId\` ASC),
        CONSTRAINT \`fk_cart_user\`
          FOREIGN KEY (\`userId\`)
          REFERENCES \`users\` (\`id\`)
          ON DELETE CASCADE
          ON UPDATE NO ACTION
      );
    `);

    const [cartColumns] = await db.execute(`
      SELECT * FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'accommodation_cart' AND COLUMN_NAME = 'quantity'
    `);
    if (cartColumns.length === 0) {
      await db.execute(`ALTER TABLE accommodation_cart ADD COLUMN quantity INT NOT NULL DEFAULT 1`);
    }

    await db.execute(`
      CREATE TABLE IF NOT EXISTS offers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        content TEXT,
        active BOOLEAN DEFAULT TRUE,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

  } catch (err) {
    process.exit(1);
  }
}

async function connectToDatabase() {
  await createTablesIfNotExists();
}

/* -------------------- Mail -------------------- */
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: 'csmitindia@gmail.com',
    pass: 'kjue fgfj pwqy fqvk'
  },
  connectionTimeout: 10000,
  debug: true // Show debug logs for email
});

/* -------------------- Server Start -------------------- */
async function startServer() {
  await connectToDatabase();

  const apiRouter = express.Router();

  apiRouter.use('/auth', require('./auth.cjs')(db, transporter));
  apiRouter.use('/events', require('./events.cjs')(db, uploadEventPoster, transporter));
  apiRouter.use('/placements', require('./placements.cjs')(db, uploadDocument));
  apiRouter.use('/accounts', require('./accounts.cjs')(db, uploadDocument));
  apiRouter.use('/registrations', require('./registrations.cjs')(db, uploadTransactionScreenshot));
  apiRouter.use('/cart', require('./cart.cjs')(db));
  apiRouter.use('/pass-cart', require('./pass_cart.cjs')(db));
  apiRouter.use('/verification', require('./verification.cjs')(db));
  apiRouter.use('/symposium', require('./symposium.cjs')(db));
  apiRouter.use('/organizers', require('./organizer.cjs')(db));
  apiRouter.use('/timer', require('./timer.cjs')(db));
  apiRouter.use('/passes', require('./passes.cjs')(db));
  apiRouter.use('/accommodation', require('./accommodation.cjs')(db));
  apiRouter.use('/email', require('./email.cjs')(db, transporter, uploadDocument));
  apiRouter.use('/offer', require('./offer.cjs')(db));

  app.use('/api', apiRouter);

  app.use((req, res) => res.status(404).json({ message: 'Not Found' }));
}

startServer();

module.exports = app;
