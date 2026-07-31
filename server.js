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

// Cache all files including subfolders
let fileCache = null;
let cacheTime = 0;
const TTL = 3 * 60 * 1000; // 3 minutes

const getAllFiles = async () => {
  if (fileCache && Date.now() - cacheTime < TTL) return fileCache;
  const drive = google.drive({ version: 'v3', auth: getAuth() });
  let files = [], pageToken = null;

  // Search ALL files across ALL folders and subfolders
  do {
    const r = await drive.files.list({
      q: `trashed=false and (
        mimeType='application/pdf' or 
        mimeType='application/vnd.google-apps.document' or 
        mimeType='application/vnd.openxmlformats-officedocument.wordprocessingml.document' or
        mimeType='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' or
        mimeType='application/vnd.google-apps.spreadsheet' or
        mimeType='text/plain' or
        mimeType='application/msword'
      )`,
      fields: 'nextPageToken, files(id, name, webViewLink, mimeType, parents, description)',
      pageSize: 100,
      orderBy: 'name',
      pageToken: pageToken || undefined,
      spaces: 'drive',
    });
    files = files.concat(r.data.files || []);
    pageToken = r.data.nextPageToken;
  } while (pageToken);

  fileCache = files;
  cacheTime = Date.now();
  console.log(`Cached ${files.length} Drive files from all folders`);
  return files;
};

// Read file content with better extraction
const readFile = async (fileId, mimeType) => {
  try {
    const drive = google.drive({ version: 'v3', auth: getAuth() });

    // Google Docs - export as plain text (best quality)
    if (mimeType === 'application/vnd.google-apps.document') {
      const r = await drive.files.export({ fileId, mimeType: 'text/plain' });
      return String(r.data).slice(0, 8000);
    }

    // Google Sheets - export as CSV
    if (mimeType === 'application/vnd.google-apps.spreadsheet') {
      const r = await drive.files.export({ fileId, mimeType: 'text/csv' });
      return String(r.data).slice(0, 8000);
    }

    // Word docs - export as plain text
    if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        mimeType === 'application/msword') {
      try {
        const r = await drive.files.export({ fileId, mimeType: 'text/plain' });
        return String(r.data).slice(0, 8000);
      } catch {
        const r = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'arraybuffer' });
        return Buffer.from(r.data).toString('utf8', 0, 8000)
          .replace(/[^\x20-\x7E\n\r\t]/g, ' ').replace(/\s{3,}/g, '\n').trim();
      }
    }

    // PDFs and other files - download and extract text
    const r = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'arraybuffer' });
    const text = Buffer.from(r.data).toString('utf8', 0, 10000)
      .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
      .replace(/\s{3,}/g, '\n')
      .trim();

    // Check if we got readable text (not binary garbage)
    const readableChars = (text.match(/[a-zA-Z\s]/g) || []).length;
    const totalChars = text.length;
    if (totalChars > 0 && readableChars / totalChars > 0.5) {
      return text.slice(0, 8000);
    }
    return null; // Scanned PDF - return null
  } catch (e) {
    console.error('Read error:', e.message);
    return null;
  }
};

