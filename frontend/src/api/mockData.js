export const MOCK_USERS = {
  'user@demo.com': {
    password: 'password123',
    profile: {
      id: 1,
      username: 'DemoUser',
      email: 'user@demo.com',
      is_admin: false,
      is_staff: false,
      is_superuser: false,
    }
  },
  'admin@demo.com': {
    password: 'adminpassword',
    profile: {
      id: 2,
      username: 'AdminUser',
      email: 'admin@demo.com',
      is_admin: true,
      is_staff: true,
      is_superuser: true,
    }
  }
};

export const MOCK_SCHEMES = [
  {
    id: 1,
    name: 'National Scholarship Portal (NSP)',
    scheme_type: 'Scholarship',
    benefits: 'Financial assistance for meritorious students from minority communities.',
    ministry: 'Ministry of Minority Affairs',
    last_date: '2027-12-31'
  },
  {
    id: 2,
    name: 'Pradhan Mantri Jan Dhan Yojana (PMJDY)',
    scheme_type: 'Financial Assistance',
    benefits: 'Access to banking facilities with zero balance and accidental insurance cover.',
    ministry: 'Ministry of Finance',
    last_date: '2028-06-30'
  },
  {
    id: 3,
    name: 'Atal Pension Yojana (APY)',
    scheme_type: 'Pension',
    benefits: 'Guaranteed minimum pension of Rs. 1000 to Rs. 5000 per month after 60 years of age.',
    ministry: 'Ministry of Finance',
    last_date: null
  },
  {
    id: 4,
    name: 'PM Kisan Samman Nidhi',
    scheme_type: 'Financial Assistance',
    benefits: 'Rs. 6000 per year given to eligible farmer families.',
    ministry: 'Ministry of Agriculture and Farmers Welfare',
    last_date: '2026-10-31'
  },
  {
    id: 5,
    name: 'Deen Dayal Upadhyaya Grameen Kaushalya Yojana',
    scheme_type: 'Skill Training',
    benefits: 'Skill training programs for rural youth to secure jobs.',
    ministry: 'Ministry of Rural Development',
    last_date: null
  },
  {
    id: 6,
    name: 'Stand-Up India Scheme',
    scheme_type: 'Employment',
    benefits: 'Bank loans between 10 lakh and 1 crore for SC/ST and women borrowers.',
    ministry: 'Ministry of Finance',
    last_date: '2027-03-31'
  }
];

export const MOCK_ALL_USERS = [
  { id: 1, username: 'DemoUser', email: 'user@demo.com', date_joined: '2026-06-01' },
  { id: 2, username: 'AdminUser', email: 'admin@demo.com', date_joined: '2026-06-01' },
  { id: 3, username: 'TestUser', email: 'test@example.com', date_joined: '2026-06-15' }
];

export function setupAxiosMock(axiosInstance) {
  // Store the original adapter
  const originalAdapter = axiosInstance.defaults.adapter;

  axiosInstance.defaults.adapter = async (config) => {
    const { url, method, data } = config;

    console.log(`[Mock API] ${method.toUpperCase()} ${url}`);

    const parseData = () => {
      try {
        return data ? JSON.parse(data) : {};
      } catch {
        return {};
      }
    };

    const respond = (status, responseData) => {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          if (status >= 200 && status < 300) {
            resolve({
              data: responseData,
              status,
              statusText: 'OK',
              headers: {},
              config,
              request: {}
            });
          } else {
            reject({
              response: {
                data: responseData,
                status,
                statusText: 'Error',
                headers: {},
                config,
                request: {}
              }
            });
          }
        }, 500); // 500ms delay to simulate network
      });
    };

    // --- Mock Endpoints ---

    // 1. Auth Login
    if (url === '/auth/login/' && method.toLowerCase() === 'post') {
      const { email, password } = parseData();
      const userEntry = MOCK_USERS[email];
      
      if (userEntry && userEntry.password === password) {
        return respond(200, {
          access: `mock_access_token_${email}`,
          refresh: `mock_refresh_token_${email}`
        });
      }
      return respond(401, { detail: 'No active account found with the given credentials' });
    }

    // 2. Auth Register
    if (url === '/auth/register/' && method.toLowerCase() === 'post') {
      return respond(201, { message: 'User registered successfully' });
    }

    // 3. Auth Profile (me)
    if (url === '/auth/me/' && method.toLowerCase() === 'get') {
      const authHeader = config.headers.Authorization || '';
      if (authHeader.includes('admin@demo.com')) {
        return respond(200, MOCK_USERS['admin@demo.com'].profile);
      }
      if (authHeader.includes('user@demo.com')) {
        return respond(200, MOCK_USERS['user@demo.com'].profile);
      }
      // If we made it here, maybe just a default user mock or unauth
      if (authHeader) {
         return respond(200, MOCK_USERS['user@demo.com'].profile);
      }
      return respond(401, { detail: 'Unauthorized' });
    }

    // 4. Eligible Schemes
    if (url === '/schemes/eligible/' && method.toLowerCase() === 'get') {
      return respond(200, { results: MOCK_SCHEMES });
    }

    // Helper for demo custom schemes
    const getCustomSchemes = () => {
      try { return JSON.parse(localStorage.getItem('demoCustomSchemes') || '[]'); } catch { return []; }
    };

    // 5. All Schemes (Admin)
    if ((url === '/schemes/' || url === '/schemes/admin/') && method.toLowerCase() === 'get') {
      return respond(200, { results: [...MOCK_SCHEMES, ...getCustomSchemes()] });
    }

    // 6. Users list (Admin)
    if (url === '/auth/users/' && method.toLowerCase() === 'get') {
      return respond(200, { results: MOCK_ALL_USERS });
    }
    
    // 7. Stats (Admin)
    if (url === '/admin/stats/' && method.toLowerCase() === 'get') {
      return respond(200, {
        total_users: 1542,
        total_schemes: 245,
        recent_applications: 120
      });
    }

    // Fallback to original network request if not mocked
    console.warn(`[Mock API] Unmocked endpoint: ${url}`);
    
    // Simple fallback to 404 for unmocked in demo mode
    return respond(404, { detail: 'Not found (Mocked)' });
  };
}
