// =====================================================
// Government Scheme Scraper
// Fetches real scheme details from official portals
// Uses CORS proxies + HTML parsing + known schemes DB
// =====================================================

const CORS_PROXIES = [
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
];

// =====================================================
// 1. MAIN ENTRY: Scrape scheme details
// =====================================================
export async function scrapeSchemeDetails(schemeName, portalUrl) {
  const lower = (schemeName || '').toLowerCase();

  // Step 1: Check known schemes database first (instant, reliable)
  const knownScheme = findKnownScheme(lower);

  // Step 2: Try live scraping from the official portal
  let scrapedData = null;
  let scrapeError = null;

  if (portalUrl) {
    const liveResult = await tryLiveScrape(portalUrl);
    if (liveResult.success) {
      scrapedData = liveResult.data;
    } else {
      scrapeError = liveResult.reason;
    }
  }

  // Step 3: Try fetching from MyScheme.gov.in search
  let mySchemeData = null;
  if (!scrapedData && schemeName) {
    mySchemeData = await searchMyScheme(schemeName);
  }

  // If absolutely nothing was found and scraping failed
  if (!knownScheme && !scrapedData && !mySchemeData) {
    return {
      success: false,
      errorDetail: scrapeError || "No data could be scraped and scheme not found in known database.",
      url: portalUrl
    };
  }

  // Merge: live data > myscheme data > known scheme data
  const result = mergeSchemeData(knownScheme, scrapedData, mySchemeData, schemeName);
  result.success = true;
  if (scrapeError && !scrapedData) {
    result.warning = `Live scraping failed (${scrapeError}). Displaying fallback data.`;
  }
  return result;
}

// =====================================================
// 2. LIVE SCRAPE from official portal URL
// =====================================================
async function tryLiveScrape(url) {
  let lastError = "Could not connect to the target website through any CORS proxy.";
  for (const makeProxy of CORS_PROXIES) {
    try {
      const proxyUrl = makeProxy(url);
      const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(10000) });
      
      if (!res.ok) {
        if (res.status === 403) lastError = "Target website actively blocked the proxy (403 Forbidden). It likely has strict anti-bot protection or blocks outside IPs (common with State Gov portals).";
        else if (res.status === 404) lastError = "Page not found (404 Error).";
        else lastError = `Target returned HTTP Error: ${res.status}`;
        continue;
      }

      const html = await res.text();
      
      // Heuristic checks for blocked pages / captchas
      const lowerHtml = html.toLowerCase();
      if (lowerHtml.includes('cloudflare') || lowerHtml.includes('captcha') || lowerHtml.includes('verify you are human')) {
        return { success: false, reason: "Website requires CAPTCHA or Human Verification. Automated scraping is blocked by the portal's security." };
      }
      
      if (html.length < 500) {
         lastError = "Website returned empty or very short content. Might be an SPA (Single Page App) or a blocked request.";
         continue;
      }

      const parsed = parseSchemeHtml(html, url);
      if (!parsed) {
        return { success: false, reason: "Successfully fetched the page, but no scheme-related content (like eligibility, benefits, or text) was found in the HTML structure. The target might be a PDF link or an unstructured splash page." };
      }
      
      return { success: true, data: parsed };
    } catch (err) {
      if (err.name === 'TimeoutError') {
         lastError = "Request timed out. The target website is too slow or dropping connections.";
      } else {
         lastError = `Network proxy failed for ${url}: ${err.message}`;
      }
      console.warn(`[Scraper] ${lastError}`);
    }
  }
  return { success: false, reason: lastError };
}

// =====================================================
// 3. SEARCH MyScheme.gov.in
// =====================================================
async function searchMyScheme(schemeName) {
  try {
    const searchUrl = `https://www.myscheme.gov.in/search/${encodeURIComponent(schemeName)}`;
    for (const makeProxy of CORS_PROXIES) {
      try {
        const res = await fetch(makeProxy(searchUrl), { signal: AbortSignal.timeout(8000) });
        if (!res.ok) continue;
        const html = await res.text();
        if (html.length < 200) continue;

        // Try to find scheme cards in the search results
        const titleMatch = html.match(/<h[2-4][^>]*>([^<]*?(?:yojana|scheme|mission|nidhi)[^<]*?)<\/h[2-4]>/i);
        const descMatch = html.match(/<p[^>]*class="[^"]*desc[^"]*"[^>]*>([\s\S]*?)<\/p>/i)
          || html.match(/<div[^>]*class="[^"]*description[^"]*"[^>]*>([\s\S]*?)<\/div>/i);

        if (titleMatch || descMatch) {
          return {
            description: stripHtml(descMatch?.[1] || ''),
            source_url: searchUrl,
          };
        }
      } catch {
        continue;
      }
    }
  } catch (err) {
    console.warn('[Scraper] MyScheme search failed:', err.message);
  }
  return null;
}

