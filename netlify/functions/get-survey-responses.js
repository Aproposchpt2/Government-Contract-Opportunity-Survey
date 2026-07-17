'use strict';

const { timingSafeEqual } = require('node:crypto');

const TABLE = 'government_contract_survey_responses';
const MAX_ROWS = 2000;
const SELECT_COLUMNS = [
  'id',
  'submission_id',
  'created_at',
  'source',
  'utm_campaign',
  'utm_content',
  'respondent_type',
  'government_markets',
  'experience_level',
  'challenges',
  'search_methods',
  'relevant_opportunity_value',
  'fit_evaluation_value',
  'proposal_assistance_interest',
  'open_feedback',
  'first_name',
  'last_name',
  'business_name',
  'email',
  'telephone',
  'website',
  'follow_up_interests',
  'contact_consent'
];

function jsonResponse(statusCode, body, extraHeaders = {}) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'private, no-store, max-age=0',
      'X-Content-Type-Options': 'nosniff',
      Vary: 'Authorization',
      ...extraHeaders
    },
    body: JSON.stringify(body)
  };
}

function secureEquals(candidate, expected) {
  if (!candidate || !expected) return false;

  const candidateBuffer = Buffer.from(candidate, 'utf8');
  const expectedBuffer = Buffer.from(expected, 'utf8');

  if (candidateBuffer.length !== expectedBuffer.length) return false;
  return timingSafeEqual(candidateBuffer, expectedBuffer);
}

function bearerToken(headers = {}) {
  const authorization = headers.authorization || headers.Authorization || '';
  const match = /^Bearer\s+(.+)$/i.exec(authorization);
  return match ? match[1].trim() : '';
}

exports.handler = async function handler(event) {
  if (event.httpMethod !== 'GET') {
    return jsonResponse(405, {
      ok: false,
      message: 'Method not allowed.'
    }, {
      Allow: 'GET'
    });
  }

  // Use process.env for compatibility with standard Netlify Functions.
  const supabaseUrl = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const dashboardAccessKey = process.env.DASHBOARD_ACCESS_KEY || '';

  if (!supabaseUrl || !serviceRoleKey || !dashboardAccessKey) {
    console.error('Survey dashboard environment variables are missing.', {
      hasSupabaseUrl: Boolean(supabaseUrl),
      hasServiceRoleKey: Boolean(serviceRoleKey),
      hasDashboardAccessKey: Boolean(dashboardAccessKey)
    });
    return jsonResponse(503, {
      ok: false,
      message: 'Dashboard service is not configured.'
    });
  }

  if (!secureEquals(bearerToken(event.headers), dashboardAccessKey)) {
    return jsonResponse(401, {
      ok: false,
      message: 'Unauthorized.'
    }, {
      'WWW-Authenticate': 'Bearer realm="NGCC Survey Dashboard"'
    });
  }

  try {
    const query = new URLSearchParams({
      select: SELECT_COLUMNS.join(','),
      order: 'created_at.desc',
      limit: String(MAX_ROWS)
    });

    const supabaseResponse = await fetch(`${supabaseUrl}/rest/v1/${TABLE}?${query.toString()}`, {
      method: 'GET',
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        Accept: 'application/json'
      }
    });

    if (!supabaseResponse.ok) {
      const diagnostic = (await supabaseResponse.text()).slice(0, 1000);
      console.error('Supabase survey read failed:', supabaseResponse.status, diagnostic);
      return jsonResponse(502, {
        ok: false,
        message: 'Survey responses could not be loaded.'
      });
    }

    const responses = await supabaseResponse.json();
    const records = Array.isArray(responses) ? responses : [];

    return jsonResponse(200, {
      ok: true,
      count: records.length,
      responses: records
    });
  } catch (error) {
    console.error('Survey dashboard read failed:', error instanceof Error ? error.message : 'Unknown error');
    return jsonResponse(500, {
      ok: false,
      message: 'Survey responses could not be loaded.'
    });
  }
};