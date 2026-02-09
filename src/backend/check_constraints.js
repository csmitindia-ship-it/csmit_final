
const mysql = require('mysql2/promise');

async function checkConstraints() {
    const db = mysql.createPool({
        host: 'localhost',
        user: 'backend_user',
        password: 'Backend@123!',
        database: 'csmit_db',
        waitForConnections: true,
        connectionLimit: 1
    });

    try {
        console.log('--- Constraints ON registrations table ---');
        const [constraintsOn] = await db.execute(`
            SELECT 
              TABLE_NAME, COLUMN_NAME, CONSTRAINT_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
            FROM
              INFORMATION_SCHEMA.KEY_COLUMN_USAGE
            WHERE
              TABLE_SCHEMA = 'csmit_db' AND
              TABLE_NAME = 'registrations' AND
              REFERENCED_TABLE_NAME IS NOT NULL;
        `);
        console.table(constraintsOn);

        console.log('\n--- Tables REFERENCING registrations table ---');
        const [referencing] = await db.execute(`
            SELECT 
              TABLE_NAME, COLUMN_NAME, CONSTRAINT_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
            FROM
              INFORMATION_SCHEMA.KEY_COLUMN_USAGE
            WHERE
              REFERENCED_TABLE_SCHEMA = 'csmit_db' AND
              REFERENCED_TABLE_NAME = 'registrations';
        `);
        console.table(referencing);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await db.end();
    }
}

checkConstraints();