// =====================================================
// 4. PARSE HTML from a government scheme page
// =====================================================
function parseSchemeHtml(html, sourceUrl) {
  const result = {
    source_url: sourceUrl,
  };

  // Extract page title
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch) result.pageTitle = stripHtml(titleMatch[1]).trim();

  // Extract meta description
  const metaDesc = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([\s\S]*?)["']/i);
  if (metaDesc) result.description = stripHtml(metaDesc[1]).trim();

  // Try to find common sections by keywords in headings
  const sections = extractSections(html);
  if (sections.eligibility) result.eligibility = sections.eligibility;
  if (sections.benefits) result.benefits = sections.benefits;
  if (sections.documents) result.documents = sections.documents;
  if (sections.howToApply) result.howToApply = sections.howToApply;
  if (sections.lastDate) result.lastDate = sections.lastDate;

  // Extract bullet points / list items as key features
  const listItems = [];
  const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
  let match;
  let count = 0;
  while ((match = liRegex.exec(html)) !== null && count < 20) {
    const text = stripHtml(match[1]).trim();
    if (text.length > 10 && text.length < 300) {
      listItems.push(text);
      count++;
    }
  }
  if (listItems.length > 0) result.keyPoints = listItems;

  return Object.keys(result).length > 1 ? result : null;
}

// =====================================================
// 5. EXTRACT SECTIONS from HTML by heading keywords
// =====================================================
function extractSections(html) {
  const sections = {};

  const sectionPatterns = [
    { key: 'eligibility', patterns: ['eligib', 'who can apply', 'criteria', 'qualification'] },
    { key: 'benefits', patterns: ['benefit', 'entitlement', 'what you get', 'assistance', 'incentive'] },
    { key: 'documents', patterns: ['document', 'required doc', 'papers needed', 'attachments'] },
    { key: 'howToApply', patterns: ['how to apply', 'application process', 'apply online', 'registration', 'procedure'] },
    { key: 'lastDate', patterns: ['last date', 'deadline', 'closing date', 'valid till'] },
  ];

  for (const sec of sectionPatterns) {
    for (const pattern of sec.patterns) {
      // Find heading containing the pattern
      const headingRegex = new RegExp(
        `<h[2-6][^>]*>[^<]*${pattern}[^<]*<\\/h[2-6]>([\\s\\S]*?)(?=<h[2-6]|<footer|$)`,
        'i'
      );
      const match = html.match(headingRegex);
      if (match) {
        const content = stripHtml(match[1]).trim();
        if (content.length > 5 && content.length < 2000) {
          sections[sec.key] = content;
          break;
        }
      }
    }
  }

  return sections;
}

