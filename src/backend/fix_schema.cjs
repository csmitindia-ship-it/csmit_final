const mysql = require('mysql2/promise');

async function fixSchema() {
    const db = mysql.createPool({
        host: 'localhost',
        user: 'backend_user',
        password: 'Backend@123!',
        database: 'csmit_db',
        waitForConnections: true,
        connectionLimit: 1
    });

    try {
        console.log('Checking verified_registrations table...');
        const [columns] = await db.execute(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'csmit_db' AND TABLE_NAME = 'verified_registrations' AND COLUMN_NAME = 'confirmation_email_sent'
    `);

        if (columns.length === 0) {
            console.log('Adding missing column: confirmation_email_sent');
            await db.execute(`ALTER TABLE verified_registrations ADD COLUMN confirmation_email_sent BOOLEAN DEFAULT FALSE`);
            console.log('Column added successfully.');
        } else {
            console.log('Column already exists.');
        }
    } catch (err) {
        console.error('Error fixing schema:', err);
    } finally {
        await db.end();
    }
}

fixSchema();
