const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const dotenv = require('dotenv');
dotenv.config('./.env');

const app = express();
const port =  3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));
app.set('view engine', 'ejs'); // Set EJS as view engine



// SQLite database setup
const db = new sqlite3.Database('database.db', (err) => {
    if (err) {
        console.error('Failed to connect to database:', err);
    } else {
        console.log('Connected to the database.');
        // Creating the locations table if it doesn't exist
        db.run(`CREATE TABLE IF NOT EXISTS locations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            address TEXT,
            latitude REAL,
            longitude REAL,
            completed BOOLEAN DEFAULT 0
        )`, (err) => {
            if (err) {app.use(express.static('public'));
                console.error('Failed to create table:', err);
            } else {
                console.log('Table created successfully.');
            }
        });
    }
});


//setting up server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

// Routes
app.get('/', (req, res) => {
    res.render('index',{apiKey : process.env.API_KEY}); // Render index.ejs template
});

// Route to add a new location with latitude and longitude to the database
app.post('/add-location', (req, res) => {
    const { address, latitude, longitude } = req.body;

    // Check if the address already exists in the database
    db.get("SELECT * FROM locations WHERE address = ?", [address], (err, row) => {
        if (err) {
            console.error('Failed to check for duplicate address:', err.message);
            res.status(500).send('Failed to check for duplicate address.');
        } else if (row) {
            console.log('Duplicate address:', address);
            res.status(400).send('Duplicate address. Please enter a unique address.');
        } else {
            // Insert address, latitude, and longitude into the database
            db.run("INSERT INTO locations (address, latitude, longitude) VALUES (?, ?, ?)", [address, latitude, longitude], function (err) {
                if (err) {
                    console.error('Failed to add location to database:', err.message);
                    res.status(500).send('Failed to add location to database.');
                } else {
                    const jobId = this.lastID;
                    console.log(`A location has been added with rowid ${this.lastID}`);
                    res.status(200).json({ message: 'Location added successfully.' , jobId : jobId });
                }
            });
        }
    });
});

// DELETE route to clear the locations table
app.delete('/clear-locations', (req, res) => {
    // Clear the locations table
    db.run("DELETE FROM locations", function (err) {
        if (err) {
            console.error(err.message);
            res.status(500).send('Failed to clear locations table.');
        } else {
            console.log('Locations table cleared.');
            res.status(200).send('Locations table cleared successfully.');
        }
    });
});


// Route to mark a job as completed
app.put('/complete-job/:id', (req, res) => {
    const jobId = req.params.id;

    // Update the completed status of the job in the database
    db.run("UPDATE locations SET completed = 1 WHERE id = ?", [jobId], function (err) {
        if (err) {
            console.error('Failed to mark job as completed:', err.message);
            res.status(500).send('Failed to mark job as completed.');
        } else {
            console.log(`Job ${jobId} marked as completed.`);
            res.status(200).send(`Job ${jobId} marked as completed.`);
        }
    });
});

module.exports = app;