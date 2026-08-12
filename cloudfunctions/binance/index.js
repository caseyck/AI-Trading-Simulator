const BINANCE_BASE = 'https://data-api.binance.vision/api/v3';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Content-Type': 'application/json; charset=utf-8'
};

function buildError(statusCode, message) {
  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify({
      error: message
    })
  };
}

function getQueryParams(event) {
  if (!event) {
    return new URLSearchParams();
  }

  if (event.queryString && typeof event.queryString === 'string') {
    return new URLSearchParams(event.queryString);
  }

  const raw = event.queryStringParameters || event.query || event.queryParams || {};
  if (!raw || typeof raw !== 'object') {
    return new URLSearchParams();
  }

  if (raw instanceof URLSearchParams) {
    return raw;
  }

  const params = new URLSearchParams();
  Object.entries(raw).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.set(key, String(value));
    }
  });
  return params;
}

exports.main = async function main(event = {}) {
  const method = (event.httpMethod || event.method || 'GET').toUpperCase();

  if (method === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: ''
    };
  }

  if (method !== 'GET') {
    return buildError(405, 'Method not allowed');
  }

  const rawPath = (event.path || '/').replace(/\/+,/g, '/');
  const prefix = '/api/binance';
  const trimmedPath = rawPath.startsWith(prefix)
    ? rawPath.slice(prefix.length) || '/'
    : rawPath;
  const route = trimmedPath.startsWith('/') ? trimmedPath : `/${trimmedPath}`;

  if (route !== '/ticker/price' && route !== '/klines') {
    return buildError(404, 'Unsupported path');
  }

  const upstreamUrl = new URL(`${BINANCE_BASE}${route}`);
  const query = getQueryParams(event);
  query.forEach((value, key) => {
    upstreamUrl.searchParams.set(key, value);
  });

  try {
    const response = await fetch(upstreamUrl.toString(), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'User-Agent': 'AI-Trading-Simulator-Proxy'
      }
    });

    const text = await response.text();
    return {
      statusCode: response.status,
      headers: CORS_HEADERS,
      body: text
    };
  } catch (error) {
    return buildError(502, error && error.message ? error.message : 'Binance proxy request failed');
  }
};
