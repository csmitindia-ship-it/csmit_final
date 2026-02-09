
const mysql = require('mysql2/promise');

async function checkSchema() {
    const db = mysql.createPool({
        host: 'localhost',
        user: 'backend_user',
        password: 'Backend@123!',
        database: 'csmit_db',
        waitForConnections: true,
        connectionLimit: 1
    });

    try {
        const [registrationsRows] = await db.execute('SHOW CREATE TABLE registrations');
        console.log('--- registrations ---');
        console.log(registrationsRows[0]['Create Table']);

        const [verifiedRows] = await db.execute('SHOW CREATE TABLE verified_registrations');
        console.log('\n--- verified_registrations ---');
        console.log(verifiedRows[0]['Create Table']);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await db.end();
    }
}

checkSchema();
