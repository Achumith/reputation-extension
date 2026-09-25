// --- popup.js (PUT THIS FILE IN YOUR extension folder) ---
// WARNING: this file contains your API key in plaintext. See security note below.
const WHOIS_API_KEY = "at_D0iPKwewv2nYyUU7Ankx4ErPGXi7u";

async function getActiveDomain() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tabs || !tabs[0] || !tabs[0].url) return null;
  try {
    const url = new URL(tabs[0].url);
    return url.hostname.replace(/^www\./, '');
  } catch (e) {
    return null;
  }
}

function daysBetween(a, b) {
  return Math.floor((b - a) / (1000 * 60 * 60 * 24));
}

function formatDate(s) {
  try {
    const d = new Date(s);
    if (isNaN(d)) return s;
    return d.toISOString().split('T')[0];
  } catch (e) {
    return s;
  }
}

async function fetchWhois(domain) {
  const url = `https://whoisxmlapi.com/whoisserver/WhoisService?apiKey=${WHOIS_API_KEY}&domainName=${domain}&outputFormat=JSON`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`WHOIS request failed (${res.status})`);
  return res.json();
}

async function fetchSSLLabs(domain) {
  // ask SSLLabs to use cached result where possible (faster)
  const url = `https://api.ssllabs.com/api/v3/analyze?host=${domain}&fromCache=on&all=done`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`SSL Labs request failed (${res.status})`);
  return res.json();
}

function setHtml(id, html) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = html;
}

async function analyze() {
  const loadingHtml = `
    <div class="loading-state">
        <div class="spinner"></div>
        <p>Detecting domain...</p>
    </div>
  `;
  setHtml('result', loadingHtml);
  
  const domain = await getActiveDomain();
  if (!domain) {
    setHtml('result', '<div class="error-message">Could not determine domain</div>');
    return;
  }

  setHtml('result', `
    <div class="loading-state">
        <div class="spinner"></div>
        <p>Checking <b>${domain}</b>...</p>
    </div>
  `);

  try {
    // WHOIS
    const whoisJson = await fetchWhois(domain);
    const record = whoisJson?.WhoisRecord || {};
    const createdDate = record.registryData?.createdDate || record.createdDate || 'Unknown';
    const registrar = record.registryData?.registrarName || record.registrarName || 'Unknown';
    const country = record.registrant?.country || 'Unknown';
    const estimatedDays = record.estimatedDomainAge ?? null;
    const domainAgeHuman = estimatedDays ? `${Math.floor(estimatedDays / 365)}y ${estimatedDays%365}d` :
                            (createdDate !== 'Unknown' ? `${Math.floor(daysBetween(new Date(createdDate), new Date())/365)}y` : 'Unknown');

    // SSL
    const sslJson = await fetchSSLLabs(domain);
    const endpoint = sslJson?.endpoints?.[0];
    const sslGrade = endpoint?.grade || (sslJson?.status === 'IN_PROGRESS' ? 'Pending' : 'Unknown');
    
    // Evaluate badge class
    let sslBadge = 'warning';
    if (['A+', 'A', 'A-'].includes(sslGrade)) sslBadge = 'good';
    if (['C', 'D', 'E', 'F', 'T', 'M'].includes(sslGrade)) sslBadge = 'bad';

    const out = `
      <div class="data-card">
          <div class="data-row">
              <span class="data-label">Domain</span>
              <span class="data-value domain-name">${domain}</span>
          </div>
          <div class="data-row">
              <span class="data-label">Registrar</span>
              <span class="data-value" title="${registrar}">${registrar}</span>
          </div>
          <div class="data-row">
              <span class="data-label">Country</span>
              <span class="data-value">${country}</span>
          </div>
          <div class="data-row">
              <span class="data-label">Created</span>
              <span class="data-value">${formatDate(createdDate)}</span>
          </div>
          <div class="data-row">
              <span class="data-label">Age</span>
              <span class="data-value">${domainAgeHuman}</span>
          </div>
          <div class="data-row">
              <span class="data-label">SSL Grade</span>
              <span class="badge ${sslBadge}">${sslGrade}</span>
          </div>
      </div>
    `;
    setHtml('result', out);
  } catch (err) {
    setHtml('result', `<div class="error-message">Error: ${err.message}</div>`);
  }
}

document.addEventListener('DOMContentLoaded', () => {
    analyze();
    const btn = document.getElementById('refresh-btn');
    if (btn) btn.addEventListener('click', analyze);
});
