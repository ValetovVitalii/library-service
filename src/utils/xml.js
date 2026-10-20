// XML ішінде арнайы таңбаларды қауіпсіз жазу
function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Объектті <tag>...</tag> түріне айналдыру
function toXml(tag, value) {
  if (value === null || value === undefined) return `<${tag}/>`;
  if (typeof value === 'object') {
    const inner = Object.entries(value)
      .map(([key, val]) => toXml(key, val))
      .join('');
    return `<${tag}>${inner}</${tag}>`;
  }
  return `<${tag}>${escapeXml(value)}</${tag}>`;
}

const HEADER = '<?xml version="1.0" encoding="UTF-8"?>';

// Бір жазба: <book>...</book>
function itemToXml(item, row) {
  return `${HEADER}\n${toXml(item, row)}`;
}

// Тізім: <books count="4"><book>...</book>...</books>
function listToXml(root, item, rows) {
  const items = rows.map((row) => `  ${toXml(item, row)}`).join('\n');
  return `${HEADER}\n<${root} count="${rows.length}">\n${items}\n</${root}>`;
}

// Клиент XML сұрады ма? (?format=xml немесе Accept тақырыбы)
function wantsXml(req) {
  if (req.query.format === 'xml') return true;
  if (req.query.format === 'json') return false;
  const accept = req.get('Accept') || '';
  // Браузер text/html жібереді, оған JSON қалдырамыз
  return accept.includes('application/xml') && !accept.includes('text/html');
}

function sendXml(res, status, xml) {
  res.status(status).type('application/xml').send(xml);
}

module.exports = { itemToXml, listToXml, wantsXml, sendXml };