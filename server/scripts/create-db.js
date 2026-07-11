const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function createDb() {
  // Connect to the default 'postgres' database to create the new one
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: 'postgres',
  });

  try {
    await client.connect();
    console.log('Connected to default postgres database.');
    
    // Drop database if exists (needs to disconnect others if they exist, but this is local)
    await client.query('DROP DATABASE IF EXISTS mindtrack_db');
    await client.query('CREATE DATABASE mindtrack_db');
    console.log('Created mindtrack_db.');
    
  } catch (err) {
    console.error('Error creating database:', err);
  } finally {
    await client.end();
  }

  // Now connect to the new database and run schema
  const dbClient = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: 'mindtrack_db',
  });

  try {
    await dbClient.connect();
    console.log('Connected to mindtrack_db.');
    const schemaSql = fs.readFileSync(path.join(__dirname, '../../database/schema.sql'), 'utf8');
    await dbClient.query(schemaSql);
    console.log('Schema executed successfully.');
  } catch (err) {
    console.error('Error running schema:', err);
  } finally {
    await dbClient.end();
  }
}

createDb();
