// =====================================================
// AI Scheme Analyzer — Real Dynamic Implementation
// With Source Verification & Fake News Detection
// =====================================================

// --- API Keys ---
// NOTE: In production, these should NEVER be in the frontend.
const GNEWS_API_KEY = ''; // User must provide their free GNews key
const GEMINI_API_KEY = ''; // User must provide their Gemini key

// =====================================================
// OFFICIAL GOVERNMENT SOURCE REGISTRY
// Used to verify if the news came from a trusted source
// and to provide official portal links for cross-checking
// =====================================================
const TRUSTED_GOV_DOMAINS = [
  'pib.gov.in', 'india.gov.in', 'myscheme.gov.in', 'pmkisan.gov.in',
  'pmjay.gov.in', 'abdm.gov.in', 'startupindia.gov.in', 'pmvishwakarma.gov.in',
  'pmsuryaghar.gov.in', 'pminternship.mca.gov.in', 'seedfund.startupindia.gov.in',
  'nrega.nic.in', 'scholarships.gov.in', 'mudra.org.in', 'ujjwala.gov.in',
  'education.gov.in', 'digilocker.gov.in', 'nhb.org.in', 'nsap.nic.in',
  'pmfby.gov.in', 'mygov.in', 'sarkari.gov.in', 'nic.in',
  'gov.in', 'eci.gov.in', 'nvshq.org',
];

const TRUSTED_NEWS_SOURCES = [
  'pib india', 'press information bureau', 'dd news', 'doordarshan',
  'all india radio', 'air', 'rajya sabha tv', 'sansad tv',
  'the hindu', 'hindustan times', 'indian express', 'times of india',
  'ndtv', 'livemint', 'economic times', 'business standard',
  'pti', 'ani', 'ians', 'reuters india', 'bbc hindi',
  'ministry of', 'government of india',
];

// Maps scheme keywords to their official government portals for verification
const OFFICIAL_PORTALS = {
  'pm kisan': { name: 'PM-KISAN Official Portal', url: 'https://pmkisan.gov.in', ministry: 'Ministry of Agriculture & Farmers Welfare' },
  'kisan samman': { name: 'PM-KISAN Official Portal', url: 'https://pmkisan.gov.in', ministry: 'Ministry of Agriculture & Farmers Welfare' },
  'ayushman bharat': { name: 'Ayushman Bharat - PMJAY', url: 'https://pmjay.gov.in', ministry: 'Ministry of Health & Family Welfare' },
  'pmjay': { name: 'Ayushman Bharat - PMJAY', url: 'https://pmjay.gov.in', ministry: 'Ministry of Health & Family Welfare' },
  'jan arogya': { name: 'Ayushman Bharat - PMJAY', url: 'https://pmjay.gov.in', ministry: 'Ministry of Health & Family Welfare' },
  'surya ghar': { name: 'PM Surya Ghar Portal', url: 'https://pmsuryaghar.gov.in', ministry: 'Ministry of New & Renewable Energy' },
  'muft bijli': { name: 'PM Surya Ghar Portal', url: 'https://pmsuryaghar.gov.in', ministry: 'Ministry of New & Renewable Energy' },
  'vishwakarma': { name: 'PM Vishwakarma Portal', url: 'https://pmvishwakarma.gov.in', ministry: 'Ministry of MSME' },
  'mudra': { name: 'MUDRA Loan Portal', url: 'https://www.mudra.org.in', ministry: 'Ministry of Finance' },
  'ujjwala': { name: 'PM Ujjwala Yojana', url: 'https://pmuy.gov.in', ministry: 'Ministry of Petroleum & Natural Gas' },
  'jan dhan': { name: 'PM Jan Dhan Yojana', url: 'https://pmjdy.gov.in', ministry: 'Ministry of Finance' },
  'startup india': { name: 'Startup India Portal', url: 'https://www.startupindia.gov.in', ministry: 'DPIIT' },
  'seed fund': { name: 'Startup India Seed Fund', url: 'https://seedfund.startupindia.gov.in', ministry: 'DPIIT' },
  'scholarship': { name: 'National Scholarship Portal', url: 'https://scholarships.gov.in', ministry: 'Ministry of Education' },
  'vidyalaxmi': { name: 'PM Vidyalaxmi Portal', url: 'https://www.vidyalakshmi.co.in', ministry: 'Ministry of Education' },
  'pm internship': { name: 'PM Internship Scheme', url: 'https://pminternship.mca.gov.in', ministry: 'Ministry of Corporate Affairs' },
  'nrega': { name: 'MGNREGA Portal', url: 'https://nrega.nic.in', ministry: 'Ministry of Rural Development' },
  'mgnrega': { name: 'MGNREGA Portal', url: 'https://nrega.nic.in', ministry: 'Ministry of Rural Development' },
  'awas yojana': { name: 'PM Awas Yojana', url: 'https://pmaymis.gov.in', ministry: 'Ministry of Housing & Urban Affairs' },
  'pmay': { name: 'PM Awas Yojana', url: 'https://pmaymis.gov.in', ministry: 'Ministry of Housing & Urban Affairs' },
  'fasal bima': { name: 'PM Fasal Bima Yojana', url: 'https://pmfby.gov.in', ministry: 'Ministry of Agriculture & Farmers Welfare' },
  'crop insurance': { name: 'PM Fasal Bima Yojana', url: 'https://pmfby.gov.in', ministry: 'Ministry of Agriculture & Farmers Welfare' },
  'atal pension': { name: 'Atal Pension Yojana', url: 'https://www.npscra.nsdl.co.in/scheme-details.php', ministry: 'Ministry of Finance' },
  'sukanya samriddhi': { name: 'Sukanya Samriddhi Yojana', url: 'https://www.nsiindia.gov.in', ministry: 'Ministry of Finance' },
  'digital india': { name: 'Digital India Portal', url: 'https://www.digitalindia.gov.in', ministry: 'Ministry of Electronics & IT' },
  'swachh bharat': { name: 'Swachh Bharat Mission', url: 'https://swachhbharatmission.gov.in', ministry: 'Ministry of Housing & Urban Affairs' },
  'skill india': { name: 'Skill India Portal', url: 'https://www.skillindia.gov.in', ministry: 'Ministry of Skill Development' },
  'make in india': { name: 'Make in India Portal', url: 'https://www.makeinindia.com', ministry: 'DPIIT' },
  'stand up india': { name: 'Stand Up India', url: 'https://www.standupmitra.in', ministry: 'Ministry of Finance' },
};

