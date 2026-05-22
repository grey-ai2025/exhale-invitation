// One-off build script: re-encrypts the invitation body and writes a new
// password-gated index.html.
//
// To rebuild:  node _build.mjs
// Password is read from PASSWORD env var, defaulting to 'Bespoke-2026'.
//
// _source.html holds the unencrypted invitation body (header/body/footer rows)
// that gets injected after a correct password.

import { readFileSync, writeFileSync } from 'node:fs';
import { randomBytes, pbkdf2Sync, createCipheriv } from 'node:crypto';

const PASSWORD = process.env.PASSWORD || 'Bespoke-2026';
const ITER = 200000;

// Read the unencrypted source content
const sourceHtml = readFileSync(new URL('./_source.html', import.meta.url), 'utf8').trim();

// Encrypt
const salt = randomBytes(16);
const iv = randomBytes(12);
const key = pbkdf2Sync(PASSWORD, salt, ITER, 32, 'sha256');
const cipher = createCipheriv('aes-256-gcm', key, iv);
const ct = Buffer.concat([cipher.update(sourceHtml, 'utf8'), cipher.final()]);
const tag = cipher.getAuthTag();
const blob = Buffer.concat([ct, tag]); // Web Crypto AES-GCM expects ct||tag

const payload = {
  salt: salt.toString('base64'),
  iv: iv.toString('base64'),
  ct: blob.toString('base64'),
  iter: ITER,
};

const out = buildPage(payload);
writeFileSync(new URL('./index.html', import.meta.url), out, 'utf8');
console.log('Encrypted', sourceHtml.length, 'chars ->', blob.length, 'bytes ciphertext');
console.log('Wrote index.html (' + out.length + ' bytes)');

