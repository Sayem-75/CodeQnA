
/*********************************************************************************** Server Setup ***********************************************************************************/
'use strict';

// Load packages
const express = require('express');
const bodyParser = require("body-parser");
const mysql = require('mysql2');
const bcrypt = require ('bcrypt');
const session = require('express-session'); 
const cors = require('cors');

// Set app environment
const PORT = 3000;
const app = express();

// Middleware
app.use(bodyParser.json());
app.use(cors({
    origin: 'http://localhost:3001',
    credentials: true
}));

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

/********************************************************************************** Database Setup **********************************************************************************/

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

/********************************************************************* User Register, Login and Authentication *********************************************************************/

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


// Authentication function for users
function requireAuth(req, res, next) {
    if (!req.session|| !req.session.userId) {
        return res.status(401).json({ success: false, message: "Unauthorized. Please log in." });
    }
    next(); // User is logged in, proceed to next middleware or request handler
}

/************************************************************************** POST Requests for App Features **************************************************************************/

// POST request to create channels
app.post('/createchannel', requireAuth, (req, res) => {
    const { topic, content, screenshot } = req.body;

    if (!topic || !content) {
        return res.status(400).json({ success: false, message: "Error: missing topic or content." });
    }

    db.query("INSERT INTO channels (topic, content, screenshot) VALUES (?, ?,  ?)", [topic, content, screenshot || null])
    .then(([result]) => res.json({ success: true, id: result.insertId}))
    .catch(err => {
        console.error("Database error: ", err);
        res.status(500).json({ success: false, message: "Internal server error. Please try again later." });
    });

});


// POST request to post messages to a channel
app.post('/postmessage', requireAuth, (req, res) => {
    const { channelId, content, screenshot } = req.body;

    if (!channelId || !content) {
        return res.status(400).json({ success: false, message: "Error: missing channel ID or content." });
    }

    db.query("SELECT id FROM channels WHERE id = ?", [channelId])
    .then(([existingChannel]) => {
        if (existingChannel.length === 0) {
            return res.status(400).json({ success: false, message: "Invalid channel ID." });
        }
        return db.query("INSERT INTO messages (channelId, content, screenshot) VALUES (?, ?, ?)", [channelId, content, screenshot || null]);
    })
    .then(([result]) => res.json({ success: true, id: result.insertId}))
    .catch(err => {
        console.error("Database error: ", err);
        res.status(500).json({ success: false, message: "Internal server error. Please try again later." });
    });
});


// POST request to post replies to messages in a channel (supports both direct replies & nested replies)
app.post('/postreply', requireAuth, (req, res) => {
    const { messageId, parentReplyId, content, screenshot } = req.body;

    if ((!messageId && !parentReplyId) || (messageId && parentReplyId) || !content) {
        return res.status(400).json({ success: false, message: "Error: missing a message ID or a parent reply ID, but not both. Missing content." });
    }

    // If replying to a message, check if the message exists
    let checkQuery = "SELECT id FROM messages WHERE id = ?";
    let checkId = messageId;

    // If replying to a reply, check if the parent reply exists
    if (parentReplyId) {
        checkQuery = "SELECT id FROM replies WHERE id = ?";
        checkId = parentReplyId;
    }

    db.query(checkQuery, [checkId])
    .then(([rows]) => {
        if (rows.length === 0) {
            return res.status(400).json({ success: false, message: "Invalid message or parent reply ID." });
        }
        return db.query("INSERT INTO replies (messageId, parentReplyId, content, screenshot) VALUES (?, ?, ?, ?)", [messageId || null, parentReplyId || null, content, screenshot || null]);
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
    SELECT 
        channels.id AS channelId, 
        channels.topic, 
        channels.content AS channelContent, 
        channels.timestamp AS channelTime,
        channels.screenshot AS channelScreenshot,
        messages.id AS messageId, 
        messages.content AS messageContent, 
        messages.timestamp AS messageTime,
        messages.screenshot AS messageScreenshot,
        replies.id AS replyId, 
        replies.content AS replyContent, 
        replies.timestamp AS replyTime,
        replies.parentReplyId AS parentReplyId,
        replies.messageId AS replyMessageId,
        replies.screenshot AS replyScreenshot
    FROM channels
    LEFT JOIN messages ON channels.id = messages.channelId
    LEFT JOIN replies ON messages.id = replies.messageId OR replies.parentReplyId IS NOT NULL
    ORDER BY channels.timestamp DESC, messages.timestamp DESC, replies.timestamp ASC
    `;

        db.query(query)
        .then(([result]) => res.json({ success: true, data: result }))
        .catch(err => {
            console.error("Database error: ", err);
            res.status(500).json({ success: false, message: "Internal server error. Please try again later." });
        });
});

/************************************************************************************ Admin Role ************************************************************************************/

// Authentication function for admin role
function requireAdmin(req, res, next) {
    if (!req.session || req.session.role !== 'admin') {
        return res.status(403).json({ success: false, message: "Forbidden. Admins only." });
    }
    next(); // Admin is logged in, proceed to next middleware or request handler
}

// DELETE requests for admin role
app.delete('/deleteuser/:id', requireAdmin, (req, res) => {
    const userId = req.params.id;

    db.query("SELECT id FROM users WHERE id = ?", [userId])
    .then(([rows]) => {
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        return db.query("DELETE FROM users WHERE id = ?", [userId]);
    })
    .then(() => res.json({ success: true, message: "User deleted successfully." }))
    .catch(err => {
        console.error("Database error: ", err);
        res.status(500).json({ success: false, message: "Internal server error. Please try again later." });
    });
});

app.delete('/deletechannel/:id', requireAdmin, (req, res) => {
    const channelId = req.params.id;

    db.query("SELECT id FROM channels WHERE id = ?", [channelId])
    .then(([rows]) => {
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "Channel not found." });
        }

        return db.query("DELETE FROM channels WHERE id = ?", [channelId]);
    })
    .then(() => res.json({ success: true, message: "Channel deleted successfully." }))
    .catch(err => {
        console.error("Database error: ", err);
        res.status(500).json({ success: false, message: "Internal server error. Please try again later." });
    });
});


app.delete('/deletemessage/:id', requireAdmin, (req, res) => {
    const messageId = req.params.id;

    db.query("SELECT id FROM messages WHERE id = ?", [messageId])
    .then(([rows]) => {
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "Message not found." });
        }

        return db.query("DELETE FROM messages WHERE id = ?", [messageId]);
    })
    .then(() => res.json({ success: true, message: "Message deleted successfully." }))
    .catch(err => {
        console.error("Database error: ", err);
        res.status(500).json({ success: false, message: "Internal server error. Please try again later." });
    });
});

app.delete('/deletereply/:id', requireAdmin, (req, res) => {
    const replyId = req.params.id;

    db.query("SELECT id FROM replies WHERE id = ?", [replyId])
    .then(([rows]) => {
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "Reply not found." });
        }

        return db.query("DELETE FROM replies WHERE id = ?", [replyId]);
    })
    .then(() => res.json({ success: true, message: "Reply deleted successfully." }))
    .catch(err => {
        console.error("Database error: ", err);
        res.status(500).json({ success: false, message: "Internal server error. Please try again later." });
    });
});

/************************************************************************************* Default *************************************************************************************/

app.use((err, req, res, next) => {
    console.error("Unexpected error:", err);
    res.status(500).json({ success: false, message: "Something went wrong on our end." });
});


// Listen on port
app.listen(PORT, () => {
    console.log(`Running on http://localhost:${PORT}`);
});







