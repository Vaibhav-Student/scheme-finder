const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

// Database debugging endpoint
app.get('/api/db-debug', async (req, res) => {
  const dbConfigured = !!process.env.DATABASE_URL;
  const isPlaceholder = dbConfigured && process.env.DATABASE_URL.includes('your-project-ref');
  
  let queryResult = null;
  let queryError = null;
  
  try {
    const start = Date.now();
    const result = await db.pool.query('SELECT NOW()');
    queryResult = {
      status: 'success',
      time: Date.now() - start,
      rows: result.rows
    };
  } catch (err) {
    queryError = {
      message: err.message,
      code: err.code,
      detail: err.detail,
      stack: err.stack,
      keys: Object.keys(err)
    };
  }
  
  res.json({
    dbConfigured,
    isPlaceholder,
    queryResult,
    queryError
  });
});

// --- SCHEMES API ---
app.get('/api/schemes', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM schemes ORDER BY id DESC');
    const formatted = result.rows.map(r => {
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
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a single scheme by ID
app.get('/api/schemes/:id', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM schemes WHERE id = $1', [req.params.id]);
    const row = result.rows[0];
    if (!row) return res.status(404).json({ error: 'Scheme not found' });

    let parsedEligibility = {};
    try { parsedEligibility = JSON.parse(row.eligibility); } catch (e) { parsedEligibility = {}; }
    let parsedDocs = [];
    try { parsedDocs = JSON.parse(row.required_documents); } catch (e) { parsedDocs = row.required_documents; }

    res.json({
      ...row,
      is_active: row.is_active === 1,
      eligibility: parsedEligibility,
      required_documents: parsedDocs
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/schemes', async (req, res) => {
  try {
    const { name, description, benefits, required_documents, apply_link, last_date, ministry, scheme_type, is_active, eligibility, source_url } = req.body;
    const sql = `INSERT INTO schemes (name, description, benefits, required_documents, apply_link, last_date, ministry, scheme_type, is_active, eligibility, source_url) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`;
    
    const eligibilityStr = typeof eligibility === 'object' ? JSON.stringify(eligibility) : (eligibility || '{}');
    const docsStr = typeof required_documents === 'object' ? JSON.stringify(required_documents) : (required_documents || '[]');

    const result = await db.query(
      sql, 
      [
        name || '', 
        description || '', 
        benefits || '', 
        docsStr, 
        apply_link || '', 
        last_date || '', 
        ministry || '', 
        scheme_type || '', 
        is_active ? 1 : 0, 
        eligibilityStr, 
        source_url || ''
      ]
    );
    res.json({ id: result.rows[0].id, message: 'Scheme created successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/schemes/:id/deactivate', async (req, res) => {
  try {
    const result = await db.query('UPDATE schemes SET is_active = 0 WHERE id = $1', [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Scheme not found' });
    res.json({ message: 'Scheme deactivated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/schemes/:id/reactivate', async (req, res) => {
  try {
    const result = await db.query('UPDATE schemes SET is_active = 1 WHERE id = $1', [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Scheme not found' });
    res.json({ message: 'Scheme reactivated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/schemes/:id', async (req, res) => {
  try {
    const { name, description, benefits, required_documents, apply_link, last_date, ministry, scheme_type, is_active, eligibility, source_url } = req.body;
    const sql = `UPDATE schemes SET name=$1, description=$2, benefits=$3, required_documents=$4, apply_link=$5, last_date=$6, ministry=$7, scheme_type=$8, is_active=$9, eligibility=$10, source_url=$11 WHERE id=$12`;
    
    const eligibilityStr = typeof eligibility === 'object' ? JSON.stringify(eligibility) : (eligibility || '{}');
    const docsStr = typeof required_documents === 'object' ? JSON.stringify(required_documents) : (required_documents || '[]');

    const result = await db.query(
      sql, 
      [
        name || '', 
        description || '', 
        benefits || '', 
        docsStr, 
        apply_link || '', 
        last_date || '', 
        ministry || '', 
        scheme_type || '', 
        is_active ? 1 : 0, 
        eligibilityStr, 
        source_url || '', 
        req.params.id
      ]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Scheme not found' });
    res.json({ message: 'Scheme updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/schemes/:id', async (req, res) => {
  try {
    const result = await db.query('DELETE FROM schemes WHERE id = $1', [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Scheme not found' });
    res.json({ message: 'Scheme deleted permanently' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- SCHEME MATCHING API ---
// Accepts user profile data and returns matching active schemes from the DB
app.post('/api/schemes/match', async (req, res) => {
  try {
    const profile = req.body;
    const result = await db.query('SELECT * FROM schemes WHERE is_active = 1 ORDER BY id DESC');
    const rows = result.rows;

    const results = [];
    for (const row of rows) {
      let eligibility = {};
      try { eligibility = JSON.parse(row.eligibility); } catch (e) { eligibility = {}; }
      let parsedDocs = [];
      try { parsedDocs = JSON.parse(row.required_documents); } catch (e) { parsedDocs = row.required_documents; }

      const matchResult = matchProfile(profile, eligibility);

      if (matchResult.eligible) {
        results.push({
          ...row,
          is_active: true,
          eligibility,
          required_documents: parsedDocs,
          match_score: matchResult.score,
          match_reasons: matchResult.reasons,
        });
      }
    }

    // Sort by match score descending
    results.sort((a, b) => b.match_score - a.match_score);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Match a user profile against a scheme's eligibility criteria.
 * Returns { eligible: bool, score: number 0-100, reasons: string[] }
 */
function matchProfile(profile, eligibility) {
  const reasons = [];
  let totalChecks = 0;
  let passedChecks = 0;
  let hardFail = false;

  let extra = {};
  if (profile.extra_fields) {
    try {
      extra = typeof profile.extra_fields === 'string' ? JSON.parse(profile.extra_fields) : profile.extra_fields;
    } catch (e) {
      extra = {};
    }
  }

  // --- Age check ---
  if (eligibility.min_age && profile.age) {
    totalChecks++;
    if (parseInt(profile.age) >= parseInt(eligibility.min_age)) {
      passedChecks++;
      reasons.push(`Age ${profile.age} ≥ minimum ${eligibility.min_age}`);
    } else {
      hardFail = true;
      reasons.push(`Age ${profile.age} is below minimum ${eligibility.min_age}`);
    }
  }
  if (eligibility.max_age && profile.age) {
    totalChecks++;
    if (parseInt(profile.age) <= parseInt(eligibility.max_age)) {
      passedChecks++;
      reasons.push(`Age ${profile.age} ≤ maximum ${eligibility.max_age}`);
    } else {
      hardFail = true;
      reasons.push(`Age ${profile.age} exceeds maximum ${eligibility.max_age}`);
    }
  }

  // --- Gender check ---
  if (eligibility.gender && profile.gender) {
    totalChecks++;
    const profileGender = profile.gender === 'M' ? 'Male' : profile.gender === 'F' ? 'Female' : profile.gender;
    if (eligibility.gender.toLowerCase() === profileGender.toLowerCase() || eligibility.gender.toLowerCase() === 'any') {
      passedChecks++;
      reasons.push(`Gender matches: ${profileGender}`);
    } else {
      hardFail = true;
      reasons.push(`Gender ${profileGender} doesn't match required ${eligibility.gender}`);
    }
  }

  // --- Category check ---
  if (eligibility.categories && eligibility.categories.length > 0 && profile.category) {
    totalChecks++;
    if (eligibility.categories.includes(profile.category)) {
      passedChecks++;
      reasons.push(`Category ${profile.category} is eligible`);
    } else {
      hardFail = true;
      reasons.push(`Category ${profile.category} not in eligible list: ${eligibility.categories.join(', ')}`);
    }
  }

  // --- Income check ---
  if (eligibility.max_family_income && profile.family_income) {
    totalChecks++;
    if (parseFloat(profile.family_income) <= parseFloat(eligibility.max_family_income)) {
      passedChecks++;
      reasons.push(`Income ₹${profile.family_income} ≤ maximum ₹${eligibility.max_family_income}`);
    } else {
      hardFail = true;
      reasons.push(`Income ₹${profile.family_income} exceeds maximum ₹${eligibility.max_family_income}`);
    }
  }

  // --- Education level check ---
  if (eligibility.education_levels && eligibility.education_levels.length > 0 && profile.education_level) {
    totalChecks++;
    if (eligibility.education_levels.includes(profile.education_level)) {
      passedChecks++;
      reasons.push(`Education level ${profile.education_level} matches`);
    } else {
      reasons.push(`Education level ${profile.education_level} not specifically listed`);
    }
  }

  // --- State check ---
  if (eligibility.states && eligibility.states.length > 0 && profile.state) {
    totalChecks++;
    if (eligibility.states.includes(profile.state)) {
      passedChecks++;
      reasons.push(`State ${profile.state} is eligible`);
    } else {
      hardFail = true;
      reasons.push(`State ${profile.state} not in eligible list`);
    }
  }

  // --- Disability check ---
  if (eligibility.disability_types && eligibility.disability_types.length > 0) {
    totalChecks++;
    if (profile.has_disability && profile.disability_type) {
      if (eligibility.disability_types.includes(profile.disability_type)) {
        passedChecks++;
        reasons.push(`Disability type ${profile.disability_type} matches`);
      } else {
        reasons.push(`Disability type ${profile.disability_type} not specifically listed`);
      }
    } else {
      reasons.push('Scheme targets persons with disabilities');
    }
  }

  // --- Disability percentage check ---
  if (eligibility.min_disability_pct && profile.disability_percentage) {
    totalChecks++;
    if (parseInt(profile.disability_percentage) >= parseInt(eligibility.min_disability_pct)) {
      passedChecks++;
      reasons.push(`Disability ${profile.disability_percentage}% ≥ minimum ${eligibility.min_disability_pct}%`);
    } else {
      reasons.push(`Disability ${profile.disability_percentage}% below minimum ${eligibility.min_disability_pct}%`);
    }
  }

  // --- Rural/Urban area type check ---
  if (eligibility.rural_urban && eligibility.rural_urban !== 'Any') {
    totalChecks++;
    const userArea = profile.area_type || extra.area_type;
    if (userArea && (eligibility.rural_urban.toLowerCase() === userArea.toLowerCase())) {
      passedChecks++;
      reasons.push(`Area type matches: ${userArea}`);
    } else {
      hardFail = true;
      reasons.push(`Area type ${userArea || 'not set'} doesn't match required ${eligibility.rural_urban}`);
    }
  }

  // --- Marital Status check ---
  if (eligibility.marital_status && eligibility.marital_status !== 'Any') {
    totalChecks++;
    const userMarital = profile.marital_status || extra.marital_status;
    if (userMarital && (eligibility.marital_status.toLowerCase() === userMarital.toLowerCase())) {
      passedChecks++;
      reasons.push(`Marital status matches: ${userMarital}`);
    } else {
      hardFail = true;
      reasons.push(`Marital status ${userMarital || 'not set'} doesn't match required ${eligibility.marital_status}`);
    }
  }

  // --- Farmer check ---
  if (eligibility.is_farmer) {
    totalChecks++;
    const userFarmer = profile.is_farmer || extra.is_farmer || (extra.primary_role === 'Farmer' ? 'Yes' : 'No');
    if (userFarmer === 'Yes' || userFarmer === true || userFarmer === 1) {
      passedChecks++;
      reasons.push('Farmer status matches');
    } else {
      hardFail = true;
      reasons.push('Scheme requires applicant to be a farmer');
    }
  }

  // --- Student check ---
  if (eligibility.is_student) {
    totalChecks++;
    const userStudent = profile.is_student || extra.is_student || (extra.primary_role === 'Student' ? 'Yes' : 'No');
    if (userStudent === 'Yes' || userStudent === true || userStudent === 1) {
      passedChecks++;
      reasons.push('Student status matches');
    } else {
      hardFail = true;
      reasons.push('Scheme requires applicant to be a student');
    }
  }

  // --- Business Owner check ---
  if (eligibility.is_business_owner) {
    totalChecks++;
    const userBiz = profile.is_business_owner || extra.is_business_owner || (extra.primary_role === 'Business Owner / Self-Employed' ? 'Yes' : 'No');
    if (userBiz === 'Yes' || userBiz === true || userBiz === 1) {
      passedChecks++;
      reasons.push('Business owner status matches');
    } else {
      hardFail = true;
      reasons.push('Scheme requires applicant to be a business owner');
    }
  }

  // --- Minority check ---
  if (eligibility.is_minority) {
    totalChecks++;
    const userMin = profile.is_minority || extra.is_minority;
    if (userMin === 'Yes' || userMin === true || userMin === 1) {
      passedChecks++;
      reasons.push('Minority status matches');
    } else {
      hardFail = true;
      reasons.push('Scheme requires applicant to belong to a minority community');
    }
  }

  // --- Ex-Serviceman check ---
  if (eligibility.is_ex_serviceman) {
    totalChecks++;
    const userEx = profile.is_ex_serviceman || extra.is_ex_serviceman;
    if (userEx === 'Yes' || userEx === true || userEx === 1) {
      passedChecks++;
      reasons.push('Ex-serviceman status matches');
    } else {
      hardFail = true;
      reasons.push('Scheme requires applicant to be an ex-serviceman');
    }
  }

  // --- Aadhaar check ---
  if (eligibility.requires_aadhaar) {
    totalChecks++;
    const userAadhaar = profile.has_aadhaar || extra.has_aadhaar;
    if (userAadhaar === 'Yes' || userAadhaar === true || userAadhaar === 1) {
      passedChecks++;
      reasons.push('Aadhaar card available');
    } else {
      hardFail = true;
      reasons.push('Scheme requires an Aadhaar card');
    }
  }

  // --- Bank Account check ---
  if (eligibility.requires_bank_account) {
    totalChecks++;
    const userBank = profile.has_bank_account || extra.has_bank_account;
    if (userBank === 'Yes' || userBank === true || userBank === 1) {
      passedChecks++;
      reasons.push('Bank account available');
    } else {
      hardFail = true;
      reasons.push('Scheme requires a bank account');
    }
  }

  // If no eligibility criteria set, the scheme is open to all
  if (totalChecks === 0) {
    return { eligible: true, score: 75, reasons: ['Open to all eligible citizens'] };
  }

  if (hardFail) {
    return { eligible: false, score: 0, reasons };
  }

  const score = Math.round((passedChecks / totalChecks) * 100);
  return { eligible: score >= 50, score, reasons };
}

// --- USER PROFILE API ---
app.post('/api/profile', async (req, res) => {
  try {
    const { username, full_name, age, gender, has_disability, disability_type, disability_percentage, state, district, category, family_income, education_level, udid_number, extra_fields } = req.body;

    if (!username || !full_name) {
      return res.status(400).json({ error: 'Username and full name are required' });
    }

    const extraFieldsStr = typeof extra_fields === 'object' ? JSON.stringify(extra_fields) : extra_fields;

    const sql = `INSERT INTO user_profiles (username, full_name, age, gender, has_disability, disability_type, disability_percentage, state, district, category, family_income, education_level, udid_number, extra_fields, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, CURRENT_TIMESTAMP)
      ON CONFLICT(username) DO UPDATE SET
        full_name=excluded.full_name, age=excluded.age, gender=excluded.gender,
        has_disability=excluded.has_disability, disability_type=excluded.disability_type,
        disability_percentage=excluded.disability_percentage, state=excluded.state,
        district=excluded.district, category=excluded.category,
        family_income=excluded.family_income, education_level=excluded.education_level,
        udid_number=excluded.udid_number, extra_fields=excluded.extra_fields, updated_at=CURRENT_TIMESTAMP RETURNING id`;

    const result = await db.query(sql, [
      username, 
      full_name, 
      age || null, 
      gender || null, 
      has_disability ? 1 : 0, 
      disability_type || null, 
      disability_percentage || 0, 
      state || null, 
      district || null, 
      category || null, 
      family_income || null, 
      education_level || null, 
      udid_number || null, 
      extraFieldsStr || null
    ]);
    res.json({ message: 'Profile saved successfully', id: result.rows[0]?.id || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/profile/:username', async (req, res) => {
  try {
    const username = req.params.username;
    const adminResult = await db.query('SELECT username, email, password, full_name FROM admins WHERE username = $1 OR email = $2', [username, username]);
    const admin = adminResult.rows[0];
    if (admin) {
      return res.json({
        username: admin.username,
        email: admin.email || '',
        full_name: admin.full_name || 'Admin',
        password: admin.password
      });
    }

    const userResult = await db.query('SELECT u.username, u.email, u.is_suspended, p.* FROM users u LEFT JOIN user_profiles p ON u.username = p.username WHERE u.username = $1', [username]);
    const user = userResult.rows[0];
    if (user) {
      if (user.is_suspended === 1) {
        return res.status(403).json({ error: 'suspended', message: 'Your account has been suspended by the administrator.' });
      }
      return res.json(user);
    }

    // Fallback for Supabase users who don't exist in the local public users table yet
    const profileResult = await db.query('SELECT * FROM user_profiles WHERE username = $1', [username]);
    const profile = profileResult.rows[0];
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    res.json({ username, email: '', password: '', is_suspended: 0, ...profile });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- REVIEW QUEUE API ---
app.get('/api/review', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM review_queue ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/review', async (req, res) => {
  try {
    const { headline, content, name, source_url, source_name, ai_confidence, ai_reason, verification_status, official_portal } = req.body;
    const sql = `INSERT INTO review_queue (headline, content, name, source_url, source_name, ai_confidence, ai_reason, verification_status, official_portal) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`;
    
    const result = await db.query(
      sql, 
      [
        headline || '', 
        content || null, 
        name || null, 
        source_url || null, 
        source_name || null, 
        ai_confidence || 0, 
        ai_reason || null, 
        verification_status || null, 
        official_portal || null
      ]
    );
    res.json({ id: result.rows[0].id, ...req.body });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/review/:id', async (req, res) => {
  try {
    const result = await db.query('DELETE FROM review_queue WHERE id = $1', [req.params.id]);
    res.json({ deleted: result.rowCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- AUTH API ---
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.status(400).json({ error: 'All fields are required' });

    const result = await db.query(`INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id`, [username, email, password]);
    res.json({ message: 'User registered successfully', userId: result.rows[0].id, role: 'user' });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed') || err.message.includes('duplicate key') || err.code === '23505') {
      return res.status(400).json({ error: 'Username or Email already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Check admin first
    const adminResult = await db.query('SELECT * FROM admins WHERE (username = $1 OR email = $2) AND password = $3', [username, username, password]);
    const admin = adminResult.rows[0];
    if (admin) {
      return res.json({ token: 'mock-admin-token-123', role: 'admin', user: { username: admin.username } });
    }

    // Check user
    const userResult = await db.query('SELECT * FROM users WHERE username = $1 AND password = $2', [username, password]);
    const user = userResult.rows[0];
    if (user) {
      if (user.is_suspended === 1) {
        return res.status(403).json({ error: 'Your account has been suspended by the administrator.' });
      }
      return res.json({ token: 'mock-user-token-123', role: 'user', user: { username, email: user.email } });
    }
    res.status(401).json({ error: 'Invalid username or password' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- USERS API ---
app.get('/api/users', async (req, res) => {
  try {
    const result = await db.query('SELECT id, username, email, is_suspended, created_at FROM users ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/users/count', async (req, res) => {
  try {
    const result = await db.query('SELECT COUNT(*) as count FROM users');
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/users/:id/suspend', async (req, res) => {
  try {
    const { suspend } = req.body;
    await db.query('UPDATE users SET is_suspended = $1 WHERE id = $2', [suspend ? 1 : 0, req.params.id]);
    res.json({ message: `User ${suspend ? 'suspended' : 'activated'} successfully` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/users/update', async (req, res) => {
  try {
    const { currentUsername, username, email, password, full_name } = req.body;
    
    if (!currentUsername || !username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    // Check if admin
    const adminCheck = await db.query('SELECT * FROM admins WHERE username = $1 OR email = $2', [currentUsername, currentUsername]);
    const admin = adminCheck.rows[0];
    
    if (admin) {
      let adminSql = 'UPDATE admins SET username = $1, email = $2, full_name = $3';
      let adminParams = [username, email || '', full_name || ''];
      let paramIndex = 4;
      if (password) {
        adminSql += `, password = $${paramIndex++}`;
        adminParams.push(password);
      }
      adminSql += ` WHERE username = $${paramIndex++} OR email = $${paramIndex++}`;
      adminParams.push(currentUsername, currentUsername);

      await db.query(adminSql, adminParams);
      res.json({ message: 'Admin profile updated successfully', newUsername: username, newEmail: email || '' });
    } else {
      if (!email) return res.status(400).json({ error: 'Email is required' });

      // Check if new username or email already exists (if changing)
      const existingUserCheck = await db.query('SELECT * FROM users WHERE (username = $1 OR email = $2) AND username != $3', [username, email, currentUsername]);
      if (existingUserCheck.rows[0]) return res.status(400).json({ error: 'Username or Email already taken' });

      // Update users table
      let userSql = 'UPDATE users SET username = $1, email = $2';
      let userParams = [username, email];
      let paramIndex = 3;
      
      if (password) {
        userSql += `, password = $${paramIndex++}`;
        userParams.push(password);
      }
      userSql += ` WHERE username = $${paramIndex++}`;
      userParams.push(currentUsername);

      const userUpdateResult = await db.query(userSql, userParams);
      if (userUpdateResult.rowCount === 0) return res.status(404).json({ error: 'User not found' });

      // Update user_profiles table (username and full_name)
      await db.query('UPDATE user_profiles SET username = $1, full_name = $2 WHERE username = $3', [username, full_name || '', currentUsername]);
      res.json({ message: 'Profile updated successfully', newUsername: username, newEmail: email });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =====================================================
// AI ASSISTANT — PROXY ENDPOINTS
// These proxy GNews + AI calls to avoid browser CORS issues
// =====================================================

const GNEWS_API_KEY = process.env.GNEWS_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// --- Fetch news articles ---
app.get('/api/ai/news', async (req, res) => {
  const QUERY_POOL = [
    'India government scheme launched',
    'India new yojana subsidy announced',
    'India scholarship welfare program',
    'pradhan mantri new scheme benefit',
    'India government benefit registration',
    'central government yojana eligibility',
    'India ministry scheme announcement',
    'state government new scheme subsidy',
    'India financial assistance program',
    'India pension scheme welfare update',
    'India farmers scheme kisan yojana',
    'India women empowerment scheme benefit',
    'India housing scheme loan subsidy',
    'India healthcare scheme insurance',
    'India education scholarship grant',
  ];

  // Pick 3 random queries
  const shuffled = [...QUERY_POOL].sort(() => Math.random() - 0.5);
  const queries = shuffled.slice(0, 3);

  const allArticles = [];

  for (const q of queries) {
    try {
      const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(q)}&lang=en&country=in&max=10&apikey=${GNEWS_API_KEY}`;
      const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!response.ok) {
        console.warn(`[AI News] GNews returned ${response.status} for: "${q}"`);
        continue;
      }
      const data = await response.json();
      if (data.articles) {
        for (const a of data.articles) {
          allArticles.push({
            title: a.title,
            content: a.description || a.content || '',
            url: a.url,
            source: a.source?.name || 'Unknown',
            publishedAt: a.publishedAt,
            image: a.image,
          });
        }
      }
    } catch (err) {
      console.warn(`[AI News] GNews fetch failed for: "${q}"`, err.message);
    }
  }

  // De-duplicate by URL
  const seen = new Set();
  const unique = allArticles.filter((a) => {
    if (seen.has(a.url)) return false;
    seen.add(a.url);
    return true;
  });

  // Sort newest first
  unique.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

  if (unique.length > 0) {
    console.log(`[AI News] Fetched ${unique.length} unique articles from GNews`);
    return res.json({ source: 'gnews', articles: unique });
  }

  // Fallback: PIB RSS
  try {
    const rssUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent('https://pib.gov.in/RssFeed.aspx?MenuId=2&Lang=1&RegDtFrom=&RegDtTo=')}&_cb=${Date.now()}`;
    const rssRes = await fetch(rssUrl, { signal: AbortSignal.timeout(5000) });
    if (rssRes.ok) {
      const rssData = await rssRes.json();
      if (rssData.items && rssData.items.length > 0) {
        const articles = rssData.items.slice(0, 10).map((item) => ({
          title: item.title,
          content: (item.description || item.content || '').replace(/<[^>]*>/g, ''),
          url: item.link,
          source: 'PIB India (Press Information Bureau)',
          publishedAt: item.pubDate,
          image: item.thumbnail || null,
        }));
        console.log(`[AI News] Fetched ${articles.length} articles from PIB RSS`);
        return res.json({ source: 'pib_rss', articles });
      }
    }
  } catch (err) {
    console.warn('[AI News] PIB RSS failed:', err.message);
  }

  console.warn('[AI News] All sources failed, returning empty');
  res.json({ source: 'none', articles: [] });
});

// --- AI Analysis of a headline ---
app.post('/api/ai/analyze', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'prompt is required' });

  // Try Gemini first
  if (GEMINI_API_KEY) {
    try {
      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.1, maxOutputTokens: 500 },
          }),
          signal: AbortSignal.timeout(10000),
        }
      );
      if (geminiRes.ok) {
        const data = await geminiRes.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (rawText) {
          return res.json({ source: 'gemini', text: rawText });
        }
      } else {
        console.warn(`[AI Analyze] Gemini returned ${geminiRes.status}`);
      }
    } catch (err) {
      console.warn('[AI Analyze] Gemini failed:', err.message);
    }
  }

  // Try OpenRouter
  if (OPENROUTER_API_KEY) {
    try {
      const orRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'openrouter/free',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.1,
          max_tokens: 500,
        }),
        signal: AbortSignal.timeout(12000),
      });
      if (orRes.ok) {
        const data = await orRes.json();
        const rawText = data?.choices?.[0]?.message?.content || '';
        if (rawText) {
          return res.json({ source: 'openrouter', text: rawText });
        }
      } else {
        console.warn(`[AI Analyze] OpenRouter returned ${orRes.status}`);
      }
    } catch (err) {
      console.warn('[AI Analyze] OpenRouter failed:', err.message);
    }
  }

  // Both failed
  console.warn('[AI Analyze] All AI providers failed');
  res.json({ source: 'none', text: '' });
});

// =====================================================
// SCRAPER LOGS API
// =====================================================

app.get('/api/scraper/logs', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM scraper_logs ORDER BY started_at DESC LIMIT 20');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/scraper/trigger', async (req, res) => {
  try {
    // Mocking a scraper trigger event
    const sources = ['MyScheme.gov.in', 'India.gov.in', 'PIB.gov.in', 'National Scholarship Portal'];
    const source = sources[Math.floor(Math.random() * sources.length)];
    const found = Math.floor(Math.random() * 10);
    const updated = Math.floor(Math.random() * 5);
    const statuses = ['SUCCESS', 'SUCCESS', 'SUCCESS', 'FAILED'];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const errMsg = status === 'FAILED' ? 'Connection timeout' : null;

    const result = await db.query(
      'INSERT INTO scraper_logs (source_name, status, schemes_found, schemes_updated, error_message, completed_at) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP) RETURNING id',
      [source, status, found, updated, errMsg]
    );
    res.json({ message: 'Scrape job completed successfully', logId: result.rows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
