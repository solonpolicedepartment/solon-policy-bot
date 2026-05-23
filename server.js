const express = require('express');
const cors = require('cors');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
app.use(cors());
app.use(express.json());

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are the official policy assistant for the Solon Police Department. Answer questions about Solon PD policies and general orders accurately, always citing the specific General Order number (e.g., G2311-63). Format citations like: [G2311-63 Use of Force Policy]. Key orders include: G2301-18 Vehicle Pursuit Policy, G2311-63 Use of Force Policy, G2311-65 BolaWrap 150, G2310-59 Police Patrol Video, G2603-30 Uniforms, G2407-35 Evidence, G2502-14 Canine Use Policy, G2501-08 sUAS Drones, G2504-20 Ballistic Helmet Usage, G2112-82 Naloxone Administration, G2304-24 Amber Alert, G2602-18 Firearms Training, G2605-35 Duty Time and Time Off, G2603-29 Records Management, G2502-13 OHLEG and LEADS Policy, G2006-55 Hiring Process, G2309-41 Pre-Employment Background Investigation, G2402-18 Temporary Light Duty, G2507-35 In-Service Training, G8501-01 Fires, G9703-01 Warrantless Arrests, G9812-19 Warning Notice, G9003-08 Expectation of Privacy, G9007-23 Manpower Planning, G9809-10 Speed Limit in Police Yard.`;

app.get('/', (req, res) => {
  res.json({ status: 'Solon PD Policy Bot is running' });
});

app.post('/chat', async (req, res) => {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array is required' });
  }
  try {
    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: messages
    });
    const reply = response.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('\n');
    res.json({ reply });
  } catch (err) {
    console.error('Claude API error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Solon PD Policy Bot running on port ' + PORT);
});