// Comprehensive topic mapping
const TOPICS = {
  pursuit: ['pursuit','vehicle','chase','fleeing'],
  force: ['force','lethal','deadly','taser','baton','arc','resistance','use of force'],
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
  sick: ['sick','sick leave','illness'],
  vacation: ['vacation','leave','time off'],
  holiday: ['holiday','paid holiday','kelly day'],
  hiring: ['hiring','hire','employment','background','recruit'],
  record: ['record','document','public records','retention'],
  ohleg: ['ohleg','leads','ncic'],
  training: ['training','service','in-service'],
  amber: ['amber','alert','missing child'],
  fire: ['fire','emergency'],
  media: ['media','sanitization','press','release'],
  crypto: ['crypto','virtual currency','bitcoin','digital asset','cryptocurrency'],
  detective: ['detective','bureau','investigation','callout','call-out'],
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
  cba: ['cba','contract','collective bargaining','opba','union','grievance','arbitration'],
  discipline: ['discipline','disciplinary','discharge','suspension','termination','just cause'],
  grievance: ['grievance','arbitration','opba','union'],
  pay: ['pay','salary','wage','compensation','longevity','rate'],
  insurance: ['insurance','health','medical','cobra','deductible'],
  tuition: ['tuition','reimbursement','education','school'],
  layoff: ['layoff','laid off','recall','seniority'],
  probationary: ['probationary','probation','new employee','new hire'],
  'drug testing': ['drug test','alcohol test','random test','reasonable suspicion'],
  maps: ['map','maps','zone','zones','boundary','boundaries','district','sector','beat','jurisdiction','police zone','blank map','patrol area'],
  'zone 5': ['zone','zone 5','police zone','sector','beat','patrol zone'],
  marijuana: ['marijuana','cannabis','weed','thc','hemp'],
  alcohol: ['alcohol','open container','underage','liquor'],
  cheat: ['cheat','cheat sheet','quick reference','reference card'],
  sop: ['sop','standard operating','procedure'],
  'job description': ['job description','duties','responsibilities','job desc'],
  communications: ['communications','dispatch','radio','911'],
  court: ['court','court time','testimony','subpoena'],
  'use of force': ['use of force','force continuum','arc','less lethal'],
  strangulation: ['strangulation','strangling','choking','neck','throttle'],
  warrant: ['warrant','search warrant','arrest warrant','no knock'],
};

// Score files by relevance - checks both filename AND content keywords
const findFiles = async (question) => {
  try {
    const files = await getAllFiles();
    const q = question.toLowerCase();

    // Build search terms from question
    let terms = q.split(/\s+/).filter(w => w.length > 2);

    // Add mapped topic terms
    for (const [key, vals] of Object.entries(TOPICS)) {
      if (q.includes(key)) terms = [...new Set([...terms, ...vals])];
    }

    // Score each file
    const scored = files.map(f => {
      const name = f.name.toLowerCase();
      let score = 0;

      // Score by filename matches
      for (const t of terms) {
        if (name.includes(t)) score += 3;
      }

      // Boost General Orders
      if (/g\d{4}/i.test(f.name)) score += 1;

      // Boost files with exact question words in name
      const qWords = q.split(/\s+/).filter(w => w.length > 3);
      for (const w of qWords) {
        if (name.includes(w)) score += 2;
      }

      return { ...f, score };
    });

    // Return top 5 most relevant files (increased from 4)
    const relevant = scored.filter(f => f.score > 0).sort((a, b) => b.score - a.score).slice(0, 5);

    // If nothing scored, do a broader search
    if (relevant.length === 0) {
      const broader = scored.sort((a, b) => b.score - a.score).slice(0, 2);
      return broader.filter(f => f.score > 0);
    }

    return relevant;
  } catch (e) {
    console.error('Search error:', e.message);
    return [];
  }
};

