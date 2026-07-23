const bcrypt = require("bcrypt");
const db = require("../config/db");

// Register Officer
exports.registerOfficer = async (req, res) => {
    try {
        const { full_name, username, password } = req.body;

        // Check if all fields are provided
        if (!full_name || !username || !password) {
            return res.status(400).json({
                message: "Please fill in all required fields."
            });
        }

        // Check if username already exists
        db.query(
            "SELECT * FROM officers WHERE username = ?",
            [username],
            async (err, results) => {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }

                if (results.length > 0) {
                    return res.status(400).json({
                        message: "Username already exists."
                    });
                }

                // Hash password
                const hashedPassword = await bcrypt.hash(password, 10);

                // Insert officer
                db.query(
                    "INSERT INTO officers (full_name, username, password) VALUES (?, ?, ?)",
                    [full_name, username, hashedPassword],
                    (err) => {
                        if (err) {
                            return res.status(500).json({ error: err.message });
                        }

                        res.status(201).json({
                            message: "Officer registered successfully."
                        });
                    }
                );
            }
        );

    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
};

const jwt = require("jsonwebtoken");

exports.loginOfficer = (req, res) => {

    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({
            message: "Please enter username and password."
        });
    }

    db.query(
        "SELECT * FROM officers WHERE username = ?",
        [username],
        async (err, results) => {

            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            if (results.length === 0) {
                return res.status(401).json({
                    message: "Invalid username or password."
                });
            }

            const officer = results[0];

            const passwordMatch = await bcrypt.compare(
                password,
                officer.password
            );

            if (!passwordMatch) {
                return res.status(401).json({
                    message: "Invalid username or password."
                });
            }

            const token = jwt.sign(
                {
                    officer_id: officer.officer_id,
                    username: officer.username
                },
                process.env.JWT_SECRET || "studentidfindersecret",
                {
                    expiresIn: "8h"
                }
            );

            res.json({
                message: "Login successful",
                token,
                officer: {
                    officer_id: officer.officer_id,
                    full_name: officer.full_name,
                    username: officer.username,
                    first_login: officer.first_login
                }
            });

        }
    );

};