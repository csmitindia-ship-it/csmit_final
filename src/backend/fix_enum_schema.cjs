const mysql = require('mysql2/promise');

async function fixEnumSchema() {
    const db = mysql.createPool({
        host: 'localhost',
        user: 'backend_user',
        password: 'Backend@123!',
        database: 'csmit_db',
        waitForConnections: true,
        connectionLimit: 1
    });

    try {
        console.log('Modifying accommodation_bookings table status column...');
        await db.execute(`
      ALTER TABLE accommodation_bookings 
      MODIFY COLUMN status ENUM('pending', 'confirmed', 'cancelled', 'rejected') NULL DEFAULT 'pending'
    `);
        console.log('Successfully updated status ENUM to include "rejected".');
    } catch (err) {
        console.error('Error fixing schema:', err);
    } finally {
        await db.end();
    }
}

fixEnumSchema();
