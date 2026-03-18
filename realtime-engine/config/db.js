// realtime-engine/config/db.js
const { Pool } = require('pg');
require('dotenv').config();

// Sesuaikan dengan kredensial PostgreSQL Anda (sama dengan .env Laravel)
const pool = new Pool({
    user: process.env.DB_USERNAME || 'postgres',
    host: process.env.DB_HOST || '127.0.0.1',
    database: process.env.DB_DATABASE || 'interactive_live_db',
    password: process.env.DB_PASSWORD || 'password_anda',
    port: process.env.DB_PORT || 5432,
});

module.exports = {
    query: (text, params) => pool.query(text, params),
};