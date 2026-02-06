const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkSchema() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
        });

        const [columns] = await connection.execute('DESCRIBE passes');
        console.log('Passes Table Columns:');
        console.table(columns);

        const [status] = await connection.execute('SELECT * FROM symposium_status');
        console.table(status);

        await connection.end();
    } catch (error) {
        console.error(error);
    }
}

checkSchema();
