// Import required modules
const express = require('express');
const sqlite3 = require('sqlite3').verbose();

// Create a new Express application
const app = express();

// Configure Express to parse incoming JSON data
app.use(express.json());

// Create a new SQLite database connection
const db = new sqlite3.Database('emails.db');

// Create a new table for storing emails if it doesn't exist
db.run('CREATE TABLE IF NOT EXISTS emails (email TEXT)');

// Define a route for the landing page
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// Define a route for handling email submissions
app.post('/submit-email', (req, res) => {
  const email = req.body.email;

  // Insert the email into the database
  db.run('INSERT INTO emails (email) VALUES (?)', [email], (err) => {
    if (err) {
      console.error(err);
      res.status(500).send('Internal server error');
    } else {
      res.status(200).send('Email added to database');
    }
  });
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});