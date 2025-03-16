'use strict';

// Load packages
const express = require('express');
const bodyParser = require("body-parser");
const mysql = require('mysql2');
const bcrypt = require ('bcrypt');
const session = require('express-session'); 

// Set app environment
const PORT = 3000;
const app = express();

// Middleware
app.use(bodyParser.json());
app.use(session({
    secret: 'session_secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 3600000, // 1-hour session expiration
        httpOnly: false, // Prevents client-side JS access to session cookies
        secure: false
    }
}));

require('dotenv').config(); // Load.env variables

// Create connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

// Use a promise-based pool connection
const db = pool.promise();

// Check database connection
db.getConnection()
    .then(connection => {
        console.log('Connected to MySQL database');
        connection.release(); // Release connection back to the pool
    })
    .catch(err => {
        console.error('Error connecting to database: ', err);
        process.exit(1);
    });

// POST request to register accounts
app.post('/register', (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: "Error: missing data." });
    }

    // Hash the password before storing it in the database
    bcrypt.hash(password, 10) // 10 is the recommended salt rounds
    .then(hashedPassword => {
        return db.query(
            "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)", 
            [name, email, hashedPassword]
        );
    })
    .then(([result]) => res.json({ success: true, id: result.insertId}))
    .catch(err => {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: "Email already registered." });
        }
        console.error("Database error: ", err);
        res.status(500).json({ success: false, message: "Internal server error. Please try again later." });
    });
});

// POST request for account login
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: "Error: missing data." });
    }

    db.query("SELECT id, email, password_hash, role FROM users WHERE email = ?", [email])
    .then(([rows]) => {
        if (rows.length === 0) {
            return res.status(400).json({ success: false, message: "Wrong email or password. Please try again or register for an account." });
        }

        const user = rows[0];

        // Compare the entered password with the stored hashed password
        return bcrypt.compare(password, user.password_hash).then(match => {
            if (!match) {
                return res.status(400).json({ success: false, message: "Wrong email or password. Please try again." });
            }

            req.session.userId = user.id; // To track the logged-in user
            req.session.role = user.role; // To check if the user is an admin

            res.json({ success: true, id: user.id, message: "Login successful." });
        });
    })
    .catch(err => {
        console.error("Database error: ", err);
        res.status(500).json({ success: false, message: "Internal server error. Please try again later." });
    });
});

function requireAuth(req, res, next) {
    if (!req.session|| !req.session.userId) {
        return res.status(401).json({ success: false, message: "Unauthorized. Please log in."});
    }
    next(); // User is logged in, proceed to next middleware or request handler
}

// POST request to create channels
app.post('/createchannel', requireAuth, (req, res) => {
    const { topic, content } = req.body;

    if (!topic || !content) {
        return res.status(400).json({ success: false, message: "Error: missing topic or content." });
    }

    db.query("INSERT INTO channels (topic, content) VALUES (?, ?)", [topic, content])
    .then(([result]) => res.json({ success: true, id: result.insertId}))
    .catch(err => {
        console.error("Database error: ", err);
        res.status(500).json({ success: false, message: "Internal server error. Please try again later." });
    });

});

// POST request to post messages to a channel
app.post('/postmessage', requireAuth, (req, res) => {
    const { channelId, content} = req.body;

    if (!channelId || !content) {
        return res.status(400).json({ success: false, message: "Error: missing channel ID or content." });
    }

    db.query("SELECT id FROM channels WHERE id = ?", [channelId])
    .then(([existingChannel]) => {
        if (existingChannel.length === 0) {
            return res.status(400).json({ success: false, message: "Invalid channel ID." });
        }
        return db.query("INSERT INTO messages (channelId, content) VALUES (?, ?)", [channelId, content]);
    })
    .then(([result]) => res.json({ success: true, id: result.insertId}))
    .catch(err => {
        console.error("Database error: ", err);
        res.status(500).json({ success: false, message: "Internal server error. Please try again later." });
    });
});

// POST request to post replies to messages in a channel
app.post('/postreply', requireAuth, (req, res) => {
    const { messageId, content } = req.body;

    if (!messageId || !content) {
        return res.status(400).json({ success: false, message: "Error: missing message ID or content." });
    }

    db.query("SELECT id FROM messages WHERE id = ?", [messageId])
    .then(([existingMessage]) => {
        if (existingMessage.length === 0) {
            return res.status(400).json({ success: false, message: "Invalid message ID." });
        }
        return db.query("INSERT INTO replies (messageId, content) VALUES (?, ?)", [messageId, content]);
    })
    .then(([result]) => res.json({ success: true, id: result.insertId}))
    .catch(err => {
        console.error("Database error: ", err);
        res.status(500).json({ success: false, message: "Internal server error. Please try again later." });
    });
});

// GET request to get all data
app.get('/alldata', (req, res) => {
    const query = `
    SELECT channels.id AS channelId, channels.topic, channels.content AS channelContent, channels.timestamp AS channelTime,
        messages.id AS messageId, messages.content AS messageContent, messages.timestamp AS messageTime,
            replies.id as replyId, replies.content AS replyContent, replies.timestamp AS replyTime
        FROM channels
        LEFT JOIN messages ON channels.id = messages.channelId
        LEFT JOIN replies ON messages.id = replies.messageId
        ORDER BY channels.timestamp DESC, messages.timestamp DESC, replies.timestamp ASC
        `;
        db.query(query)
        .then(([result]) => res.json({ success: true, data: result }))
        .catch(err => {
            console.error("Database error: ", err);
            res.status(500).json({ success: false, message: "Internal server error. Please try again later." });
        });
});

app.use((err, req, res, next) => {
    console.error("Unexpected error:", err);
    res.status(500).json({ success: false, message: "Something went wrong on our end." });
});

// Listen on port
app.listen(PORT, () => {
    console.log(`Running on http://localhost:${PORT}`);
});







