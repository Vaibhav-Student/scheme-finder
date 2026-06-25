const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

// --- SCHEMES API ---
app.get('/api/schemes', (req, res) => {
  db.all('SELECT * FROM schemes ORDER BY id DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const formatted = rows.map(r => {
      let parsedEligibility = {};
      try { parsedEligibility = JSON.parse(r.eligibility); } catch (e) { parsedEligibility = {}; }
      
      let parsedDocs = [];
      try { parsedDocs = JSON.parse(r.required_documents); } catch (e) { parsedDocs = r.required_documents; }

      return {
        ...r,
        is_active: r.is_active === 1,
        eligibility: parsedEligibility,
        required_documents: parsedDocs
      };
    });
    res.json(formatted);
  });
});

app.post('/api/schemes', (req, res) => {
  const { name, description, benefits, required_documents, apply_link, last_date, ministry, scheme_type, is_active, eligibility } = req.body;
  const sql = `INSERT INTO schemes (name, description, benefits, required_documents, apply_link, last_date, ministry, scheme_type, is_active, eligibility) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  
  const eligibilityStr = typeof eligibility === 'object' ? JSON.stringify(eligibility) : eligibility;
  const docsStr = typeof required_documents === 'object' ? JSON.stringify(required_documents) : required_documents;

  db.run(sql, [name, description, benefits, docsStr, apply_link, last_date, ministry, scheme_type, is_active ? 1 : 0, eligibilityStr], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, message: 'Scheme created successfully' });
  });
});

app.put('/api/schemes/:id/deactivate', (req, res) => {
  db.run('UPDATE schemes SET is_active = 0 WHERE id = ?', req.params.id, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Scheme deactivated successfully' });
  });
});

app.put('/api/schemes/:id', (req, res) => {
  const { name, description, benefits, required_documents, apply_link, last_date, ministry, scheme_type, is_active, eligibility } = req.body;
  const sql = `UPDATE schemes SET name=?, description=?, benefits=?, required_documents=?, apply_link=?, last_date=?, ministry=?, scheme_type=?, is_active=?, eligibility=? WHERE id=?`;
  
  const eligibilityStr = typeof eligibility === 'object' ? JSON.stringify(eligibility) : eligibility;
  const docsStr = typeof required_documents === 'object' ? JSON.stringify(required_documents) : required_documents;

  db.run(sql, [name, description, benefits, docsStr, apply_link, last_date, ministry, scheme_type, is_active ? 1 : 0, eligibilityStr, req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Scheme updated successfully' });
  });
});

// --- REVIEW QUEUE API ---
app.get('/api/review', (req, res) => {
  db.all('SELECT * FROM review_queue ORDER BY id DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/review', (req, res) => {
  const { headline, content, name, source_url, source_name, ai_confidence, ai_reason, verification_status, official_portal } = req.body;
  const sql = `INSERT INTO review_queue (headline, content, name, source_url, source_name, ai_confidence, ai_reason, verification_status, official_portal) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  
  db.run(sql, [headline, content, name, source_url, source_name, ai_confidence, ai_reason, verification_status, official_portal], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, ...req.body });
  });
});

app.delete('/api/review/:id', (req, res) => {
  db.run('DELETE FROM review_queue WHERE id = ?', req.params.id, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
});

// --- AUTH API ---
app.post('/api/auth/register', (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) return res.status(400).json({ error: 'All fields are required' });

  db.run(`INSERT INTO users (username, email, password) VALUES (?, ?, ?)`, [username, email, password], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: 'Username or Email already exists' });
      }
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'User registered successfully', userId: this.lastID, role: 'user' });
  });
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  // Check admin first
  db.get('SELECT * FROM admins WHERE username = ? AND password = ?', [username, password], (err, admin) => {
    if (err) return res.status(500).json({ error: err.message });
    if (admin) {
      return res.json({ token: 'mock-admin-token-123', role: 'admin', user: { username } });
    }

    // Check user
    db.get('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], (err, user) => {
      if (err) return res.status(500).json({ error: err.message });
      if (user) {
        if (user.is_suspended === 1) {
          return res.status(403).json({ error: 'Your account has been suspended by the administrator.' });
        }
        return res.json({ token: 'mock-user-token-123', role: 'user', user: { username, email: user.email } });
      }
      res.status(401).json({ error: 'Invalid username or password' });
    });
  });
});

// --- USERS API ---
app.get('/api/users', (req, res) => {
  db.all('SELECT id, username, email, is_suspended, created_at FROM users ORDER BY created_at DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/users/count', (req, res) => {
  db.get('SELECT COUNT(*) as count FROM users', [], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ count: row.count });
  });
});

app.put('/api/users/:id/suspend', (req, res) => {
  const { suspend } = req.body;
  db.run('UPDATE users SET is_suspended = ? WHERE id = ?', [suspend ? 1 : 0, req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: `User ${suspend ? 'suspended' : 'activated'} successfully` });
  });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
