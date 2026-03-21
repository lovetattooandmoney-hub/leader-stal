'use strict';

const nodemailer = require('nodemailer');

const ALLOWED_RETURN = ['index.html', 'callback.html', 'order.html', '25h17n2b-sh.html'];

function getHttpFields(event) {
  const method =
    event.httpMethod ||
    event.requestContext?.http?.method ||
    event.requestContext?.httpMethod ||
    '';
  const headers = event.headers || {};
  const lower = {};
  for (const k of Object.keys(headers)) {
    lower[k.toLowerCase()] = headers[k];
  }
  let body = event.body;
  if (body == null) body = '';
  if (event.isBase64Encoded) {
    body = Buffer.from(body, 'base64').toString('utf8');
  } else {
    body = String(body);
  }
  return { method, lower, body };
}

function parseFormBody(body, contentType) {
  const ct = (contentType || '').toLowerCase();
  if (ct.includes('application/json')) {
    try {
      return JSON.parse(body || '{}');
    } catch {
      return {};
    }
  }
  const params = new URLSearchParams(body);
  const out = {};
  for (const [k, v] of params) {
    out[k] = v;
  }
  return out;
}

function response302(location) {
  return {
    statusCode: 302,
    headers: { Location: location },
    body: '',
  };
}

function response405() {
  return {
    statusCode: 405,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    body: 'Method Not Allowed',
  };
}

function response204Cors() {
  return {
    statusCode: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
    body: '',
  };
}

exports.handler = async (event) => {
  if (typeof event === 'string') {
    try {
      event = JSON.parse(event);
    } catch {
      return { statusCode: 400, headers: { 'Content-Type': 'text/plain; charset=utf-8' }, body: 'Bad Request' };
    }
  }

  const { method, lower, body } = getHttpFields(event);

  if (method === 'OPTIONS') {
    return response204Cors();
  }

  if (method !== 'POST') {
    return response405();
  }

  const contentType = lower['content-type'] || '';
  const fields = parseFormBody(body, contentType);

  const siteOrigin = (process.env.SITE_ORIGIN || '').trim().replace(/\/$/, '');
  if (!siteOrigin) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      body: 'В переменных окружения функции не задан SITE_ORIGIN (базовый URL сайта без слэша в конце).',
    };
  }

  let returnFile = String(fields._return || 'index.html');
  if (!ALLOWED_RETURN.includes(returnFile)) {
    returnFile = 'index.html';
  }

  const baseUrl = `${siteOrigin}/${returnFile}`.replace(/([^:]\/)\/+/g, '$1');

  if (String(fields.website || '').trim() !== '') {
    return response302(`${baseUrl}?sent=1`);
  }

  const name = String(fields.name || '').trim();
  const phone = String(fields.phone || '').trim();
  const message = String(fields.message || '').trim();
  let subjectLine = String(fields._subject || '').trim();
  if (!subjectLine) {
    subjectLine = 'Заявка с сайта КБ Лидер-Сталь';
  }

  const digits = phone.replace(/\D/g, '');
  if (name.length < 2 || digits.length < 10 || message.length < 10) {
    return response302(`${baseUrl}?error=1`);
  }

  const mailTo = (process.env.MAIL_TO || '').trim();
  const smtpUser = (process.env.SMTP_USER || '').trim();
  const smtpPass = (process.env.SMTP_PASSWORD || '').trim();
  const smtpFrom = (process.env.SMTP_FROM || smtpUser).trim();

  if (!mailTo || !smtpUser || !smtpPass) {
    return response302(`${baseUrl}?error=1`);
  }

  const xff = lower['x-forwarded-for'] || '';
  const clientIp = xff.split(',')[0].trim() || '—';
  const text =
    `Имя: ${name}\r\nТелефон: ${phone}\r\n\r\nСообщение:\r\n${message}\r\n\r\n---\r\nIP: ${clientIp}\r\n`;

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.yandex.ru',
    port: Number(process.env.SMTP_PORT || 465),
    secure: String(process.env.SMTP_SECURE || 'true') !== 'false',
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  try {
    await transporter.sendMail({
      from: `КБ Лидер-Сталь <${smtpFrom}>`,
      to: mailTo,
      subject: subjectLine,
      text,
      replyTo: smtpFrom,
    });
    return response302(`${baseUrl}?sent=1`);
  } catch (e) {
    console.error(e);
    return response302(`${baseUrl}?error=1`);
  }
};
