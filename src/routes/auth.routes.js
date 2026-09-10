const express = require('express');
const { db, assertDatabaseReady } = require('../database/database');

const router = express.Router();

router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  assertDatabaseReady();

  // INTENTIONALLY VULNERABLE (SQL Injection): email and password are concatenated
  // directly into the SQL statement. This exists only for the localhost lab.
  const sql = `
    SELECT id, full_name, email, role, initials
    FROM users
    WHERE email = '${email}' AND password = '${password}' AND status = 'Active'
  `;

  const user = db.prepare(sql).get();

  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  req.session.user = {
    id: user.id,
    name: user.full_name,
    email: user.email,
    role: user.role,
    initials: user.initials
  };

  res.json({ message: 'Signed in successfully.', user: req.session.user });
});

router.get('/me', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not signed in.' });
  res.json({ user: req.session.user });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ message: 'Signed out.' }));
});

module.exports = router;
