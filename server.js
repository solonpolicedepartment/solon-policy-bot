const express = require('express');
const cors = require('cors');
const Anthropic = require('@anthropic-ai/sdk');
const { google } = require('googleapis');

const app = express();
app.use(cors());
app.use(express.json());

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const getAuth = () => {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  });
};

let fileCache = null;
let cacheTime = 0;
const TTL = 5 * 60 * 1000;

const getAllFiles = async () => {
  if (fileCache && Date.now() - cacheTime < TTL) return fileCache;
  const drive = google.drive({ version: 'v3', auth: getAuth() });
  let files = [], pageToken = null;
  do {
    const r = await drive.files.list({
      q: `trashed=false and (mimeType='application/pdf' or mimeType='application/vnd.google-apps.document' or mimeType='application/vnd.openxmlformats-officedocument.wordprocessingml.document' or mimeType='text/plain')`,
      fields: 'nextPageToken, files(id, name, webViewLink, mimeType)',
      pageSize: 100, orderBy: 'name',
      pageToken: pageToken || undefined,
    });
    files = files.concat(r.data.files || []);
    pageToken = r.data.nextPageToken;
  } while (pageToken);
  fileCache = files;
  cacheTime = Date.now();
  console.log(`Cached ${files.length} Drive files`);
  return files;
};

const TOPICS = {
  pursuit: ['pursuit','vehicle','chase','fleeing'],
  force: ['force','lethal','deadly','taser','baton','arc','resistance'],
  'body camera': ['video','patrol video','body cam','mvr','camera','recording'],
  bodycam: ['video','patrol video','body cam','mvr'],
  evidence: ['evidence','property','chain of custody','beast'],
  canine: ['canine','k9','dog','handler'],
  uniform: ['uniform','dress','appearance','tattoo','jewelry','body armor'],
  firearm: ['firearm','weapon','gun','range','qualification'],
  drug: ['naloxone','narcotics','drug','overdose','opioid','project dawn'],
  arrest: ['arrest','warrantless','probable cause'],
  drone: ['drone','unmanned','suas','aircraft'],
  bolawrap: ['bolawrap','bola','wrap','restraint'],
  helmet: ['helmet','ballistic','protective'],
  overtime: ['overtime','duty time','time off','shift','kelly','lunch','break'],
  sick: ['duty time','time off','sick','leave'],
  vacation: ['duty time','time off','vacation','leave'],
  hiring: ['hiring','hire','employment','background','recruit'],
  record: ['record','document','public records','retention'],
  ohleg: ['ohleg','leads','ncic'],
  training: ['training','service','in-service'],
  amber: ['amber','alert','missing child'],
  fire: ['fire','emergency'],
  media: ['media','sanitization','press','release'],
  crypto: ['crypto','virtual currency','bitcoin','digital asset'],
  detective: ['detective','bureau','investigation'],
  corrections: ['corrections','jail','inmate','detention'],
  'light duty': ['light duty','temporary','modified'],
  wellness: ['wellness','fitness','health','gym'],
  nims: ['nims','ics','operations planning','incident command'],
  citation: ['citation','voiding','ticket'],
  manpower: ['manpower','staffing','minimum'],
  privacy: ['privacy','property loss','expectation'],
  traffic: ['traffic','stop','motor vehicle','speed','ovi','dui'],
  domestic: ['domestic','violence','protection order','civil protection'],
  'mental health': ['mental health','crisis','psychiatric','cit'],
  juvenile: ['juvenile','minor','youth'],
  search: ['search','warrant','seizure','fourth amendment','consent'],
  miranda: ['miranda','rights','fifth amendment','interrogation','custody'],
  report: ['report','incident report','documentation','nibrs','rra'],
  tow: ['tow','impound','vehicle storage'],
  accident: ['accident','crash','collision'],
};

