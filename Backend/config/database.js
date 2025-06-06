const { Pool } = require('pg');

// Database configuration
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000,    // Wait up to 5 seconds for a connection
    idleTimeoutMillis: 30000,         // Disconnect idle clients after 30 seconds
    max: 20,                          // Maximum number of clients in the pool
    min: 4,                           // Minimum number of clients in the pool
    allowExitOnIdle: false            // Don't exit the process when idle
});

// Function to test database connection
const testConnection = async () => {
    try {
        const client = await pool.connect();
        await client.query('SELECT NOW()');
        client.release();
        console.log('Database connection test successful');
        return true;
    } catch (err) {
        console.error('Database connection test failed:', err);
        return false;
    }
};

// Function to handle reconnection attempts
const handleReconnect = async () => {
    console.log('Attempting to reconnect to database...');
    const maxRetries = 5;
    let retries = 0;

    while (retries < maxRetries) {
        if (await testConnection()) {
            console.log('Successfully reconnected to database');
            return true;
        }
        retries++;
        console.log(`Reconnection attempt ${retries} failed, retrying in 5 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
    }
    console.error('Failed to reconnect to database after', maxRetries, 'attempts');
    return false;
};

// Pool Event Listeners
pool.on('error', async (err, client) => {
    console.error('Unexpected error on idle client:', err);
    // Optionally trigger reconnection attempts
    await handleReconnect();
});

pool.on('connect', () => {
    console.log('New database connection established');
});

pool.on('acquire', () => {
    console.log('Client acquired from pool');
});

pool.on('remove', () => {
    console.log('Client removed from pool');
});

// Initial connection test
testConnection().then(isConnected => {
    if (!isConnected) {
        handleReconnect();
    }
});

// Optional periodic connection check (adjust or remove in production to avoid unnecessary load)
// setInterval(async () => {
//     const isConnected = await testConnection();
//     if (!isConnected) {
//         await handleReconnect();
//     }
// }, 30000); // Checks every 30 seconds

// Graceful shutdown on SIGTERM
process.on('SIGTERM', async () => {
    console.log('SIGTERM received. Closing database pool...');
    try {
        await pool.end();
        console.log('Database pool closed successfully');
    } catch (err) {
        console.error('Error closing database pool:', err);
    }
    process.exit(0);
});

// Exporting the query and client retrieval methods
module.exports = {
    query: async (text, params) => {
        try {
            return await pool.query(text, params);
        } catch (err) {
            console.error('Query error:', err);
            throw err;
        }
    },
    getClient: async () => {
        try {
            return await pool.connect();
        } catch (err) {
            console.error('Error acquiring client:', err);
            throw err;
        }
    },
    pool,
    testConnection
};
