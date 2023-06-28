const fetch = require('node-fetch');
const { createServer } = require('https');
const { parse } = require('url');

const targetUrl = 'https://api.openai.com/api/openai/v1/chat/completions';
const targetHost = 'api.openai.com';

const options = {
  hostname: targetHost,
  path: '',
  method: '',
  headers: {
    'Content-Type': 'application/json',
    // 添加你的OpenAI身份验证头部信息
    'Authorization': 'Bearer ${process.env.YOUR_OPENAI_API_KEY}',
  },
};

const server = createServer(async (req, res) => {
  const { pathname } = parse(req.url);
  const requestOptions = { ...options };

  requestOptions.path = pathname;
  requestOptions.method = req.method;

  const proxyReq = createRequest(req, requestOptions);

  proxyReq.on('error', (err) => {
    console.error('Proxy Request Error:', err);
    res.statusCode = 500;
    res.end('Proxy Request Error');
  });

  const proxyRes = await fetch(targetUrl + pathname, {
    method: req.method,
    headers: req.headers,
    body: req,
  });

  proxyRes.body.pipe(res);

  proxyRes.on('error', (err) => {
    console.error('Proxy Response Error:', err);
    res.statusCode = 500;
    res.end('Proxy Response Error');
  });
});

function createRequest(req, requestOptions) {
  const proxyReq = https.request(requestOptions);

  req.pipe(proxyReq);

  req.on('error', (err) => {
    console.error('Request Error:', err);
    proxyReq.abort();
  });

  return proxyReq;
}

module.exports = (req, res) => {
  server.emit('request', req, res);
};