const findFiles = async (question) => {
  try {
    const files = await getAllFiles();
    const q = question.toLowerCase();
    let terms = q.split(' ').filter(w => w.length > 3);
    for (const [key, vals] of Object.entries(TOPICS)) {
      if (q.includes(key)) terms = [...terms, ...vals];
    }
    const scored = files.map(f => {
      const n = f.name.toLowerCase();
      let score = 0;
      for (const t of terms) if (n.includes(t)) score += 3;
      if (/g\d{4}/i.test(f.name)) score += 1;
      return { ...f, score };
    });
    return scored.filter(f => f.score > 0).sort((a, b) => b.score - a.score).slice(0, 4);
  } catch (e) {
    console.error('Search error:', e.message);
    return [];
  }
};

const readFile = async (fileId, mimeType) => {
  try {
    const drive = google.drive({ version: 'v3', auth: getAuth() });
    if (mimeType === 'application/vnd.google-apps.document') {
      const r = await drive.files.export({ fileId, mimeType: 'text/plain' });
      return String(r.data).slice(0, 6000);
    }
    const r = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'arraybuffer' });
    return Buffer.from(r.data).toString('utf8', 0, 8000)
      .replace(/[^\x20-\x7E\n\r\t]/g, ' ').replace(/\s{3,}/g, '\n').trim();
  } catch (e) {
    console.error('Read error:', e.message);
    return null;
  }
};

const SYSTEM = `You are the Solon PD Assistant — a comprehensive reference tool for officers, supervisors, and staff of the Solon Police Department. You provide accurate, practical, cited answers on:

1. SOLON PD GENERAL ORDERS & POLICIES — All department SOPs and procedures. Cite as [G2311-63 Use of Force Policy]
2. OHIO REVISED CODE — State criminal, traffic, and civil statutes. Cite as [ORC 2935.03] or [ORC 4511.19]
3. SOLON CITY ORDINANCES — Full code at https://codelibrary.amlegal.com/codes/solon/latest/solon_oh/0-0-0-1. Key parts: Part Four (Traffic), Part Six (General Offenses). Cite as [Solon Ord. 333.01]. Always include the link when answering ordinance questions.
4. CONSTITUTIONAL & CASE LAW — 4th, 5th, 14th Amendment, Miranda v. Arizona, Graham v. Connor, Tennessee v. Garner, Terry v. Ohio, etc.
5. LAW ENFORCEMENT PROCEDURES — Arrests, searches, traffic stops, OVI, domestic violence, juveniles, mental health crisis response, report writing, NIBRS
6. COMMUNITY RESOURCES — Mental health, victim services, local contacts

RULES:
- Prioritize content from Google Drive documents when provided
- Always cite your source — GO number, ORC section, case name, or ordinance number
- Be direct and practical — officers need quick, usable answers
- If Drive content doesn't fully answer the question, answer from your training knowledge with citations
- Flag anything that may have changed recently and recommend verification
- For ordinance questions always include: https://codelibrary.amlegal.com/codes/solon/latest/solon_oh/0-0-0-1
- End with: **Source:** [citation] and 🔗 **View Document:** [URL] when a Drive file is relevant`;

app.get('/', (req, res) => res.json({ status: 'Solon PD Assistant running' }));

app.post('/chat', async (req, res) => {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) return res.status(400).json({ error: 'messages required' });

  try {
    const question = messages[messages.length - 1]?.content || '';
    const files = await findFiles(question);
    let context = '', links = [];

    for (const f of files) {
      const content = await readFile(f.id, f.mimeType);
      if (content && content.length > 100) {
        context += `\n\n=== ${f.name} ===\n${content.slice(0, 5000)}`;
        links.push(`${f.name}: ${f.webViewLink}`);
      } else {
        links.push(`${f.name}: ${f.webViewLink}`);
      }
    }

    const system = SYSTEM +
      (context ? `\n\n=== SOLON PD DOCUMENTS FROM GOOGLE DRIVE ===\n${context}` : '') +
      (links.length ? `\n\n=== DOCUMENT LINKS ===\n${links.join('\n')}` : '');

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      system,
      messages,
    });

    const reply = response.content.filter(b => b.type === 'text').map(b => b.text).join('\n');
    res.json({ reply });
  } catch (e) {
    console.error('Error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Solon PD Assistant running on port ${PORT}`));
