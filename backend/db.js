const { Pool } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const connectionString = process.env.DATABASE_URL;

if (!connectionString || connectionString.includes('your-project-ref')) {
  console.warn(
    'WARNING: Database connection string (DATABASE_URL) is not set or using placeholder in backend/.env. Please configure it.'
  );
}

// Configure pg connection pool
const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Helper: Convert SQLite ? parameter placeholders to PostgreSQL $1, $2, $3...
function convertSql(sql) {
  let index = 1;
  return sql.replace(/\?/g, () => `$${index++}`);
}

// Wrapper object mimicking sqlite3 Database API
const db = {
  // Query multiple rows: db.all(sql, params, callback)
  all(sql, params = [], callback) {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    if (!Array.isArray(params)) {
      params = [params];
    }

    const converted = convertSql(sql);
    pool
      .query(converted, params)
      .then((res) => {
        if (callback) callback(null, res.rows);
      })
      .catch((err) => {
        console.error('[DB all Error]:', err.message, '\nQuery:', sql, '\nParams:', params);
        if (callback) callback(err, null);
      });
  },

  // Query a single row: db.get(sql, params, callback)
  get(sql, params = [], callback) {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    if (!Array.isArray(params)) {
      params = [params];
    }

    const converted = convertSql(sql);
    pool
      .query(converted, params)
      .then((res) => {
        const row = res.rows[0] || null;
        if (callback) callback(null, row);
      })
      .catch((err) => {
        console.error('[DB get Error]:', err.message, '\nQuery:', sql, '\nParams:', params);
        if (callback) callback(err, null);
      });
  },

  // Execute queries (insert, update, delete): db.run(sql, params, callback)
  // Inside callback, "this" context includes lastID and changes
  run(sql, params = [], callback) {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    if (!Array.isArray(params)) {
      params = [params];
    }

    let converted = convertSql(sql);
    const isInsert = converted.trim().toLowerCase().startsWith('insert');

    // Emulate lastID in PostgreSQL by adding RETURNING id if it's an INSERT statement
    if (isInsert && !converted.toLowerCase().includes('returning')) {
      converted += ' RETURNING id';
    }

    pool
      .query(converted, params)
      .then((res) => {
        const lastID = isInsert && res.rows[0] ? res.rows[0].id : null;
        const changes = res.rowCount;
        const context = { lastID, changes };
        if (callback) callback.call(context, null);
      })
      .catch((err) => {
        console.error('[DB run Error]:', err.message, '\nQuery:', sql, '\nParams:', params);
        if (callback) callback.call({}, err);
      });
  },
};

// Initialize database schema (PostgreSQL dialect)
async function initDb() {
  try {
    // 1. Schemes table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schemes (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        benefits TEXT,
        required_documents TEXT,
        apply_link TEXT,
        last_date TEXT,
        ministry TEXT,
        scheme_type TEXT,
        is_active SMALLINT DEFAULT 1,
        eligibility TEXT,
        source_url TEXT DEFAULT ''
      )
    `);

    // 2. Review Queue table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS review_queue (
        id SERIAL PRIMARY KEY,
        headline TEXT NOT NULL,
        content TEXT,
        name TEXT,
        source_url TEXT,
        source_name TEXT,
        ai_confidence INTEGER,
        ai_reason TEXT,
        verification_status TEXT,
        official_portal TEXT,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 3. Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT DEFAULT '',
        is_suspended SMALLINT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 4. Scraper Logs table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS scraper_logs (
        id SERIAL PRIMARY KEY,
        source_name TEXT NOT NULL,
        status TEXT NOT NULL,
        schemes_found INTEGER DEFAULT 0,
        schemes_updated INTEGER DEFAULT 0,
        error_message TEXT,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP
      )
    `);

    // 5. User Profiles table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_profiles (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        full_name TEXT NOT NULL,
        age INTEGER,
        gender TEXT,
        has_disability SMALLINT DEFAULT 0,
        disability_type TEXT,
        disability_percentage INTEGER DEFAULT 0,
        state TEXT,
        district TEXT,
        category TEXT,
        family_income REAL,
        education_level TEXT,
        udid_number TEXT,
        extra_fields TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 6. Admins table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        email TEXT,
        full_name TEXT
      )
    `);

    // Seed default admin if not exists
    const adminCheck = await pool.query("SELECT * FROM admins WHERE username = 'admin'");
    if (adminCheck.rows.length === 0) {
      await pool.query(
        "INSERT INTO admins (username, password, email, full_name) VALUES ('admin', 'admin@123', 'admin@example.com', 'System Admin')"
      );
      console.log('Seeded default admin user successfully.');
    }

    // 7. Migration: Ensure password column is nullable in existing databases
    try {
      await pool.query('ALTER TABLE users ALTER COLUMN password DROP NOT NULL');
      await pool.query("ALTER TABLE users ALTER COLUMN password SET DEFAULT ''");
    } catch (e) {
      // Ignored if table already updated or doesn't support ALTER
    }

    // 8. Supabase Auth Sync Trigger & Function
    try {
      // Create the trigger handler function in the public schema
      await pool.query(`
        CREATE OR REPLACE FUNCTION public.handle_new_user()
        RETURNS trigger AS $$
        BEGIN
          INSERT INTO public.users (username, email, password, is_suspended)
          VALUES (
            COALESCE(new.raw_user_meta_data->>'username', new.email),
            new.email,
            '',
            0
          )
          ON CONFLICT (username) DO NOTHING;
          
          INSERT INTO public.user_profiles (username, full_name, updated_at)
          VALUES (
            COALESCE(new.raw_user_meta_data->>'username', new.email),
            COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'username', new.email),
            now()
          )
          ON CONFLICT (username) DO NOTHING;

          RETURN new;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `);

      // Attach trigger to the auth.users table (which contains Supabase registrations)
      await pool.query('DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;');
      await pool.query(`
        CREATE TRIGGER on_auth_user_created
          AFTER INSERT ON auth.users
          FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
      `);
      console.log('Configured Supabase auth.users sync trigger successfully.');
    } catch (e) {
      console.warn('Warning: Could not configure Supabase sync trigger (this is normal if not running on Supabase with admin permissions):', e.message);
    }

    // 9. Backfill any existing users from auth.users to public tables
    try {
      await pool.query(`
        INSERT INTO public.users (username, email, password, is_suspended)
        SELECT 
          COALESCE(raw_user_meta_data->>'username', email),
          email,
          '',
          0
        FROM auth.users
        ON CONFLICT (username) DO NOTHING;
      `);
      await pool.query(`
        INSERT INTO public.user_profiles (username, full_name, updated_at)
        SELECT 
          COALESCE(raw_user_meta_data->>'username', email),
          COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'username', email),
          now()
        FROM auth.users
        ON CONFLICT (username) DO NOTHING;
      `);
      console.log('Synced existing users from auth.users successfully.');
    } catch (e) {
      // Ignored if auth.users is not queryable directly
    }

    console.log('Database initialized successfully.');
  } catch (err) {
    console.error('Error during database initialization:', err.message);
  }
}

// Self-initialize the database connection and schema on script load
if (connectionString && !connectionString.includes('your-project-ref')) {
  initDb();
}

module.exports = db;
