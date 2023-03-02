// Import required modules
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const ejs = require('ejs');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

// Config path var for database
const dbPath = process.env.DATABASE_URL || './data/development.sqlite';
const sessionSecret = process.env.SESSION_SECRET || 'dev_sec_ad2462435fe3c06db1d5de425b73c8d3faac9ce';

// Create a new Express application
const app = express();

// Configure Express to parse incoming JSON AND URL encoded data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: true,
}));

// Set EJS as the view engine
app.set('view engine', 'ejs');

// Create a new SQLite database connection
const db = new sqlite3.Database(dbPath);

// Create a new table for storing emails and users if it doesn't exist
db.run('CREATE TABLE IF NOT EXISTS emails (email TEXT)');
db.run('CREATE TABLE IF NOT EXISTS users (email TEXT PRIMARY KEY, password TEXT)', (err) => console.error(err));


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

// Define a route for the admin page
app.get('/admin', (req, res) => {
  if (req.session.isLoggedIn) {
    // Query the database for the email addresses
    db.all('SELECT email FROM emails', (err, rows) => {
      if (err) {
        console.error(err);
        res.status(500).send('Internal server error');
      } else {
        // Render the admin.html file with the email addresses
        res.render('admin', { emails: rows });
      }
    });
  } else {
    // Redirect the user to the login page
    res.redirect('/login');
  }
});

// Define a route for the login page
app.get('/login', (req, res) => {
  res.render('login.ejs');
});

// Define a route for the login page
app.post('/login/submit-credentials', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  // Query the database for the user with the given email
  db.get('SELECT * FROM users WHERE email = ?', email, (err, row) => {
    if (err) {
      console.error(err);
      res.status(500).send('Internal server error');
    } else if (!row) {
      // No user found with the given email
      res.status(401).send('Invalid email or password');
    } else if (password !== row.password) {
      // Passwords don't match
      res.status(401).send('Invalid email or password');
    } else {
      // Authentication succeeded
      // Set a session variable to indicate that the user is logged in
      req.session.isLoggedIn = true;
      req.session.email = email;
      res.redirect('/admin');
    }
  });
});

// Define a route for the logout endpoint
app.post('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});



// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});