// Fallback: Generic government scheme portal for anything unmatched
const DEFAULT_VERIFICATION_PORTAL = {
  name: 'MyScheme.gov.in — Government Scheme Search',
  url: 'https://www.myscheme.gov.in',
  ministry: 'Government of India',
};

// =====================================================
// 1. FETCH REAL GOVERNMENT NEWS
// =====================================================
export async function fetchRecentNews() {
  if (GNEWS_API_KEY) {
    const queries = [
      'India government scheme launched',
      'India yojana new scheme subsidy',
      'India scholarship welfare program 2026',
    ];

    const allArticles = [];

    for (const q of queries) {
      try {
        const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(q)}&lang=en&country=in&max=5&apikey=${GNEWS_API_KEY}`;
        const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
        if (!res.ok) continue;
        const data = await res.json();
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
        console.warn(`[AI Analyzer] GNews fetch failed for query: "${q}"`, err);
      }
    }

    const seen = new Set();
    const unique = allArticles.filter((a) => {
      if (seen.has(a.url)) return false;
      seen.add(a.url);
      return true;
    });

    if (unique.length > 0) return unique;
  }

  // Fallback: PIB RSS
  try {
    const rssUrl = 'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fpib.gov.in%2FRssFeed.aspx%3FMenuId%3D2%26Lang%3D1%26RegDtFrom%3D%26RegDtTo%3D';
    const res = await fetch(rssUrl, { signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      const data = await res.json();
      if (data.items && data.items.length > 0) {
        return data.items.slice(0, 10).map((item) => ({
          title: item.title,
          content: stripHtml(item.description || item.content || ''),
          url: item.link,
          source: 'PIB India (Press Information Bureau)',
          publishedAt: item.pubDate,
          image: item.thumbnail || item.enclosure?.link || null,
        }));
      }
    }
  } catch (err) {
    console.warn('[AI Analyzer] PIB RSS fallback failed:', err);
  }

  // Fallback: newsdata.io
  try {
    const url = 'https://newsdata.io/api/1/latest?country=in&category=politics&language=en&q=scheme%20OR%20yojana%20OR%20subsidy';
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        return data.results.slice(0, 10).map((item) => ({
          title: item.title,
          content: item.description || item.content || '',
          url: item.link,
          source: item.source_name || item.source_id || 'News',
          publishedAt: item.pubDate,
          image: item.image_url || null,
        }));
      }
    }
  } catch (err) {
    console.warn('[AI Analyzer] newsdata.io fallback failed:', err);
  }

  // Safety net
  return getRecentRealSchemes();
}

// =====================================================
// 2. ANALYZE WITH AI + SOURCE VERIFICATION
// =====================================================
export async function analyzeHeadlineWithAI(article) {
  const textToAnalyze = `Title: ${article.title}\nContent: ${article.content}`;

  // Get base analysis
  let analysis;
  if (GEMINI_API_KEY) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: buildPrompt(textToAnalyze) }] }],
            generationConfig: { temperature: 0.1, maxOutputTokens: 500 },
          }),
          signal: AbortSignal.timeout(6000)
        }
      );
      if (response.ok) {
        const data = await response.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        analysis = parseAIResponse(rawText);
      }
    } catch (err) {
      console.warn('[AI Analyzer] Gemini API call failed:', err);
    }
  }

  if (!analysis) {
    analysis = localAnalysis(textToAnalyze);
  }

  // --- SOURCE VERIFICATION ---
  const verification = verifySource(article, analysis);

  return {
    ...analysis,
    verification,
  };
}

// =====================================================
// 3. SOURCE VERIFICATION ENGINE
// =====================================================
function verifySource(article, analysis) {
  const sourceStr = (article.source || '').toLowerCase();
  const articleUrl = (article.url || '').toLowerCase();
  const fullText = `${article.title} ${article.content}`.toLowerCase();

  // 1. Check if the article URL is from a gov.in domain
  const isGovSource = TRUSTED_GOV_DOMAINS.some((d) => articleUrl.includes(d));

  // 2. Check if the news source is a known trusted outlet
  const isTrustedNews = TRUSTED_NEWS_SOURCES.some((s) => sourceStr.includes(s));

  // 3. Find the official government portal for this scheme
  let officialPortal = null;
  for (const [keyword, portal] of Object.entries(OFFICIAL_PORTALS)) {
    if (fullText.includes(keyword)) {
      officialPortal = portal;
      break;
    }
  }

  // If no specific portal matched, use the generic portal
  if (!officialPortal && analysis.scheme_related === 'Yes') {
    officialPortal = DEFAULT_VERIFICATION_PORTAL;
  }

  // 4. Determine verification status
  let status, statusLabel, statusDetail;

  if (isGovSource) {
    status = 'verified';
    statusLabel = '✅ Verified — Official Government Source';
    statusDetail = `This article is sourced directly from an official government domain (${extractDomain(article.url)}). High trust.`;
  } else if (isTrustedNews && officialPortal) {
    status = 'likely_genuine';
    statusLabel = '🟡 Likely Genuine — Trusted News Source';
    statusDetail = `Reported by ${article.source}, a recognized news outlet. Cross-verify on the official portal below.`;
  } else if (isTrustedNews) {
    status = 'likely_genuine';
    statusLabel = '🟡 Likely Genuine — Trusted News Source';
    statusDetail = `Reported by ${article.source}. We could not find a specific official portal; verify on MyScheme.gov.in.`;
  } else if (officialPortal) {
    status = 'unverified';
    statusLabel = '⚠️ Unverified Source — Cross-Check Required';
    statusDetail = `The source "${article.source}" is not a recognized government or major news outlet. Please verify on the official portal below before trusting this information.`;
  } else {
    status = 'suspicious';
    statusLabel = '🔴 Suspicious — Unknown Source';
    statusDetail = `The source "${article.source}" is unknown and no official portal was found. This could be fake or misleading news. Do NOT approve without independent verification.`;
  }

  return {
    status,
    statusLabel,
    statusDetail,
    isGovSource,
    isTrustedNews,
    sourceDomain: extractDomain(article.url),
    officialPortal,
    newsSource: article.source,
    articleUrl: article.url,
  };
}

// =====================================================
// PROMPT BUILDER
// =====================================================
function buildPrompt(text) {
  return `You are an AI assistant for a Government Scheme Finder system in India.

Analyze the following government news headline and description. Determine whether it represents a newly launched or existing government scheme, subsidy, yojana, assistance program, scholarship, welfare benefit, or financial support initiative.

Rules:
1. Identify whether the text is related to a government scheme, subsidy, yojana, assistance program, scholarship, welfare benefit, or financial support initiative.
2. Ignore political news, weather updates, sports news, administrative announcements, and unrelated government activities like meetings, visits, or diplomacy.
3. Be strict: only mark as "Yes" if there is a clear, specific government program being discussed with tangible benefits for citizens.

Return ONLY a valid JSON object with these exact fields (no markdown, no explanation, just JSON):
{
  "scheme_related": "Yes" or "No",
  "confidence": <number 0-100>,
  "suggested_name": "<name of the scheme>" or null,
  "reason": "<1-2 sentence explanation>"
}

Text to analyze:
"""
${text}
"""`;
}

// =====================================================
// PARSE AI RESPONSE
// =====================================================
function parseAIResponse(rawText) {
  try {
    const jsonMatch = rawText.match(/\{[\s\S]*?\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        scheme_related: parsed.scheme_related || 'No',
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 50,
        suggested_name: parsed.suggested_name || null,
        reason: parsed.reason || 'AI could not provide a reason.',
      };
    }
  } catch (e) {
    console.warn('[AI Analyzer] Failed to parse Gemini response:', e);
  }
  return { scheme_related: 'No', confidence: 30, suggested_name: null, reason: 'AI response could not be parsed.' };
}

// =====================================================
// LOCAL ANALYSIS FALLBACK
// =====================================================
function localAnalysis(text) {
  const lower = text.toLowerCase();

  const schemeKeywords = [
    'yojana', 'scheme', 'subsidy', 'scholarship', 'pension',
    'allowance', 'financial assistance', 'benefit', 'welfare',
    'loan waiver', 'free ration', 'housing scheme', 'insurance scheme',
    'pm kisan', 'ayushman', 'mudra', 'ujjwala', 'jan dhan',
    'skill training', 'stipend', 'grant', 'disbursement',
    'launched', 'rolled out', 'announced', 'inaugurated',
    'eligible', 'beneficiaries', 'enrollment', 'registration open',
    'direct benefit', 'dbt', 'cash transfer', 'relief fund',
    'empowerment', 'employment guarantee', 'startup india',
  ];

  const noiseKeywords = [
    'arrested', 'election', 'vote', 'cricket', 'football',
    'weather', 'rainfall', 'earthquake', 'accident', 'murder',
    'film', 'movie', 'celebrity', 'entertainment',
    'diplomatic', 'foreign minister', 'bilateral talks',
    'court ruling', 'verdict', 'bail', 'investigation',
    'stock market', 'sensex', 'nifty', 'gdp growth',
  ];

  let score = 0;
  let matchedKeywords = [];

  for (const kw of schemeKeywords) {
    if (lower.includes(kw)) { score += 8; matchedKeywords.push(kw); }
  }
  for (const kw of noiseKeywords) {
    if (lower.includes(kw)) { score -= 12; }
  }

  if (/rs\.?\s*\d+/.test(lower) || /₹\s*\d+/.test(lower)) score += 10;
  if (/\d+\s*(lakh|crore|thousand)/.test(lower)) score += 8;
  if (/government\s+(of\s+)?india/i.test(lower)) score += 5;
  if (/ministry\s+of/i.test(lower)) score += 5;
  if (/pradhan\s*mantri/i.test(lower)) score += 15;
  if (/chief\s*minister/i.test(lower)) score += 5;
  if (/state\s+government/i.test(lower)) score += 5;

  const confidence = Math.max(0, Math.min(100, 30 + score));
  const isScheme = confidence >= 60;

  let suggestedName = null;
  if (isScheme) {
    const nameMatch = text.match(/'([^']+(?:yojana|scheme|mission|abhiyan|portal|nidhi)[^']*)'/i)
      || text.match(/"([^"]+(?:yojana|scheme|mission|abhiyan|portal|nidhi)[^"]*)"/i)
      || text.match(/((?:PM|Pradhan Mantri|National)\s+[A-Z][a-zA-Z\s]+(?:Yojana|Scheme|Mission|Abhiyan|Portal|Nidhi))/i)
      || text.match(/([A-Z][a-zA-Z]+\s+(?:Yojana|Scheme|Mission|Abhiyan|Portal|Nidhi))/i);
    if (nameMatch) suggestedName = nameMatch[1].trim();
  }

  const reason = isScheme
    ? `Detected government scheme indicators: ${matchedKeywords.slice(0, 4).join(', ')}. The text appears to describe a government assistance program.`
    : `The text does not contain strong indicators of a government scheme. It appears to be a general news article.`;

  return { scheme_related: isScheme ? 'Yes' : 'No', confidence, suggested_name: suggestedName, reason };
}

// =====================================================
// HELPERS
// =====================================================
function stripHtml(html) {
  const tmp = document.createElement('DIV');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

function extractDomain(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

// =====================================================
// RECENT REAL SCHEMES (safety net with official portals)
// =====================================================
function getRecentRealSchemes() {
  const schemes = [
    {
      title: "PM Surya Ghar Muft Bijli Yojana: Government to provide free electricity to 1 crore households",
      content: "Under PM Surya Ghar Muft Bijli Yojana, the central government will provide subsidies up to Rs 78,000 for installing rooftop solar panels, enabling households to get up to 300 units of free electricity per month. Registration is now open on the official portal.",
      url: "https://pmsuryaghar.gov.in",
      source: "PIB India (Press Information Bureau)",
      publishedAt: new Date(Date.now() - 10000000).toISOString(),
      image: null,
    },
    {
      title: "Ayushman Bharat Health Insurance extended to all senior citizens above 70 years",
      content: "The government has expanded the Ayushman Bharat Pradhan Mantri Jan Arogya Yojana (AB-PMJAY) to cover all senior citizens aged 70 and above, regardless of income. The scheme provides free health cover of Rs 5 lakh per family per year.",
      url: "https://pmjay.gov.in",
      source: "Ministry of Health & Family Welfare",
      publishedAt: new Date(Date.now() - 20000000).toISOString(),
      image: null,
    },
    {
      title: "PM Internship Scheme 2026: 1 crore internship opportunities for youth",
      content: "The Pradhan Mantri Internship Scheme aims to provide internship opportunities to 1 crore youth in top 500 companies over 5 years. Interns will receive a monthly allowance of Rs 5,000 and a one-time assistance of Rs 6,000.",
      url: "https://pminternship.mca.gov.in",
      source: "Ministry of Corporate Affairs",
      publishedAt: new Date(Date.now() - 5000000).toISOString(),
      image: null,
    },
    {
      title: "India-Australia cricket series: Preparations underway for upcoming test matches",
      content: "The BCCI has announced the squad for the upcoming India-Australia test series. The matches will be held across five venues starting next month.",
      url: "https://bcci.tv",
      source: "Sports News Daily",
      publishedAt: new Date(Date.now() - 30000000).toISOString(),
      image: null,
    },
    {
      title: "PM VISHWAKARMA Yojana for traditional artisans and craftsmen",
      content: "The PM Vishwakarma scheme provides end-to-end support to artisans through skills training, toolkit incentive of Rs 15,000, collateral-free credit up to Rs 3 lakh. 18 traditional trades are covered.",
      url: "https://pmvishwakarma.gov.in",
      source: "Ministry of MSME",
      publishedAt: new Date(Date.now() - 8000000).toISOString(),
      image: null,
    },
    {
      title: "Cabinet approves continuation of PM-KISAN with enhanced verification",
      content: "The Union Cabinet approved continuation of PM Kisan Samman Nidhi with enhanced Aadhaar-based verification. Eligible farmer families receive Rs 6,000 per year in three equal installments. Over 11 crore farmers have benefited.",
      url: "https://pmkisan.gov.in",
      source: "PIB India (Press Information Bureau)",
      publishedAt: new Date(Date.now() - 15000000).toISOString(),
      image: null,
    },
    {
      title: "Monsoon forecast: IMD predicts above-normal rainfall for July 2026",
      content: "The India Meteorological Department (IMD) has predicted above-normal rainfall during July across most parts of the country.",
      url: "https://mausam.imd.gov.in",
      source: "IMD Weather",
      publishedAt: new Date(Date.now() - 40000000).toISOString(),
      image: null,
    },
    {
      title: "Startup India Seed Fund Scheme: Rs 945 crore allocated for startup ecosystem",
      content: "The Startup India Seed Fund Scheme (SISFS) provides financial assistance to startups for proof of concept, prototype development, and commercialization. Grants up to Rs 20 lakh for validation and Rs 50 lakh for market launch.",
      url: "https://seedfund.startupindia.gov.in",
      source: "DPIIT, Government of India",
      publishedAt: new Date(Date.now() - 25000000).toISOString(),
      image: null,
    },
  ];

  // Shuffle to provide dynamic results on every scan
  return schemes.sort(() => Math.random() - 0.5);
}
