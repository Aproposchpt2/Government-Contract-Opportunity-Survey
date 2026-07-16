'use strict';

const { randomUUID } = require('node:crypto');

const MAX_BODY_BYTES = 30000;

const ALLOWED = {
  respondent_type: [
    'Business owner, founder, or executive',
    'Registered federal government contractor',
    'State or local government contractor',
    'Business-development professional',
    'Proposal writer or government-contracting consultant',
    'Business-support or economic-development organization',
    'Nonprofit, educational, or community organization',
    'Individual exploring government contracting',
    'Other'
  ],
  markets: [
    'United States federal government',
    'State government',
    'County or city government',
    'School districts or public universities',
    'Nevada government opportunities',
    'California government opportunities',
    'Opportunities in other states',
    'I am not sure where to begin',
    'I support businesses pursuing government contracts'
  ],
  experience_level: [
    'Completely new',
    'Currently learning',
    'Searched for opportunities',
    'Submitted at least one proposal',
    'Received at least one government contract',
    'Regularly competes',
    'Advises or supports businesses',
    'Not applicable'
  ],
  challenges: [
    'Finding relevant opportunities',
    'Knowing whether the business qualifies',
    'Understanding the solicitation',
    'Determining whether the opportunity is worth pursuing',
    'Tracking deadlines',
    'Understanding certifications or set-asides',
    'Preparing the proposal',
    'Developing pricing',
    'Finding teaming or subcontracting partners',
    'Not enough time or staff',
    'Knowing where to begin',
    'Other'
  ],
  search_methods: [
    'SAM.gov',
    'State procurement websites',
    'County or city websites',
    'School district or university websites',
    'Email notifications',
    'Search engines',
    'Government-contracting consultants',
    'APEX Accelerators or SBDCs',
    'Paid opportunity-notification services',
    'Social media',
    'Professional referrals',
    'No consistent method',
    'Have not started searching'
  ],
  relevant_opportunity_value: [
    'Extremely useful',
    'Very useful',
    'Somewhat useful',
    'Slightly useful',
    'Not useful',
    'Need to see an example'
  ],
  fit_evaluation_value: [
    'Extremely useful',
    'Very useful',
    'Somewhat useful',
    'Slightly useful',
    'Not useful',
    'Not sure'
  ],
  proposal_assistance_interest: [
    'Yes',
    'Probably',
    'Depends on the contract',
    'Need service and cost information',
    'Probably not',
    'No',
    'Not applicable'
  ],
  follow_up_interests: [
    'Future government-contracting research',
    'Free government-contract discovery resources',
    'Professional proposal-development support',
    'Support for clients or members',
    'Future demonstration',
    'No follow-up requested'
  ]
};

function response(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    },
    body: JSON.stringify(body)
  };
}

function cleanText(value, maxLength = 500) {
  if (typeof value !== 'string') return null;
  const cleaned = value.trim().slice(0, maxLength);
  return cleaned || null;
}

function requireChoice(value, field) {
  if (typeof value !== 'string' || !ALLOWED[field].includes(value)) {
    throw new Error(`Invalid ${field}`);
  }
  return value;
}

function requireChoices(value, field, maxSelections = ALLOWED[field].length) {
  const values = Array.isArray(value) ? value : (typeof value === 'string' ? [value] : []);
  const unique = [...new Set(values.filter(item => typeof item === 'string'))];
  if (unique.length === 0 || unique.length > maxSelections || unique.some(item => !ALLOWED[field].includes(item))) {
    throw new Error(`Invalid ${field}`);
  }
  return unique;
}

function optionalChoices(value, field) {
  if (value == null || value === '') return [];
  const values = Array.isArray(value) ? value : [value];
  const unique = [...new Set(values.filter(item => typeof item === 'string'))];
  if (unique.some(item => !ALLOWED[field].includes(item))) {
    throw new Error(`Invalid ${field}`);
  }
  if (unique.includes('No follow-up requested') && unique.length > 1) {
    throw new Error('Invalid follow_up_interests');
  }
  return unique;
}