// =====================================================
// 6. KNOWN SCHEMES DATABASE (full details)
// =====================================================
const KNOWN_SCHEMES = [
  {
    keywords: ['surya ghar', 'muft bijli', 'rooftop solar'],
    name: 'PM Surya Ghar Muft Bijli Yojana',
    ministry: 'Ministry of New & Renewable Energy',
    portalUrl: 'https://pmsuryaghar.gov.in',
    launchDate: 'February 2024',
    description: 'Provides subsidies for installing rooftop solar panels to generate free electricity for households. Aims to make 1 crore households solar-powered.',
    eligibility: [
      'Indian citizen with a residential property',
      'Must have a valid electricity connection',
      'Rooftop should be suitable for solar panel installation',
      'Available for all income groups',
    ],
    benefits: [
      'Subsidy up to ₹78,000 for installing rooftop solar panels',
      'Up to 300 units of free electricity per month',
      'Net metering: Sell excess electricity back to the grid',
      'Reduction in monthly electricity bills by 30-50%',
      '25 years of clean energy from solar panels',
    ],
    documents: [
      'Aadhaar Card',
      'Electricity bill (latest)',
      'Bank account details (for subsidy credit)',
      'Passport-size photograph',
      'Property ownership proof or NOC from owner',
    ],
    howToApply: 'Visit pmsuryaghar.gov.in → Register with your electricity consumer number → Apply online → Get feasibility check → Approved vendors install panels → Subsidy credited after installation verification.',
    amount: 'Up to ₹78,000 subsidy',
    beneficiaries: '1 Crore households (target)',
  },
  {
    keywords: ['ayushman bharat', 'pmjay', 'jan arogya', 'health insurance'],
    name: 'Ayushman Bharat - Pradhan Mantri Jan Arogya Yojana (AB-PMJAY)',
    ministry: 'Ministry of Health & Family Welfare',
    portalUrl: 'https://pmjay.gov.in',
    launchDate: 'September 2018',
    description: 'World\'s largest health insurance scheme providing free health cover of ₹5 lakh per family per year for secondary and tertiary care hospitalization.',
    eligibility: [
      'Families identified in SECC 2011 database',
      'All senior citizens aged 70+ (regardless of income, since 2024 expansion)',
      'No restriction on family size or age',
      'Both rural and urban poor families',
    ],
    benefits: [
      'Free health cover of ₹5 lakh per family per year',
      'Covers 1,929 medical/surgical procedures',
      'Cashless and paperless treatment at empanelled hospitals',
      'Pre and post hospitalization expenses covered',
      'No cap on age, gender, or family size',
      'Transport allowance included',
    ],
    documents: [
      'Aadhaar Card',
      'Ration Card',
      'PMJAY e-card (generated at empanelled hospital)',
      'Mobile number for OTP verification',
    ],
    howToApply: 'Check eligibility on pmjay.gov.in or mera.pmjay.gov.in → Visit nearest empanelled hospital or CSC center → Get Ayushman card generated → Avail cashless treatment.',
    amount: '₹5 Lakh health cover per family per year',
    beneficiaries: '55+ Crore citizens (approx 12 crore families)',
  },
  {
    keywords: ['pm kisan', 'kisan samman', 'kisan nidhi'],
    name: 'PM Kisan Samman Nidhi Yojana',
    ministry: 'Ministry of Agriculture & Farmers Welfare',
    portalUrl: 'https://pmkisan.gov.in',
    launchDate: 'February 2019',
    description: 'Direct income support of ₹6,000 per year to eligible farmer families, transferred in three equal installments.',
    eligibility: [
      'All landholding farmer families in the country',
      'Must have cultivable land (as per land records)',
      'Excludes: Institutional landholders, current/former MPs, MLAs, Ministers',
      'Excludes: Income tax payers, professionals (doctors, engineers, lawyers, CAs)',
    ],
    benefits: [
      '₹6,000 per year in 3 installments of ₹2,000 each',
      'Direct Bank Transfer (DBT) to farmer\'s account',
      'Installments: Apr-Jul, Aug-Nov, Dec-Mar',
      'No intermediaries — money goes directly to farmers',
    ],
    documents: [
      'Aadhaar Card (mandatory)',
      'Land ownership records',
      'Bank account with IFSC code',
      'Mobile number linked with Aadhaar',
    ],
    howToApply: 'Visit pmkisan.gov.in → New Farmer Registration → Enter Aadhaar, state, district details → Upload land records → Submit → Verification by local revenue officer → Amount credited to bank.',
    amount: '₹6,000 per year (₹2,000 × 3 installments)',
    beneficiaries: '11+ Crore farmer families',
  },
  {
    keywords: ['vishwakarma', 'artisan', 'craftsmen'],
    name: 'PM Vishwakarma Yojana',
    ministry: 'Ministry of MSME',
    portalUrl: 'https://pmvishwakarma.gov.in',
    launchDate: 'September 2023',
    description: 'End-to-end support for traditional artisans and craftsmen in 18 trades through training, toolkit, credit, and marketing support.',
    eligibility: [
      'Traditional artisans and craftsmen working with hands/tools',
      'Must be engaged in one of 18 specified trades',
      'Trades include: Carpenter, Blacksmith, Goldsmith, Potter, Cobbler, Tailor, Weaver, Barber, Washerman, etc.',
      'Self-employed, unorganized sector workers',
      'Age: 18 years and above',
    ],
    benefits: [
      'Free skill training: Basic (5 days) + Advanced (15 days)',
      'Stipend of ₹500/day during training',
      'Toolkit incentive of ₹15,000',
      'Collateral-free credit: Up to ₹1 lakh (1st tranche) + ₹2 lakh (2nd tranche)',
      'Interest rate: 5% (8% subsidized by government)',
      'Digital transactions incentive: ₹1 per transaction (max 100/month)',
      'Marketing support & brand building',
    ],
    documents: [
      'Aadhaar Card',
      'Bank account details',
      'Mobile number',
      'Caste certificate (if applicable)',
      'Photograph',
    ],
    howToApply: 'Visit pmvishwakarma.gov.in → Register through CSC or Gram Panchayat → Verify at Block/District level → Get PM Vishwakarma Certificate and ID → Avail training and benefits.',
    amount: 'Up to ₹3 Lakh collateral-free loan + ₹15,000 toolkit',
    beneficiaries: '30 Lakh artisans (target in 5 years)',
  },
  {
    keywords: ['pm internship', 'internship scheme', 'youth internship'],
    name: 'PM Internship Scheme',
    ministry: 'Ministry of Corporate Affairs',
    portalUrl: 'https://pminternship.mca.gov.in',
    launchDate: 'October 2024',
    description: 'Provides internship opportunities to youth aged 21-24 in top 500 companies with monthly allowance and one-time assistance.',
    eligibility: [
      'Indian citizen aged 21-24 years',
      'Not employed full-time or enrolled in full-time education',
      'Household income should not exceed ₹8 lakh per annum',
      'Should not be from families where any member is a government employee',
      'Must have completed at least 10th standard',
    ],
    benefits: [
      'Monthly allowance of ₹5,000 (₹4,500 from govt + ₹500 from company)',
      'One-time assistance of ₹6,000 for incidentals',
      'Internship duration: 12 months',
      'Real-world work experience in top companies',
      'Certificate of completion',
      'Insurance coverage during internship',
    ],
    documents: [
      'Aadhaar Card',
      'Educational certificates (10th/12th/Graduation marksheets)',
      'Bank account details',
      'Income certificate of family',
      'Passport-size photograph',
    ],
    howToApply: 'Visit pminternship.mca.gov.in → Register with Aadhaar → Fill profile and education details → Browse available internships → Apply to preferred companies → Selection by company → Start internship.',
    amount: '₹5,000/month + ₹6,000 one-time',
    beneficiaries: '1 Crore youth (over 5 years)',
  },
  {
    keywords: ['startup india', 'seed fund', 'sisfs'],
    name: 'Startup India Seed Fund Scheme (SISFS)',
    ministry: 'DPIIT, Ministry of Commerce & Industry',
    portalUrl: 'https://seedfund.startupindia.gov.in',
    launchDate: 'April 2021',
    description: 'Financial assistance to startups for proof of concept, prototype development, product trials, and market launch through incubators.',
    eligibility: [
      'DPIIT-recognized startup (not older than 2 years at time of application)',
      'Must not have received more than ₹10 lakh of monetary support under any central/state govt scheme',
      'Must be using technology in its core product/service or be working towards innovation',
      'Should not be a subsidiary or spinoff of an existing large company',
    ],
    benefits: [
      'Grant up to ₹20 lakh for validation of proof of concept, prototype',
      'Investment up to ₹50 lakh for market entry, commercialization',
      'Total scheme allocation: ₹945 crore over 4 years',
      'Support through 300+ selected incubators across India',
      'Mentorship and networking opportunities',
    ],
    documents: [
      'DPIIT Recognition Certificate',
      'Company incorporation documents (CIN)',
      'PAN card of the company',
      'Pitch deck / business plan',
      'Bank account details of the company',
    ],
    howToApply: 'Get DPIIT Startup Recognition → Apply through seedfund.startupindia.gov.in → Select an approved incubator → Submit business plan → Evaluation by incubator → Funding disbursement in stages.',
    amount: 'Up to ₹50 Lakh',
    beneficiaries: '3,600+ startups supported',
  },
  {
    keywords: ['mudra', 'mudra loan'],
    name: 'Pradhan Mantri MUDRA Yojana',
    ministry: 'Ministry of Finance',
    portalUrl: 'https://www.mudra.org.in',
    launchDate: 'April 2015',
    description: 'Collateral-free loans up to ₹20 lakh for micro and small enterprises through banks, NBFCs, and MFIs.',
    eligibility: [
      'Any Indian citizen who wants to start or expand a small business',
      'Non-corporate, non-farm small/micro enterprises',
      'Business should be in manufacturing, trading, or services sector',
      'No collateral or guarantor required',
    ],
    benefits: [
      'Shishu: Loan up to ₹50,000 (for starting a business)',
      'Kishore: Loan from ₹50,001 to ₹5 lakh (for growing business)',
      'Tarun: Loan from ₹5,00,001 to ₹10 lakh (for established business)',
      'Tarun Plus: Loan from ₹10 lakh to ₹20 lakh',
      'No collateral required',
      'Available at all banks, NBFCs, and MFIs',
    ],
    documents: [
      'Identity proof (Aadhaar/Voter ID/Passport)',
      'Address proof',
      'Business plan or project report',
      'Photographs',
      'Category certificate (SC/ST/OBC if applicable)',
    ],
    howToApply: 'Visit any bank branch or MUDRA loan portal → Fill MUDRA loan application form → Submit business plan → Bank evaluates the proposal → Loan sanctioned (usually within 7-10 working days).',
    amount: 'Up to ₹20 Lakh (collateral-free)',
    beneficiaries: '47+ Crore loans disbursed',
  },
  {
    keywords: ['ujjwala', 'lpg', 'cooking gas'],
    name: 'Pradhan Mantri Ujjwala Yojana (PMUY)',
    ministry: 'Ministry of Petroleum & Natural Gas',
    portalUrl: 'https://pmuy.gov.in',
    launchDate: 'May 2016',
    description: 'Free LPG connections to women from Below Poverty Line (BPL) households to replace unclean cooking fuels.',
    eligibility: [
      'Women of 18 years or above from BPL households',
      'Should not already have an LPG connection in the household',
      'Name must be in SECC 2011 list or belong to SC/ST, Pradhan Mantri Awas Yojana beneficiary, or Antyodaya category',
    ],
    benefits: [
      'Free LPG connection (deposit-free)',
      'First refill free',
      'Free hotplate/stove provided',
      'Subsidy on subsequent refills (DBT)',
      'Improved health by eliminating smoke from cooking',
    ],
    documents: [
      'Aadhaar Card',
      'BPL Ration Card',
      'Bank account details',
      'Passport-size photograph',
      'Address proof',
    ],
    howToApply: 'Visit nearest LPG distributor (HP, Bharat Gas, Indane) → Fill PMUY application form → Submit KYC documents → Verification → Free LPG connection installed at home.',
    amount: 'Free LPG connection + first refill',
    beneficiaries: '10+ Crore connections provided',
  },
  {
    keywords: ['scholarship', 'national scholarship', 'nsp'],
    name: 'National Scholarship Portal (NSP)',
    ministry: 'Ministry of Education',
    portalUrl: 'https://scholarships.gov.in',
    launchDate: '2015',
    description: 'One-stop platform for multiple central and state government scholarships for students from pre-matric to post-doctoral levels.',
    eligibility: [
      'Students enrolled in recognized institutions',
      'Family income criteria varies by scholarship (usually below ₹2-8 lakh per annum)',
      'SC/ST/OBC/Minority/EWS categories have dedicated scholarships',
      'Merit-based and means-based scholarships available',
    ],
    benefits: [
      'Multiple scholarships: Pre-matric, Post-matric, Merit-cum-means',
      'Financial support for tuition fees, maintenance allowance, book grants',
      'Scholarships range from ₹5,000 to ₹2,00,000+ per year',
      'Direct benefit transfer to student\'s bank account',
      'One application can be used for multiple scholarships',
    ],
    documents: [
      'Aadhaar Card',
      'Marksheets / Academic certificates',
      'Income certificate of parents',
      'Caste/Community certificate (if applicable)',
      'Bank account details',
      'Bonafide certificate from institution',
      'Passport-size photograph',
    ],
    howToApply: 'Visit scholarships.gov.in → Register with Aadhaar or mobile → Login → Browse available scholarships → Fill application form → Upload documents → Submit → Institute verification → Disbursement.',
    amount: '₹5,000 to ₹2,00,000+ per year (varies)',
    beneficiaries: '1+ Crore students annually',
  },
  {
    keywords: ['awas yojana', 'pmay', 'housing scheme', 'pucca house'],
    name: 'Pradhan Mantri Awas Yojana (PMAY)',
    ministry: 'Ministry of Housing & Urban Affairs / Ministry of Rural Development',
    portalUrl: 'https://pmaymis.gov.in',
    launchDate: 'June 2015',
    description: 'Affordable housing for all by providing subsidies on home loans and financial assistance for construction of pucca houses.',
    eligibility: [
      'EWS (income up to ₹3 lakh/year) and LIG (up to ₹6 lakh/year)',
      'MIG-I (₹6-12 lakh/year) and MIG-II (₹12-18 lakh/year)',
      'Should not own a pucca house anywhere in India',
      'Women ownership/co-ownership mandatory for EWS/LIG',
    ],
    benefits: [
      'Interest subsidy of 6.5% on home loans up to ₹6 lakh (EWS/LIG)',
      'Interest subsidy of 4% on home loans up to ₹9 lakh (MIG-I)',
      'Interest subsidy of 3% on home loans up to ₹12 lakh (MIG-II)',
      '₹1.20-1.50 lakh assistance for rural house construction (PMAY-G)',
      'Beneficiary-led construction support',
    ],
    documents: [
      'Aadhaar Card',
      'Income proof / Income certificate',
      'Property documents',
      'Bank account details',
      'Photograph',
      'Affidavit of not owning a pucca house',
    ],
    howToApply: 'Visit pmaymis.gov.in → Check eligibility → Apply through bank (for CLSS) or through local body/municipality → Submit documents → Verification → Subsidy credited to loan account.',
    amount: 'Up to ₹2.67 Lakh interest subsidy',
    beneficiaries: '2.95+ Crore houses sanctioned',
  },
  {
    keywords: ['fasal bima', 'crop insurance', 'pmfby'],
    name: 'Pradhan Mantri Fasal Bima Yojana (PMFBY)',
    ministry: 'Ministry of Agriculture & Farmers Welfare',
    portalUrl: 'https://pmfby.gov.in',
    launchDate: 'February 2016',
    description: 'Crop insurance scheme for farmers providing coverage against crop loss due to natural calamities, pests, and diseases at very low premium rates.',
    eligibility: [
      'All farmers growing notified crops in notified areas',
      'Both loanee and non-loanee farmers',
      'Sharecroppers and tenant farmers also eligible',
      'Voluntary for all farmers since Kharif 2020',
    ],
    benefits: [
      'Premium: Only 2% for Kharif, 1.5% for Rabi, 5% for commercial/horticultural crops',
      'Balance premium paid by government',
      'Covers: Natural calamities, pests, diseases, post-harvest losses',
      'Claims settled via satellite imagery and drone technology',
      'Add-on coverage for specific localized risks',
    ],
    documents: [
      'Aadhaar Card',
      'Land records / Land ownership or tenancy documents',
      'Sowing certificate from village officer',
      'Bank account details',
      'Crop sowing declaration',
    ],
    howToApply: 'Visit pmfby.gov.in or nearest bank/CSC → Fill application before cut-off date → Pay premium → Insurance coverage activates for the crop season → Claims auto-assessed → Payout to bank account.',
    amount: 'Full crop value coverage (premium subsidy 95-98%)',
    beneficiaries: '4+ Crore farmer applications per season',
  },
];

