const mysql = require('mysql2/promise');

async function searchEnigma() {
    const db = await mysql.createConnection({
        host: 'localhost',
        user: 'backend_user',
        password: 'Backend@123!',
        database: 'csmit_db'
    });

    try {
        const [tables] = await db.execute('SHOW TABLES');
        for (const tableRow of tables) {
            const tableName = Object.values(tableRow)[0];
            const [columns] = await db.execute(`SHOW COLUMNS FROM ${tableName}`);

            for (const column of columns) {
                if (column.Type.includes('varchar') || column.Type.includes('text')) {
                    const [rows] = await db.execute(`SELECT * FROM ${tableName} WHERE ${column.Field} LIKE '%Enigma%'`);
                    if (rows.length > 0) {
                        console.log(`Found Enigma in table ${tableName}, column ${column.Field}:`, rows.length, 'rows');
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await db.end();
    }
}

searchEnigma();