function validEmail(value) {
  return !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validWebsite(value) {
  if (!value) return true;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

exports.handler = async event => {
  if (event.httpMethod !== 'POST') {
    return response(405, { ok: false, message: 'Method not allowed.' });
  }

  const rawBody = event.isBase64Encoded
    ? Buffer.from(event.body || '', 'base64').toString('utf8')
    : (event.body || '');

  if (Buffer.byteLength(rawBody, 'utf8') > MAX_BODY_BYTES) {
    return response(413, { ok: false, message: 'Submission is too large.' });
  }

  let input;
  try {
    input = JSON.parse(rawBody);
  } catch {
    return response(400, { ok: false, message: 'Invalid submission.' });
  }

  if (cleanText(input['bot-field'], 200)) {
    return response(200, { ok: true });
  }

  const supabaseUrl = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Survey submission environment variables are missing.');
    return response(503, { ok: false, message: 'Survey submission is temporarily unavailable.' });
  }

  try {
    const followUpInterests = optionalChoices(input.follow_up_interests, 'follow_up_interests');
    const contactConsent = input.contact_consent === 'Yes' || input.contact_consent === true;

    const firstName = cleanText(input.first_name, 120);
    const lastName = cleanText(input.last_name, 120);
    const businessName = cleanText(input.business_name, 240);
    const email = cleanText(input.email, 320);
    const telephone = cleanText(input.telephone, 80);
    const website = cleanText(input.website, 500);

    const hasContactDetails = Boolean(firstName || lastName || businessName || email || telephone || website);
    const hasFollowUpRequest = followUpInterests.some(item => item !== 'No follow-up requested');

    if ((hasContactDetails || hasFollowUpRequest) && !contactConsent) {
      return response(400, { ok: false, message: 'Contact authorization is required for follow-up.' });
    }
    if (!validEmail(email)) {
      return response(400, { ok: false, message: 'Please enter a valid email address.' });
    }
    if (!validWebsite(website)) {
      return response(400, { ok: false, message: 'Please enter a complete website address.' });
    }

    const record = {
      submission_id: randomUUID(),
      source: cleanText(input.source, 120) || 'direct',
      utm_campaign: cleanText(input.utm_campaign, 120),
      utm_content: cleanText(input.utm_content, 120),
      respondent_type: requireChoice(input.respondent_type, 'respondent_type'),
      government_markets: requireChoices(input.markets, 'markets'),
      experience_level: requireChoice(input.experience_level, 'experience_level'),
      challenges: requireChoices(input.challenges, 'challenges', 3),
      search_methods: requireChoices(input.search_methods, 'search_methods'),
      relevant_opportunity_value: requireChoice(input.relevant_opportunity_value, 'relevant_opportunity_value'),
      fit_evaluation_value: requireChoice(input.fit_evaluation_value, 'fit_evaluation_value'),
      proposal_assistance_interest: requireChoice(input.proposal_assistance_interest, 'proposal_assistance_interest'),
      open_feedback: cleanText(input.open_feedback, 1500),
      first_name: firstName,
      last_name: lastName,
      business_name: businessName,
      email,
      telephone,
      website,
      follow_up_interests: followUpInterests,
      contact_consent: contactConsent,
      referrer: cleanText(event.headers.referer || event.headers.referrer, 500),
      user_agent: cleanText(event.headers['user-agent'], 500)
    };

    const insertResponse = await fetch(`${supabaseUrl}/rest/v1/government_contract_survey_responses`, {
      method: 'POST',
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal'
      },
      body: JSON.stringify(record)
    });

    if (!insertResponse.ok) {
      const diagnostic = (await insertResponse.text()).slice(0, 1000);
      console.error('Supabase survey insert failed:', insertResponse.status, diagnostic);
      return response(502, { ok: false, message: 'We could not save your response. Please try again.' });
    }

    return response(200, { ok: true });
  } catch (error) {
    console.warn('Survey validation failed:', error instanceof Error ? error.message : 'Unknown error');
    return response(400, { ok: false, message: 'Please review your answers and try again.' });
  }
};
