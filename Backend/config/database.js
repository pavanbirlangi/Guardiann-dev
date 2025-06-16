const { Pool } = require('pg');

// Database configuration
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,    // 10 seconds
    idleTimeoutMillis: 60000,         // 60 seconds
    max: 20,                          // Maximum number of clients in the pool
    min: 4,                           // Minimum number of clients in the pool
    allowExitOnIdle: false,           // Don't exit the process when idle
    keepAlive: true,                  // Enable keep-alive
    keepAliveInitialDelayMillis: 10000, // Send keep-alive after 10 seconds
    statement_timeout: 30000,         // 30 seconds statement timeout
    query_timeout: 30000,             // 30 seconds query timeout
    application_name: 'guardiann_backend' // Identify the application
});

// Track active clients to prevent double release
const activeClients = new Set();

// Function to test database connection
const testConnection = async () => {
    let client;
    try {
        client = await pool.connect();
        activeClients.add(client);
        await client.query('SELECT NOW()');
        console.log('Database connection test successful');
        return true;
    } catch (err) {
        console.error('Database connection test failed:', err);
        return false;
    } finally {
        if (client && activeClients.has(client)) {
            activeClients.delete(client);
            client.release();
        }
    }
};

// Function to handle reconnection attempts
const handleReconnect = async () => {
    console.log('Attempting to reconnect to database...');
    const maxRetries = 5;
    let retries = 0;
    let lastError;

    while (retries < maxRetries) {
        try {
            if (await testConnection()) {
                console.log('Successfully reconnected to database');
                return true;
            }
        } catch (err) {
            lastError = err;
            console.error(`Reconnection attempt ${retries + 1} failed:`, err.message);
        }
        retries++;
        if (retries < maxRetries) {
            const delay = Math.min(1000 * Math.pow(2, retries), 30000); // Exponential backoff with max 30s
            console.log(`Retrying in ${delay/1000} seconds...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    console.error('Failed to reconnect to database after', maxRetries, 'attempts. Last error:', lastError?.message);
    return false;
};

// Pool Event Listeners
pool.on('error', async (err, client) => {
    console.error('Unexpected error on idle client:', err);
    if (client && activeClients.has(client)) {
        activeClients.delete(client);
        client.release(true); // Force release the client
    }
    // Only attempt reconnection if it's a connection error
    if (err.code === 'ECONNRESET' || err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
        await handleReconnect();
    }
});

pool.on('connect', () => {
    console.log('New database connection established');
});

pool.on('acquire', (client) => {
    console.log('Client acquired from pool');
    activeClients.add(client);
});

pool.on('remove', (client) => {
    console.log('Client removed from pool');
    activeClients.delete(client);
});

// Initial connection test
testConnection().then(isConnected => {
    if (!isConnected) {
        handleReconnect();
    }
});

// Periodic connection check (every 5 minutes)
const HEALTH_CHECK_INTERVAL = 5 * 60 * 1000;
setInterval(async () => {
    const isConnected = await testConnection();
    if (!isConnected) {
        await handleReconnect();
    }
}, HEALTH_CHECK_INTERVAL);

// Graceful shutdown
const shutdown = async () => {
    console.log('Shutting down database pool...');
    try {
        // Release all active clients
        for (const client of activeClients) {
            try {
                client.release(true);
            } catch (err) {
                console.error('Error releasing client during shutdown:', err);
            }
        }
        activeClients.clear();
        await pool.end();
        console.log('Database pool closed successfully');
    } catch (err) {
        console.error('Error closing database pool:', err);
    }
};

// Handle process termination
process.on('SIGTERM', async () => {
    console.log('SIGTERM received');
    await shutdown();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('SIGINT received');
    await shutdown();
    process.exit(0);
});

// Exporting the query and client retrieval methods
module.exports = {
    query: async (text, params) => {
        let client;
        try {
            client = await pool.connect();
            activeClients.add(client);
            return await client.query(text, params);
        } catch (err) {
            console.error('Query error:', err);
            // If it's a connection error, attempt to reconnect
            if (err.code === 'ECONNRESET' || err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
                await handleReconnect();
            }
            throw err;
        } finally {
            if (client && activeClients.has(client)) {
                activeClients.delete(client);
                client.release();
            }
        }
    },
    getClient: async () => {
        let client;
        try {
            client = await pool.connect();
            activeClients.add(client);
            return client;
        } catch (err) {
            console.error('Error acquiring client:', err);
            // If it's a connection error, attempt to reconnect
            if (err.code === 'ECONNRESET' || err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
                await handleReconnect();
            }
            throw err;
        }
    },
    releaseClient: (client) => {
        if (client && activeClients.has(client)) {
            activeClients.delete(client);
            client.release();
        }
    },
    pool,
    testConnection,
    handleReconnect
};
