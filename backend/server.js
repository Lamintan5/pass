const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');

const app = express();
const port = 5000;

app.use(cors());
app.use(bodyParser.json());

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root', 
    password: '',
    database: 'passgen'
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
    } else {
        console.log('Connected to MySQL database');
    }
});

app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    const checkUserQuery = 'SELECT * FROM users WHERE username = ? OR email = ?';
    db.query(checkUserQuery, [username, email], async (err, result) => {
        if (err) {
            return res.status(500).json({ message: 'Database error' });
        }

        if (result.length > 0) {
            const existingUser = result[0];
            if (existingUser.email === email) {
                return res.status(400).json({ message: 'Email already exists' });
            } else if (existingUser.username === username) {
                return res.status(400).json({ message: 'Username already exists' });
            }
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const insertUserQuery = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
        db.query(insertUserQuery, [username, email, hashedPassword], (err, result) => {
            if (err) {
                return res.status(500).json({ message: 'Error registering user' });
            }

            const getUserQuery = 'SELECT * FROM users WHERE id = ?';
            db.query(getUserQuery, [result.insertId], (err, userResult) => {
                if (err) {
                    return res.status(500).json({ message: 'Error fetching user data' });
                }

                if (userResult.length === 0) {
                    return res.status(404).json({ message: 'User not found after registration' });
                }

                const user = userResult[0];
                res.status(201).json({ 
                    message: 'User registered successfully', 
                    user: { 
                        id: user.id, 
                        username: user.username, 
                        email: user.email 
                    } 
                });
            });
        });
    });
});


// Login User
app.post('/login', (req, res) => {
    const { identifier, password } = req.body; 
    const getUserQuery = 'SELECT * FROM users WHERE email = ? OR username = ?';
    db.query(getUserQuery, [identifier, identifier], async (err, result) => {
        if (err) {
            return res.status(500).json({ message: 'Database error' });
        }

        if (result.length === 0) {
            return res.status(400).json({ message: 'User not found' });
        }

        const user = result[0];
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Invalid password' });
        }

        res.status(200).json({ 
            message: 'Login successful', 
            user: { id: user.id, username: user.username, email: user.email } 
        });
    });
});


app.put("/update-account", async (req, res) => {
    const { id, username, email, currentPassword, newPassword } = req.body;

    const getUserQuery = "SELECT * FROM users WHERE id = ?";
    db.query(getUserQuery, [id], async (err, result) => {
        if (err) return res.status(500).json({ message: "Database error", success: false });

        if (result.length === 0) return res.status(404).json({ message: "User not found", success: false });

        const user = result[0];
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

        if (!isPasswordValid) return res.status(400).json({ message: "Incorrect current password", success: false });

        let updateQuery = "UPDATE users SET username = ?, email = ? WHERE id = ?";
        let updateParams = [username, email, id];

        if (newPassword) {
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            updateQuery = "UPDATE users SET username = ?, email = ?, password = ? WHERE id = ?";
            updateParams = [username, email, hashedPassword, id];
        }

        db.query(updateQuery, updateParams, (err) => {
            if (err) return res.status(500).json({ message: "Error updating account", success: false });

            res.json({ message: "Account updated successfully", success: true });
        });
    });
});

app.post('/save-password', (req, res) => {
    const { uid, title, website, password } = req.body;

    if (!uid || !title || !website || !password) {
        return res.status(400).json({ message: 'All fields are required', success: false });
    }

    const insertQuery = 'INSERT INTO passwords (uid, title, website, password) VALUES (?, ?, ?, ?)';
    db.query(insertQuery, [uid, title, website, password], (err, result) => {
        if (err) {
            console.error('Error saving password:', err);
            return res.status(500).json({ message: 'Error saving password', success: false });
        }

        res.status(201).json({ message: 'Password saved successfully', success: true });
    });
});

app.delete('/delete-password/:id', (req, res) => {
    const id = req.params.id;

    const deleteQuery = 'DELETE FROM passwords WHERE id = ?';
    db.query(deleteQuery, [id], (err, result) => {
        if (err) {
            console.error('Error deleting password:', err);
            return res.status(500).json({ message: 'Error deleting password', success: false });
        }

        res.status(200).json({ message: 'Password deleted successfully', success: true });
    });
});

app.put('/update-password', (req, res) => {
    const { id, title, website, password } = req.body;
    const query = 'UPDATE passwords SET title = ?, website = ?, password = ? WHERE id = ?';
    db.query(query, [title, website, password, id], (err, result) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        res.json({ success: true, message: 'Password updated successfully' });
    });
});

app.get('/get-passwords/:uid', (req, res) => {
    const uid = req.params.uid;
    const query = 'SELECT id, title, website, password FROM passwords WHERE uid = ?';
    db.query(query, [uid], (err, results) => {
        if (err) {
            console.error('Error fetching passwords:', err);
            return res.status(500).json({ message: 'Error fetching passwords', success: false });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'Password not found', success: false });
        }
        res.status(200).json({ passwords: results, success: true });
    });
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});