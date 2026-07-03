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
  pool,
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

    // Seed default schemes if schemes table is empty
    try {
      const schemesCheck = await pool.query("SELECT COUNT(*) as count FROM schemes");
      if (parseInt(schemesCheck.rows[0].count) === 0) {
        const defaultSchemes = [
          {
            name: 'Post Matric Scholarship for OBC Students',
            ministry: 'Ministry of Social Justice and Empowerment',
            scheme_type: 'Scholarship',
            benefits: 'Financial assistance to OBC students studying at post-matriculation or post-secondary stage.',
            description: 'The objective of the scheme is to provide financial assistance to the OBC students studying at post-matriculation or post-secondary stage to enable them to complete their education. These scholarships shall be available for studies in India only and will be awarded by the Government of State/Union Territory to which the applicant actually belongs.',
            apply_link: 'https://scholarships.gov.in',
            required_documents: '["Aadhaar Card", "Income Certificate", "OBC Caste Certificate", "Previous Year Marksheet"]',
            last_date: '2026-12-31',
            is_active: 1,
            eligibility: '{"min_age":15,"categories":["OBC"],"max_family_income":250000}',
            source_url: 'https://scholarships.gov.in'
          },
          {
            name: 'PM Kisan Samman Nidhi',
            ministry: 'Ministry of Agriculture and Farmers Welfare',
            scheme_type: 'Financial Assistance',
            benefits: 'Income support of Rs. 6000/- per year in three equal installments will be provided to small and marginal farmer families.',
            description: 'Under the scheme an income support of 6000/- per year in three equal installments will be provided to all land holding farmer families. State Government and UT administration will identify the farmer families which are eligible for support as per scheme guidelines. The fund will be directly transferred to the bank accounts of the beneficiaries.',
            apply_link: 'https://pmkisan.gov.in',
            required_documents: '["Aadhaar Card", "Land Ownership Documents", "Bank Account Details"]',
            last_date: 'Ongoing',
            is_active: 1,
            eligibility: '{"min_age":18,"categories":["General","SC","ST","OBC"],"max_family_income":500000,"is_farmer":true}',
            source_url: 'https://pmkisan.gov.in'
          },
          {
            name: 'Pre-Matric Scholarship for SC Students',
            ministry: 'Ministry of Social Justice and Empowerment',
            scheme_type: 'Scholarship',
            benefits: 'Financial assistance to SC students studying in classes IX and X.',
            description: 'The objective of the scheme is to support parents of SC children for education of their wards studying in classes IX and X so that the incidence of drop-out, especially in the transition from the elementary to the secondary stage is minimized, and to improve participation of SC children in classes IX and X of the Pre-Matric stage, so that they perform better and have a better chance of progressing to the Post-Matric stage of education.',
            apply_link: 'https://scholarships.gov.in',
            required_documents: '["Aadhaar Card", "Income Certificate", "SC Caste Certificate", "School ID Card"]',
            last_date: '2026-12-31',
            is_active: 1,
            eligibility: '{"min_age":10,"max_age":16,"categories":["SC"],"max_family_income":250000,"is_student":true}',
            source_url: 'https://scholarships.gov.in'
          },
          {
            name: 'Atal Pension Yojana',
            ministry: 'Ministry of Finance',
            scheme_type: 'Pension',
            benefits: 'Guaranteed minimum pension of Rs. 1,000/- to 5,000/- per month will be given at the age of 60 years depending on the contributions by the subscribers.',
            description: 'Atal Pension Yojana (APY) is a pension scheme for citizens of India focused on the unorganized sector workers. Under the APY, guaranteed minimum pension of Rs. 1,000/- to 5,000/- per month will be given at the age of 60 years depending on the contributions by the subscribers. The Central Government would also co-contribute 50% of the total contribution or Rs. 1000 per annum, whichever is lower, to each eligible subscriber account, for a period of 5 years.',
            apply_link: 'https://enps.nsdl.com/eNPS/NationalPensionSystem.html',
            required_documents: '["Aadhaar Card", "Bank Account Passbook", "Mobile Number"]',
            last_date: 'Ongoing',
            is_active: 1,
            eligibility: '{"min_age":18,"max_age":40,"categories":["General","SC","ST","OBC"]}',
            source_url: 'https://enps.nsdl.com/eNPS/NationalPensionSystem.html'
          },
          {
            name: 'Sukanya Samriddhi Yojana',
            ministry: 'Ministry of Finance',
            scheme_type: 'Financial Assistance',
            benefits: 'A savings scheme aimed at the betterment of girl children in the country.',
            description: 'Sukanya Samriddhi Yojana (SSY) is a small deposit scheme of the Government of India meant exclusively for a girl child and is launched as a part of Beti Bachao Beti Padhao Campaign. The scheme is meant to meet the education and marriage expenses of a girl child. A Sukanya Samriddhi Account can be opened any time after the birth of a girl till she turns 10, with a minimum deposit of Rs 250.',
            apply_link: 'https://www.indiapost.gov.in/Financial/Pages/Content/Post-Office-Saving-Schemes.aspx',
            required_documents: '["Birth Certificate of Girl Child", "Aadhaar Card of Parent/Guardian", "Address Proof"]',
            last_date: 'Ongoing',
            is_active: 1,
            eligibility: '{"gender":"Female","max_age":10,"categories":["General","SC","ST","OBC"]}',
            source_url: 'https://www.indiapost.gov.in/Financial/Pages/Content/Post-Office-Saving-Schemes.aspx'
          }
        ];

        for (const scheme of defaultSchemes) {
          await pool.query(
            `INSERT INTO schemes (name, description, benefits, required_documents, apply_link, last_date, ministry, scheme_type, is_active, eligibility, source_url) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
            [
              scheme.name,
              scheme.description,
              scheme.benefits,
              scheme.required_documents,
              scheme.apply_link,
              scheme.last_date,
              scheme.ministry,
              scheme.scheme_type,
              scheme.is_active,
              scheme.eligibility,
              scheme.source_url
            ]
          );
        }
        console.log('Seeded default schemes successfully.');
      }
    } catch (e) {
      console.warn('Warning: Could not seed default schemes:', e.message);
    }

    // 7. Migration: Ensure all columns exist in schemes, review_queue, and user_profiles tables
    try {
      await pool.query("ALTER TABLE schemes ADD COLUMN IF NOT EXISTS name TEXT");
      await pool.query("ALTER TABLE schemes ADD COLUMN IF NOT EXISTS description TEXT");
      await pool.query("ALTER TABLE schemes ADD COLUMN IF NOT EXISTS benefits TEXT");
      await pool.query("ALTER TABLE schemes ADD COLUMN IF NOT EXISTS required_documents TEXT");
      await pool.query("ALTER TABLE schemes ADD COLUMN IF NOT EXISTS apply_link TEXT");
      await pool.query("ALTER TABLE schemes ADD COLUMN IF NOT EXISTS last_date TEXT");
      await pool.query("ALTER TABLE schemes ADD COLUMN IF NOT EXISTS ministry TEXT");
      await pool.query("ALTER TABLE schemes ADD COLUMN IF NOT EXISTS scheme_type TEXT");
      await pool.query("ALTER TABLE schemes ADD COLUMN IF NOT EXISTS is_active SMALLINT DEFAULT 1");
      await pool.query("ALTER TABLE schemes ADD COLUMN IF NOT EXISTS eligibility TEXT");
      await pool.query("ALTER TABLE schemes ADD COLUMN IF NOT EXISTS source_url TEXT DEFAULT ''");
      console.log('Ensured all schemes table columns exist.');
    } catch (e) {
      console.warn('Warning: Could not run schemes table column migrations:', e.message);
    }

    try {
      await pool.query("ALTER TABLE review_queue ADD COLUMN IF NOT EXISTS headline TEXT");
      await pool.query("ALTER TABLE review_queue ADD COLUMN IF NOT EXISTS content TEXT");
      await pool.query("ALTER TABLE review_queue ADD COLUMN IF NOT EXISTS name TEXT");
      await pool.query("ALTER TABLE review_queue ADD COLUMN IF NOT EXISTS source_url TEXT");
      await pool.query("ALTER TABLE review_queue ADD COLUMN IF NOT EXISTS source_name TEXT");
      await pool.query("ALTER TABLE review_queue ADD COLUMN IF NOT EXISTS ai_confidence INTEGER");
      await pool.query("ALTER TABLE review_queue ADD COLUMN IF NOT EXISTS ai_reason TEXT");
      await pool.query("ALTER TABLE review_queue ADD COLUMN IF NOT EXISTS verification_status TEXT");
      await pool.query("ALTER TABLE review_queue ADD COLUMN IF NOT EXISTS official_portal TEXT");
      console.log('Ensured all review_queue table columns exist.');
    } catch (e) {
      console.warn('Warning: Could not run review_queue table column migrations:', e.message);
    }

    try {
      await pool.query("ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS username TEXT");
      await pool.query("ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS full_name TEXT");
      await pool.query("ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS age INTEGER");
      await pool.query("ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS gender TEXT");
      await pool.query("ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS has_disability SMALLINT DEFAULT 0");
      await pool.query("ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS disability_type TEXT");
      await pool.query("ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS disability_percentage INTEGER DEFAULT 0");
      await pool.query("ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS state TEXT");
      await pool.query("ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS district TEXT");
      await pool.query("ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS category TEXT");
      await pool.query("ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS family_income REAL");
      await pool.query("ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS education_level TEXT");
      await pool.query("ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS udid_number TEXT");
      await pool.query("ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS extra_fields TEXT");
      console.log('Ensured all user_profiles table columns exist.');
    } catch (e) {
      console.warn('Warning: Could not run user_profiles table column migrations:', e.message);
    }

    // 8. Migration: Ensure password column is nullable in existing databases
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