const BAKED_CONTENT = `
=== SOLON CITY ORDINANCES (2026 S-12 Supplement) ===
Full code: https://codelibrary.amlegal.com/codes/solon/latest/solon_oh/0-0-0-1

SPEED LIMITS [Solon Ord. 434.03]: 25 mph school zones; 25 mph business/residence districts; 35 mph suburban residential; 55 mph rural/state routes. Must maintain assured clear distance ahead at all times.
OVI [Solon Ord. 434.01]: BAC >= 0.08% but < 0.17% = OVI (M1 minimum). BAC >= 0.17% = high test OVI with enhanced penalties. 1st offense = 3 days to 6 months jail; mandatory license suspension. 2nd offense within 10 years: 10 days to 6 months. 3rd offense: 30 days mandatory. 4th+ = felony.
RECKLESS OPERATION [Solon Ord. 434.02]: Willful/wanton disregard for safety. 1st offense M4; 2nd offense M3.
STREET RACING [Solon Ord. 434.07]: Participating, spectating, aiding = M1. Repeat = felony.
ACCIDENTS [Solon Ord. 436.11]: Driver must stop, give info, render aid. Failure to stop = M1 (injury) or felony (death). Must report accidents with injury/death or damage >$1,000.
DRIVING UNDER SUSPENSION [Solon Ord. 436.071]: M1; mandatory additional suspension.
TEXTING/HANDHELD [Solon Ord. 432.42]: No texting or handheld device use while driving.
SEAT BELTS [Solon Ord. 432.44]: Required all front-seat occupants. Children under 8 = child restraint. Minor misdemeanor, no points.
MOVE OVER LAW [Solon Ord. 432.40]: Must change lanes or slow for stationary emergency vehicles with lights on.
OVERNIGHT PARKING [Solon Ord. 452.14]: No parking on public streets 2:00 AM - 6:00 AM without permit.
OFFENSE CLASSIFICATIONS [Solon Ord. 606.03]: M1=180 days/$1,000; M2=90 days/$750; M3=60 days/$500; M4=30 days/$250; Minor Misd=fine only up to $150.
OBSTRUCTING OFFICIAL BUSINESS [Solon Ord. 606.14]: M2. If creates risk of physical harm = F5.
RESISTING ARREST [Solon Ord. 606.16]: M2.
FAILURE TO COMPLY/FLEEING [Solon Ord. 606.165]: Failure to comply with traffic order = M1. Willfully fleeing police in motor vehicle = felony (F4 no substantial risk; F3 substantial risk).
ALCOHOL - OPEN CONTAINER IN VEHICLE [Solon Ord. 612.04]: Minor misdemeanor.
ALCOHOL - UNDERAGE POSSESSION [Solon Ord. 612.09]: Minor misdemeanor 1st offense; M4 subsequent.
CANNABIS - ADULT POSSESSION [Solon Ord. 624.02]: Adults 21+ may possess up to 2.5 oz. No public consumption. No use while driving.
DOGS ON LEASH [Solon Ord. 618.16]: Dogs must be on leash when off owner's property. Minor misdemeanor.
NO FEEDING DEER [Solon Ord. 618.127]: Minor misdemeanor.

=== OHIO REVISED CODE REFERENCE ===
OFFENSE CLASSIFICATIONS [ORC 2901.02]: F1-F5 felonies; M1(180 days/$1,000) through M4(30 days/$250); Minor Misdemeanor (fine only up to $150).
MENTAL STATES [ORC 2901.22]: Purposely=specific intent; Knowingly=aware conduct will probably cause result; Recklessly=conscious disregard of substantial risk; Negligently=failure to perceive risk.
SELF-DEFENSE/NO DUTY TO RETREAT [ORC 2901.05/2901.09]: Prosecution must prove BEYOND REASONABLE DOUBT defendant did NOT act in self-defense. No duty to retreat if in a place lawfully allowed to be. Castle doctrine presumption applies when force used against unlawful entry into residence or vehicle.
AGGRAVATED MURDER [ORC 2903.01]: Death or life imprisonment. Purposely with prior calculation and design; or during certain felonies; or victim under 13; or victim is LEO the offender knows is LEO engaged in duties.
MURDER [ORC 2903.02]: 15 years to life. Purposely cause death; or cause death as proximate result of committing F1/F2 offense of violence.
FELONIOUS ASSAULT [ORC 2903.11]: F2 (F1 if victim is peace officer). Knowingly cause serious physical harm; or cause/attempt physical harm by deadly weapon.
ASSAULT [ORC 2903.13]: Generally M1. Against peace officer/firefighter/EMS in performance of duties = F4 (mandatory minimum 12 months if serious physical harm to peace officer).
STRANGULATION [ORC 2903.18]: Impeding breathing/circulation by pressure to throat/neck or covering nose/mouth. Cause serious physical harm = F2; Substantial risk of serious physical harm = F3; Physical harm to family/household member = F4.
OBSTRUCTING OFFICIAL BUSINESS [ORC 2921.31]: M2 generally; F5 if creates risk of physical harm.
RESISTING ARREST [ORC 2921.33]: (A) Recklessly resist lawful arrest = M2; (B) + causes physical harm to LEO = M1; (C) + deadly weapon or brandishes weapon = F4.
WARRANTLESS ARREST AUTHORITY [ORC 2935.03]: General authority to arrest persons found violating law within jurisdiction. Extended authority for: offenses of violence, DV, protection order violations, menacing by stalking, aggravated trespass, theft offenses, felony drug offenses. PREFERRED COURSE OF ACTION for DV = arrest. Officer choosing NOT to arrest must document clear reasons. Cell space cannot be considered. No victim consent required.
HOT PURSUIT [ORC 2935.03(D)]: May pursue outside jurisdiction if: pursuit begins without unreasonable delay; initiated within jurisdiction; offense is felony, M1, M2, or point-chargeable offense.
DOMESTIC VIOLENCE [ORC 2919.25]: (A) Knowingly cause/attempt physical harm to family/household member; (B) Recklessly cause SERIOUS physical harm; (C) Threat of force causing belief of imminent harm. Generally M1 for physical harm; prior conviction = F4; 2+ prior = F3. Victim pregnant adds mandatory prison.
VIOLATING PROTECTION ORDER [ORC 2919.27]: Recklessly violate terms of any protection order. Generally M1; F5 if prior violation; F3 if violating while committing a felony.
DV WRITTEN REPORT REQUIREMENTS [ORC 2935.032]: Must complete DV report whether or not arrest made. Advise victim of TPO availability. Give victim: officer name, badge number, report number, case info number, local DV shelter number, victim advocate info. If no arrest when preferred = document clear reasons.
SEARCH WARRANT PROBABLE CAUSE [ORC 2933.22]: Warrant requires probable cause, supported by oath, particularly describing place and items.
NO-KNOCK WARRANT [ORC 2933.231]: Requires showing officers will face risk of serious physical harm if required to knock/announce. Address must be verified correct. State liable for damages if executed at wrong address.
DEADLY WEAPON [ORC 2923.11]: Any instrument capable of inflicting death, designed/adapted/used as weapon. FIREARM includes unloaded and inoperable firearms that can readily be rendered operable.

=== SOLON PD COLLECTIVE BARGAINING AGREEMENT (CBA) ===
City of Solon & OPBA — Patrol Officers | Term: January 1, 2025 - December 31, 2027

PROBATIONARY PERIOD [CBA Art. 3]: 12 months after completing Field Training Program + police academy. During probation: may be discharged WITHOUT CAUSE. No grievance or Civil Service rights during probation.
DISCIPLINE [CBA Art. 8]: Only for JUST CAUSE for non-probationary employees. Written notice required before suspension/discharge. Employee has 5 calendar days to respond in writing. Disciplinary action may be appealed through grievance procedure.
EMPLOYEE RIGHTS [CBA Art. 6]: Copy of any departmental charge provided simultaneously with transmission to Chief. Polygraph only with employee CONSENT. Civilian complaints must be in writing and signed. Written reprimands over 2 years old NOT used for progressive discipline. Suspensions over 4 years old NOT used to support current action. Anonymous complaints kept in SEPARATE file.
GRIEVANCE PROCEDURE [CBA Art. 10]: Step 1 = notify supervisor within 5 days; Step 2 = written to Chief within 5 days of Step 1; Step 3 = appeal to Mayor within 7 days of Step 2 decision. Time limits strictly adhered to — missing deadline = grievance waived.
ARBITRATION [CBA Art. 11]: Must file within 10 days of Step 3 decision. Decision is FINAL AND BINDING. Losing party pays arbitrator fees.
DUTY HOURS [CBA Art. 15]: 12-hour shifts = 84 hours per 2-week pay period. Kelly Day = one 12-hour day off every 42 days. 90 days notice required before changing from 12-hour shift schedule.
OVERTIME [CBA Art. 16]: 12-hour shift = 1.5x for work over 84 hours/pay period, over 12 hours/day, or on Kelly Day. On-call/court time minimum 4 hours at 1.5x rate. Departmental meetings minimum 3 hours at 1.5x rate. Christmas, Thanksgiving, Memorial Day, July 4th fireworks = 2.25x rate.
COMP TIME [CBA Art. 16-A]: Accrues at 1.5 hours per overtime hour. Max carryover = 112 hours. Between Jan 1-Nov 30 may accumulate up to 240 hours. Hours over 112 as of Nov 30 paid out in December.
HOLIDAYS [CBA Art. 17]: 14 paid holidays = 144 hours total. Includes Police Memorial Day (May 15). If worked: 2x straight time OR another day off. If denied: straight-time pay in last pay period.
VACATION ACCRUAL [CBA Art. 18]: 1yr=84hrs; 5yr=120hrs; 10yr=168hrs; 15yr=204hrs; 20yr=216hrs; 25yr=240hrs.
SICK LEAVE [CBA Art. 19]: Accrues at 4.6 hours per 80 hours worked; max 159 hours/year; unlimited accumulation. Must notify OIC via dispatch at least 1 hour before shift. After 3 consecutive days Chief may require physician documentation.
FUNERAL LEAVE [CBA Art. 20]: Up to 3 days for immediate family; 1 day for other family members. NOT deducted from sick leave.
INJURY LEAVE [CBA Art. 21]: 12-hour shift = up to 120 days paid at regular compensation for service-related disability. Must file Workers' Comp and assign temporary disability benefits to City.
JURY DUTY [CBA Art. 22]: 12-hour shift officers: jury duty day is work day if normally scheduled; day off if regular day off (no City pay).
PAY RATES 2025 [CBA Art. 23]: Academy=$20.80/hr; Start=$40.5653/hr ($84,375/yr); 1yr=$42.0462/hr ($87,456/yr); 2yr=$44.7677/hr ($93,116/yr); 3yr=$46.1743/hr ($96,042/yr); 4yr=$48.2293/hr ($100,316/yr). 4% increase 2025; 3% increase 2026 and 2027.
LONGEVITY [CBA Art. 24]: Hired on/after Jan 1, 1989 = 0.25% of base salary per full year of service (max 5%). Begins after 5 full years of service.
OIC PAY [CBA Art. 25]: 1.5x Sergeant's rate per hour when assigned as Officer in Charge.
FTO PAY [CBA Art. 25]: 2 hours paid overtime per shift as Field Training Officer.
UNIFORM ALLOWANCE [CBA Art. 26]: $1,500 annual allowance for non-probationary employees, paid by March 1. Detectives: additional $50/month.
HEALTH INSURANCE [CBA Art. 28]: Employee contribution: 2025=8% of COBRA; 2026=9%; 2027=10%. Life insurance: $25,000 term. Opt-out: 15% of yearly COBRA equivalent in 4 quarterly payments.
DRUG TESTING [CBA Art. 29]: Post-accident, random (10% annually), reasonable suspicion. First positive = EAP; decline EAP = immediate discipline. Medical marijuana NOT a defense.
TUITION REIMBURSEMENT [CBA Art. 35]: Up to $5,250/year. Must earn C or above. Must repay if voluntarily leave within 3 years.

=== CHARGE REFERENCE CHEAT SHEETS ===
OVI: ORC 4511.19(A)(1)(a) — BAC .08-.17: ORC 4511.19(A)(1)(d) — BAC .17+: ORC 4511.19(A)(1)(h)
SPEED: Solon Ord. 434.03 / ORC 4511.21
RECKLESS OPERATION: Solon Ord. 434.02 / ORC 4511.20
TEXTING: Solon Ord. 432.43(a) / ORC 4511.204(A)
FAILURE TO COMPLY/FLEEING: Solon Ord. 606.165 / ORC 2921.331
HIT/SKIP: Solon Ord. 436.11(a)(1) / ORC 4549.02(A)(1)
DRIVING UNDER SUSPENSION: ORC 4510.11(A) — OVI Suspension: ORC 4510.14(A)
NO VALID LICENSE: Solon Ord. 436.072(a)(1) / ORC 4510.12(A)(1)
OPEN CONTAINER: Solon Ord. 612.04 / ORC 4301.62
UNDERAGE ALCOHOL: Solon Ord. 612.09 / ORC 4301.69(E)(1)
MARIJUANA POSSESSION: Solon Ord. 624.03 / ORC 2925.11
DRUG PARAPHERNALIA: Solon Ord. 624.14 / ORC 2925.141
DISORDERLY CONDUCT: Solon Ord. 648.04 / ORC 2917.11
OBSTRUCTING OFFICIAL BUSINESS: Solon Ord. 606.14 / ORC 2921.31
RESISTING ARREST: Solon Ord. 606.16 / ORC 2921.33
DOMESTIC VIOLENCE: ORC 2919.25
VIOLATING PROTECTION ORDER: ORC 2919.27
FELONIOUS ASSAULT: ORC 2903.11
ASSAULT ON PEACE OFFICER: ORC 2903.13
STRANGULATION: ORC 2903.18
AGGRAVATED ROBBERY: ORC 2911.01
MOVE OVER: Solon Ord. 432.40 / ORC 4511.213
SEAT BELT DRIVER: Solon Ord. 438.29(b)(1) / ORC 4513.263(B)(1)
CHILD RESTRAINT: Solon Ord. 438.28(a) / ORC 4511.81
FOLLOWING TOO CLOSELY: Solon Ord. 432.09(a)(1) / ORC 4511.34(A)
SCHOOL BUS: Solon Ord. 432.36 / ORC 4511.75
STREET RACING: Solon Ord. 434.07(b) / ORC 4511.251(B)`;

