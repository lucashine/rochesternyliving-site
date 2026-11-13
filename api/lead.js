/**
 * Lead intake — Vercel serverless function.
 *
 * Every form on the site posts JSON here. This does three things, in order of
 * how much it matters:
 *
 *   1. Emails Lucas.        Always. This is the safety net — if the CRM is
 *                           misconfigured or down, the lead still reaches a human.
 *   2. Forwards to the CRM. Only if CRM_WEBHOOK_URL is set. A failure here is
 *                           logged but never fails the request, because a lead
 *                           that reached the inbox is not a lost lead.
 *   3. Returns 200.         So the visitor sees a confirmation.
 *
 * Environment variables (set in Vercel → Project → Settings → Environment Variables):
 *
 *   LEAD_NOTIFY_EMAIL   Where lead notifications go.        e.g. lucashine@kw.com
 *   RESEND_API_KEY      API key for Resend (resend.com), used to send the email.
 *   RESEND_FROM         Verified sender.  e.g. "Rochester NY Living <leads@rochesternyliving.com>"
 *   CRM_WEBHOOK_URL     Optional. CRM inbound webhook. Receives the full JSON payload.
 *   CRM_WEBHOOK_HEADER  Optional. Auth header name,  e.g. "Authorization"
 *   CRM_WEBHOOK_TOKEN   Optional. Auth header value, e.g. "Bearer abc123"
 *
 * Nothing here is CRM-specific on purpose. Most CRMs accept an inbound webhook
 * with a JSON body; the ones that don't accept a parsed email instead, which the
 * notification email already covers.
 */

const FIELD_LABELS = {
  name: 'Name',
  email: 'Email',
  phone: 'Phone',
  timeline: 'Timeline',
  property_address: 'Property address',
  wants_walkthrough: 'Wants walkthrough',
  message: 'Message',
  rating: 'Rating',
  review: 'Review',
  role: 'Worked together as',
  town: 'Town',
  closing_month: 'Closed',
  consent: 'Consent to publish',
  form_name: 'Form',
  page_url: 'Submitted from',
  page_title: 'Page title'
};

