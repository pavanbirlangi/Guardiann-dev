const { Pool } = require('pg');

// Database configuration
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
    // set to production state when deploying to AWS
    ssl: {
        rejectUnauthorized: false
    },
    // Connection settings
    connectionTimeoutMillis: 0, // No timeout for initial connection
    idleTimeoutMillis: 0, // Keep idle connections alive
    max: 20, // Maximum number of clients in the pool
    min: 4, // Minimum number of clients in the pool
    allowExitOnIdle: false, // Don't close connections when idle
    keepAlive: true, // Enable keep-alive
    keepAliveInitialDelayMillis: 10000, // Start keep-alive after 10 seconds
    // Connection retry settings
    maxRetries: 5, // Maximum number of retries
    retryInterval: 5000, // Retry every 5 seconds
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

// Function to handle reconnection
const handleReconnect = async () => {
    console.log('Attempting to reconnect to database...');
    let retries = 0;
    const maxRetries = 5;

    while (retries < maxRetries) {
        try {
            const isConnected = await testConnection();
            if (isConnected) {
                console.log('Successfully reconnected to database');
                return true;
            }
        } catch (err) {
            console.error(`Reconnection attempt ${retries + 1} failed:`, err);
        }
        retries++;
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds between retries
    }
    console.error('Failed to reconnect to database after', maxRetries, 'attempts');
    return false;
};

// Add error handling for the pool
pool.on('error', async (err, client) => {
    console.error('Unexpected error on idle client', err);
    // Don't exit the process, try to reconnect instead
    await handleReconnect();
});

// Add connection monitoring
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

// Periodic connection check
setInterval(async () => {
    const isConnected = await testConnection();
    if (!isConnected) {
        await handleReconnect();
    }
}, 30000); // Check every 30 seconds

// Graceful shutdown
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

module.exports = {
    query: async (text, params) => {
        try {
            return await pool.query(text, params);
        } catch (err) {
            if (err.code === 'ETIMEDOUT' || err.code === 'ECONNREFUSED') {
                await handleReconnect();
                // Retry the query after reconnection
                return await pool.query(text, params);
            }
            throw err;
        }
    },
    getClient: async () => {
        try {
            return await pool.connect();
        } catch (err) {
            if (err.code === 'ETIMEDOUT' || err.code === 'ECONNREFUSED') {
                await handleReconnect();
                // Retry getting client after reconnection
                return await pool.connect();
            }
            throw err;
        }
    },
    pool,
    testConnection
}; 