// =====================================================
// HELPER: Find matching known scheme
// =====================================================
function findKnownScheme(lowerName) {
  for (const scheme of KNOWN_SCHEMES) {
    for (const keyword of scheme.keywords) {
      if (lowerName.includes(keyword)) {
        return scheme;
      }
    }
  }
  return null;
}

// =====================================================
// HELPER: Merge data from multiple sources
// =====================================================
function mergeSchemeData(known, scraped, myScheme, schemeName) {
  const result = {
    name: known?.name || schemeName || 'Unknown Scheme',
    ministry: known?.ministry || 'Government of India',
    portalUrl: known?.portalUrl || null,
    launchDate: known?.launchDate || null,
    description: scraped?.description || myScheme?.description || known?.description || 'Details are being fetched from official sources.',
    eligibility: known?.eligibility || [],
    benefits: known?.benefits || [],
    documents: known?.documents || [],
    howToApply: scraped?.howToApply || known?.howToApply || 'Visit the official portal for application details.',
    amount: known?.amount || null,
    beneficiaries: known?.beneficiaries || null,
    keyPoints: scraped?.keyPoints || [],
    scrapedFrom: scraped?.source_url || myScheme?.source_url || known?.portalUrl || null,
    dataSource: scraped ? 'live_scrape' : (known ? 'known_database' : 'limited'),
  };

  // If we scraped eligibility/benefits/docs from live data, prefer those
  if (scraped?.eligibility) result.eligibility = scraped.eligibility.split('\n').filter(Boolean);
  if (scraped?.benefits) result.benefits = scraped.benefits.split('\n').filter(Boolean);
  if (scraped?.documents) result.documents = scraped.documents.split('\n').filter(Boolean);

  return result;
}

// =====================================================
// HELPER: Strip HTML tags
// =====================================================
function stripHtml(html) {
  if (!html) return '';
  const tmp = document.createElement('DIV');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}