function clean(str, max) {
  return String(str == null ? '' : str).slice(0, max || 2000).trim();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let data = req.body;
  if (typeof data === 'string') {
    try { data = JSON.parse(data); } catch (_) { data = {}; }
  }
  data = data || {};

  // Honeypot: bots fill hidden fields, people don't. Accept and discard silently
  // so the bot doesn't learn it was caught.
  if (clean(data.company)) return res.status(200).json({ ok: true });

  // The review form collects a first name and a last initial rather than a full
  // name, because that pair IS the published byline and the full surname is
  // deliberately never asked for. Compose it here so a review satisfies the same
  // name + email requirement every other form does. Without this, every review
  // submission is rejected with a 400 and never reaches the inbox.
  if (!data.name && (data.first_name || data.last_initial)) {
    const first = clean(data.first_name, 60);
    const initial = clean(data.last_initial, 1).toUpperCase();
    data.name = initial ? `${first} ${initial}.` : first;
  }

  const name = clean(data.name, 120);
  const email = clean(data.email, 200);
  if (!name || !email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return res.status(400).json({ error: 'Please include your name and a valid email address.' });
  }

  const lead = {
    name,
    email,
    phone: clean(data.phone, 60),
    timeline: clean(data.timeline, 120),
    property_address: clean(data.property_address, 250),
    wants_walkthrough: clean(data.wants_walkthrough, 120),
    message: clean(data.message, 5000),
    rating: clean(data.rating, 4),
    review: clean(data.review, 5000),
    role: clean(data.role, 40),
    town: clean(data.town, 120),
    closing_month: clean(data.closing_month, 20),
    consent: clean(data.consent, 10) ? 'Yes' : '',
    form_name: clean(data.form_name, 60) || 'contact',
    page_url: clean(data.page_url, 300),
    page_title: clean(data.page_title, 200),
    source: 'rochesternyliving.com',
    submitted_at: new Date().toISOString()
  };

  // Plain-text body. The inbox is monitored by an assistant and/or Claude, so keep
  // this rigidly structured: one "Label: value" per line, no prose, easy to parse.
  const textBody = Object.keys(FIELD_LABELS)
    .filter((k) => lead[k])
    .map((k) => `${FIELD_LABELS[k]}: ${lead[k]}`)
    .join('\n') + `\nSource: ${lead.source}\nSubmitted: ${lead.submitted_at}`;

  const rows = Object.keys(FIELD_LABELS)
    .filter((k) => lead[k])
    .map((k) => `<tr><td style="padding:6px 14px 6px 0;color:#666;white-space:nowrap;vertical-align:top">${FIELD_LABELS[k]}</td><td style="padding:6px 0"><strong>${escapeHtml(lead[k])}</strong></td></tr>`)
    .join('');

  const isReview = lead.form_name === 'review';

  const subject = isReview
    ? `New review — ${lead.rating || '?'}/5 from ${lead.name}`
    : lead.form_name === 'valuation'
      ? `Valuation request — ${lead.name}${lead.property_address ? ' — ' + lead.property_address : ''}`
      : `New lead — ${lead.name}`;

  // A review is not a lead. It is advertising copy awaiting approval, written by
  // someone with no fair housing training, that will sit under a license number.
  // So the rules and the paste-ready block travel WITH it — approving one should
  // be a read and a copy, not a trip back to the README.
  const pasteBlock = isReview ? [
    '{',
    '  name:   ' + JSON.stringify(lead.name) + ',',
    '  rating: ' + (Number(lead.rating) || 0) + ',',
    '  role:   ' + JSON.stringify(lead.role) + ',',
    '  town:   ' + JSON.stringify(lead.town) + ',',
    '  date:   ' + JSON.stringify(lead.closing_month || lead.submitted_at.slice(0, 7)) + ',',
    '  text:   ' + JSON.stringify(lead.review),
    '},'
  ].join('\n') : '';

  const reviewNotes = isReview ? (
    '\n\n' + '-'.repeat(64) + '\n' +
    'NOT PUBLISHED. Nothing appears on the site until you paste it in.\n' +
    (lead.consent ? '' : '\n!! CONSENT BOX WAS NOT TICKED — do not publish. Ask first.\n') +
    '\nFOUR CHECKS BEFORE PUBLISHING\n' +
    '  1. Nothing identifies the house — no surname, street, or house number.\n' +
    '  2. No fair housing language. CUT it, do not reword it:\n' +
    '     family / safe / good schools / up-and-coming / quiet / friendly\n' +
    '     neighbors / anything describing WHO lives somewhere.\n' +
    '     Describing a PLACE is fine. Describing PEOPLE is not.\n' +
    '  3. Dollar outcomes: their past fact in their words is fine. A page that\n' +
    '     reads as a promise of future results is not (19 NYCRR 175.25(c)(10)).\n' +
    '  4. Trim only for length, privacy, and 2-3. Never upgrade a rating.\n' +
    '\nTO PUBLISH — paste at the top of site/assets/reviews-data.js:\n\n' +
    pasteBlock + '\n\n' +
    'Full rules: REVIEWS-README.md, section 3.\n'
  ) : '';

  const reviewNotesHtml = isReview ? (
    '<hr style="margin:22px 0;border:0;border-top:1px solid #e0dbd2">' +
    '<p style="margin:0 0 10px"><strong>Not published.</strong> Nothing appears on the site until you paste it in.</p>' +
    (lead.consent ? '' : '<p style="margin:0 0 10px;padding:10px 12px;background:#fbeae4;color:#8a3d16;border-radius:6px"><strong>Consent box was not ticked — do not publish. Ask first.</strong></p>') +
    '<p style="margin:0 0 6px"><strong>Four checks before publishing</strong></p>' +
    '<ol style="margin:0 0 14px;padding-left:20px;color:#47564f">' +
    '<li>Nothing identifies the house &mdash; no surname, street, or house number.</li>' +
    '<li>No fair housing language. <strong>Cut it, do not reword it:</strong> family / safe / good schools / up-and-coming / quiet / friendly neighbors / anything describing <em>who</em> lives somewhere. Describing a place is fine; describing people is not.</li>' +
    '<li>Dollar outcomes: their past fact in their words is fine. A page that reads as a promise of future results is not (19 NYCRR 175.25(c)(10)).</li>' +
    '<li>Trim only for length, privacy, and 2&ndash;3. Never upgrade a rating.</li>' +
    '</ol>' +
    '<p style="margin:0 0 6px"><strong>To publish</strong> &mdash; paste at the top of <code>site/assets/reviews-data.js</code>:</p>' +
    '<pre style="background:#f2efe9;padding:12px 14px;border-radius:6px;overflow-x:auto;font-size:13px;line-height:1.5">' +
    escapeHtml(pasteBlock) + '</pre>' +
    '<p style="margin:0;color:#75837c;font-size:13px">Full rules: REVIEWS-README.md, section 3.</p>'
  ) : '';

  // --- 1. Email notification (the safety net) ---
  let emailed = false;
  if (process.env.RESEND_API_KEY && process.env.LEAD_NOTIFY_EMAIL) {
    try {
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM || 'Rochester NY Living <onboarding@resend.dev>',
          to: process.env.LEAD_NOTIFY_EMAIL.split(',').map((e) => e.trim()).filter(Boolean),
          reply_to: lead.email,
          subject,
          text: textBody + reviewNotes,
          html: `<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;font-size:15px;line-height:1.6;color:#16211c">
            <h2 style="margin:0 0 14px;font-size:18px">${escapeHtml(subject)}</h2>
            <table style="border-collapse:collapse">${rows}</table>
            <p style="margin-top:18px"><a href="mailto:${escapeHtml(lead.email)}">Reply to ${escapeHtml(lead.name)}</a></p>
            ${reviewNotesHtml}
          </div>`
        })
      });
      emailed = r.ok;
      if (!r.ok) console.error('Resend failed', r.status, await r.text());
    } catch (err) {
      console.error('Resend threw', err);
    }
  } else {
    console.warn('Lead received but email is not configured. Payload:', JSON.stringify(lead));
  }

  // --- 2. CRM forward (best effort, never fails the request) ---
  let crmDelivered = false;
  if (process.env.CRM_WEBHOOK_URL) {
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (process.env.CRM_WEBHOOK_HEADER && process.env.CRM_WEBHOOK_TOKEN) {
        headers[process.env.CRM_WEBHOOK_HEADER] = process.env.CRM_WEBHOOK_TOKEN;
      }
      const r = await fetch(process.env.CRM_WEBHOOK_URL, {
        method: 'POST', headers, body: JSON.stringify(lead)
      });
      crmDelivered = r.ok;
      if (!r.ok) console.error('CRM webhook failed', r.status, await r.text());
    } catch (err) {
      console.error('CRM webhook threw', err);
    }
  }

  if (!emailed && !crmDelivered) {
    // Nothing is configured yet. The lead is in the function log, but a visitor
    // should not be told "thanks" when nobody was actually notified.
    return res.status(500).json({ error: 'Lead delivery is not configured yet.' });
  }

  return res.status(200).json({ ok: true });
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}