function buildPage(payload) {
  const payloadJson = JSON.stringify(payload);
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex, nofollow">
<title>Private — Exhale</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=DM+Sans:wght@300;400;500;600;700&family=Inter:wght@300;400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; }
  body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; font-family: 'DM Sans', Arial, 'Segoe UI', 'Helvetica Neue', sans-serif !important; }
  table, td { mso-table-rspace: 0pt; mso-table-lspace: 0pt; border-collapse: collapse !important; }
  img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
  body { margin: 0; padding: 0; width: 100%; background: #1a1a1a; color: #f5f5f5; line-height: 1.6; }
  @media screen and (max-width: 600px) {
    .mobile-padding { padding-left: 20px !important; padding-right: 20px !important; }
    .wrapper { width: 95% !important; max-width: 95% !important; }
  }
  h1 { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 2.75rem; font-weight: 400; font-style: italic; margin: 0 0 8px; color: #f5f5f5; letter-spacing: 0.005em; line-height: 1.1; }
  h2 { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 1.2rem; font-weight: 300; margin: 36px 0 14px; color: #ADFBF6; letter-spacing: 0.18em; padding-left: 0.18em; text-transform: uppercase; text-shadow: 0 0 8px rgba(173,251,246,0.45), 0 0 24px rgba(173,251,246,0.20); line-height: 1; }
  p { margin: 0 0 16px; font-size: 1rem; font-weight: 400; color: rgba(245,245,245,0.85); }
  strong { color: #f5f5f5; font-weight: 600; }
  a { color: #ADFBF6; }
  .footer { background: #050507; border-top: 1px solid rgba(173,251,246,0.10); }
  .exhale-mark { font-family: 'Cormorant Garamond', Georgia, serif; font-weight: 500; font-size: 1.2em; color: #ADFBF6; text-transform: uppercase; }
  .key { font-family: 'Cormorant Garamond', Georgia, serif; font-style: italic; font-weight: 555; font-size: 1.2em; color: #ADFBF6; }

  /* --- Gate --- */
  .gate { padding: 80px 40px; text-align: center; }
  .gate .eyebrow { font-family: 'Inter', sans-serif; font-size: 0.7rem; font-weight: 500; color: rgba(245,245,245,0.45); letter-spacing: 0.32em; padding-left: 0.32em; text-transform: uppercase; margin-bottom: 28px; }
  .gate .gate-title { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 2rem; font-style: italic; font-weight: 400; color: #f5f5f5; margin: 8px 0 12px; }
  .gate .gate-sub { font-size: 0.95rem; color: rgba(245,245,245,0.65); max-width: 380px; margin: 0 auto 32px; line-height: 1.55; }
  .gate form { max-width: 360px; margin: 0 auto; }
  .gate input[type="password"] {
    display: block; width: 100%;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(173,251,246,0.18);
    border-radius: 10px;
    padding: 14px 18px;
    color: #f5f5f5;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.95rem;
    letter-spacing: 0.08em;
    outline: none;
    transition: border-color 0.18s, background 0.18s;
    text-align: center;
  }
  .gate input[type="password"]:focus { border-color: rgba(173,251,246,0.55); background: rgba(255,255,255,0.06); }
  .gate input[type="password"]::placeholder { color: rgba(245,245,245,0.30); letter-spacing: 0.12em; }
  .gate button {
    display: inline-block; margin-top: 18px;
    background: #ADFBF6; color: #0a0a0f;
    font-family: 'DM Sans', sans-serif; font-weight: 600; font-size: 0.95rem; letter-spacing: 0.04em;
    border: none; border-radius: 50px;
    padding: 14px 36px;
    cursor: pointer;
    box-shadow: 0 8px 24px rgba(173,251,246,0.30);
    transition: transform 0.15s, box-shadow 0.15s, opacity 0.15s;
  }
  .gate button:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 12px 28px rgba(173,251,246,0.40); }
  .gate button:disabled { opacity: 0.55; cursor: progress; }
  .gate-error { color: #EC8E8E; font-size: 0.85rem; margin-top: 14px; min-height: 1.2em; }
  .gate-foot { margin-top: 56px; font-size: 0.75rem; color: rgba(245,245,245,0.35); font-style: italic; font-family: 'Cormorant Garamond', Georgia, serif; }
</style>
</head>
<body>
<div style="display:none; max-height:0; overflow:hidden; mso-hide:all; visibility:hidden; opacity:0; color:transparent; height:0; width:0; font-size:1px; line-height:1px;">A private invitation from the team at Grey AI.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="min-height:100vh; background:#1a1a1a;">
  <tr>
    <td align="center" style="padding:40px 20px;">
      <table role="presentation" width="1000" cellpadding="0" cellspacing="0" class="wrapper" id="card" style="background:#0a0a0f; border-radius:24px; overflow:hidden; box-shadow:0 30px 80px rgba(0,0,0,0.6), 0 0 80px rgba(92,236,211,0.10); border:1px solid rgba(173,251,246,0.18);">

        <!-- HEADER (always visible) -->
        <tr id="card-header-row">
          <td align="center" style="background:#0a0a0f; padding:56px 20px 36px; border-bottom:1px solid rgba(173,251,246,0.12);">
            <div style="font-family:'Cormorant Garamond', Georgia, serif; font-weight:300; font-size:2.75rem; color:#ADFBF6; letter-spacing:0.18em; padding-left:0.18em; text-transform:uppercase; text-shadow:0 0 10px rgba(173,251,246,0.85), 0 0 30px rgba(173,251,246,0.5), 0 0 60px rgba(173,251,246,0.3); line-height:1;">EXHALE</div>
            <div style="font-family:'Inter', Arial, sans-serif; font-size:0.7rem; font-weight:500; color:rgba(245,245,245,0.45); letter-spacing:0.32em; padding-left:0.32em; text-transform:uppercase; margin-top:16px;">by Grey AI</div>
          </td>
        </tr>

        <!-- GATE row (replaced by decrypted invitation content on success) -->
        <tr id="gate-row">
          <td>
            <div class="gate">
              <div class="eyebrow">Private · Invitation-only</div>
              <div class="gate-title">A small invitation.</div>
              <p class="gate-sub">Please enter the code you were sent to view it.</p>
              <form id="gate-form" autocomplete="off">
                <input type="password" id="gate-pw" name="code" placeholder="Code" autocomplete="off" autofocus required>
                <div>
                  <button type="submit" id="gate-submit">Continue →</button>
                </div>
                <div class="gate-error" id="gate-error" role="status" aria-live="polite"></div>
              </form>
              <div class="gate-foot">If you don't have a code, this isn't your time.</div>
            </div>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>

<script id="payload" type="application/json">${payloadJson}</script>
<script>
(function(){
  var SS_KEY = 'exhale_inv_unlock_v1';

  function b64ToBytes(b64){
    var bin = atob(b64);
    var out = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  async function decrypt(password){
    var p = JSON.parse(document.getElementById('payload').textContent);
    var enc = new TextEncoder();
    var km = await crypto.subtle.importKey('raw', enc.encode(password), { name: 'PBKDF2' }, false, ['deriveKey']);
    var key = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: b64ToBytes(p.salt), iterations: p.iter, hash: 'SHA-256' },
      km,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );
    var pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64ToBytes(p.iv) }, key, b64ToBytes(p.ct));
    return new TextDecoder().decode(pt);
  }

  function reveal(innerRowsHtml){
    var card = document.getElementById('card');
    if (!card) return;
    // Replace the GATE row with the decrypted invitation rows (HEADER + BODY + FOOTER).
    // Easiest: rebuild the whole card body. The decrypted blob contains all three rows.
    card.innerHTML = innerRowsHtml;
  }

  async function tryUnlock(password, opts){
    opts = opts || {};
    var btn = document.getElementById('gate-submit');
    var err = document.getElementById('gate-error');
    if (btn && !opts.silent){ btn.disabled = true; btn.textContent = 'Unlocking…'; }
    if (err) err.textContent = '';
    try {
      var html = await decrypt(password);
      reveal(html);
      try { sessionStorage.setItem(SS_KEY, password); } catch(_){}
    } catch (e){
      if (btn){ btn.disabled = false; btn.textContent = 'Continue →'; }
      if (!opts.silent && err) err.textContent = "That code didn't unlock it. Double-check or reach out to the person who invited you.";
      try { sessionStorage.removeItem(SS_KEY); } catch(_){}
    }
  }

  document.addEventListener('DOMContentLoaded', function(){
    var form = document.getElementById('gate-form');
    if (form){
      form.addEventListener('submit', function(e){
        e.preventDefault();
        var pw = (document.getElementById('gate-pw').value || '').trim();
        if (!pw) return;
        tryUnlock(pw, { silent: false });
      });
    }
    var remembered = null;
    try { remembered = sessionStorage.getItem(SS_KEY); } catch(_){}
    if (remembered) tryUnlock(remembered, { silent: true });
  });
})();
</script>
</body>
</html>
`;
}