const SYSTEM = `You are the Solon PD Assistant — a comprehensive reference tool for officers, supervisors, and staff of the Solon Police Department.

You have access to ALL documents in the department's Google Drive including subfolders (Policy, Maps, Cheat Sheets, SOPs, Forms, etc.) and the following baked-in reference content.

When answering questions:
1. Use Google Drive document content when provided — it is the most authoritative source
2. ALWAYS include clickable document links for every relevant file found
3. Cite General Orders as [G2311-63 Use of Force Policy]
4. Cite Ohio law as [ORC 2935.03]
5. Cite CBA as [CBA Article 8 - Discipline]
6. Cite Solon ordinances as [Solon Ord. 434.01]
7. Be direct and practical — officers need quick answers
8. If Drive content is a scanned PDF (unreadable), say so and direct officer to the clickable link
9. Always end with document links as clickable buttons
10. For maps/zones/boundaries — provide the link to the map file directly

FORMAT FOR DOCUMENT LINKS:
Always format document links exactly like this so they render as clickable buttons:
🔗 **View Document:** [URL]

For multiple documents list each one:
🔗 **View Full Policy:** [URL]
🔗 **View Cheat Sheet:** [URL]
🔗 **View Map:** [URL]

${BAKED_CONTENT}`;

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
        context += `\n\n=== ${f.name} ===\nLink: ${f.webViewLink}\n\n${content.slice(0, 6000)}`;
        links.push(`📄 ${f.name}: ${f.webViewLink}`);
      } else {
        // Still include the link even if content is unreadable (scanned PDF)
        links.push(`📄 ${f.name} (scanned PDF - view directly): ${f.webViewLink}`);
      }
    }

    const system = SYSTEM +
      (context ? `\n\n=== LIVE CONTENT FROM GOOGLE DRIVE ===\n${context}` : '') +
      (links.length ? `\n\n=== DOCUMENT LINKS — INCLUDE ALL OF THESE AS CLICKABLE BUTTONS IN YOUR RESPONSE ===\n${links.join('\n')}` : '');

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
