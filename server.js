const express = require('express');
const cors = require('cors');
const Anthropic = require('@anthropic-ai/sdk');
const { google } = require('googleapis');

const app = express();
app.use(cors());
app.use(express.json());

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Google Drive setup using service account
const getGoogleAuth = () => {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  });
  return auth;
};

// Search Google Drive for relevant files
const searchDriveFiles = async (query) => {
  try {
    const auth = getGoogleAuth();
    const drive = google.drive({ version: 'v3', auth });
    
    // Search for PDF files matching the query terms
    const keywords = query.toLowerCase().split(' ')
      .filter(w => w.length > 3)
      .slice(0, 5)
      .join(' ');

    const response = await drive.files.list({
      q: `mimeType='application/pdf' and trashed=false`,
      fields: 'files(id, name, webViewLink)',
      pageSize: 10,
      orderBy: 'modifiedTime desc',
    });

    return response.data.files || [];
  } catch (err) {
    console.error('Drive search error:', err.message);
    return [];
  }
};

// Read content of a specific file
const readFileContent = async (fileId) => {
  try {
    const auth = getGoogleAuth();
    const drive = google.drive({ version: 'v3', auth });
    
    // Export as plain text
    const response = await drive.files.export({
      fileId,
      mimeType: 'text/plain',
    });
    
    return response.data;
  } catch (err) {
    // If export fails, try direct download
    try {
      const auth = getGoogleAuth();
      const drive = google.drive({ version: 'v3', auth });
      const response = await drive.files.get({
        fileId,
        alt: 'media',
      });
      return String(response.data).slice(0, 3000);
    } catch (err2) {
      console.error('File read error:', err2.message);
      return null;
    }
  }
};

// Find most relevant files for a question
const findRelevantFiles = async (question) => {
  const files = await searchDriveFiles(question);
  if (!files.length) return [];

  // Score files by name relevance to question
  const questionWords = question.toLowerCase().split(' ').filter(w => w.length > 3);
  
  const scored = files.map(file => {
    const fileName = file.name.toLowerCase();
    const score = questionWords.reduce((acc, word) => {
      return acc + (fileName.includes(word) ? 2 : 0);
    }, 0);
    return { ...file, score };
  });

  // Return top 3 most relevant files
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
};

const SYSTEM_PROMPT = `You are the official policy assistant for the Solon Police Department. You have access to the department's Google Drive which contains all General Orders, policies, and other department documents.

When answering questions:
1. ALWAYS cite the specific General Order number (e.g., G2311-63) when referencing a policy
2. Be specific and accurate based on the policy content provided
3. Format citations clearly like: [G2311-63 Use of Force Policy]
4. If multiple orders are relevant, cite all of them
5. Always end your response with the Google Drive link to the relevant policy PDF
6. If you don't have enough information to answer accurately, say so clearly

The policy content from Google Drive will be provided to you in each message. Use it to give accurate, cited answers.`;

app.get('/', (req, res) => {
  res.json({ status: 'Solon PD Policy Bot is running' });
});

app.post('/chat', async (req, res) => {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array is required' });
  }

  try {
    // Get the latest user question
    const lastMessage = messages[messages.length - 1];
    const question = lastMessage?.content || '';

    // Find relevant files from Google Drive
    const relevantFiles = await findRelevantFiles(question);
    
    // Build context from relevant files
    let driveContext = '';
    const fileLinks = [];
    
    for (const file of relevantFiles) {
      const content = await readFileContent(file.id);
      if (content) {
        driveContext += `\n\n=== ${file.name} ===\n${String(content).slice(0, 4000)}`;
        fileLinks.push(`📄 ${file.name}: ${file.webViewLink}`);
      }
    }

    // Build enhanced system prompt with Drive content
    const enhancedSystem = SYSTEM_PROMPT + 
      (driveContext ? `\n\nRELEVANT POLICY CONTENT FROM GOOGLE DRIVE:\n${driveContext}` : '') +
      (fileLinks.length ? `\n\nPOLICY PDF LINKS:\n${fileLinks.join('\n')}` : '');

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      system: enhancedSystem,
      messages: messages,
    });

    const reply = response.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('\n');

    res.json({ reply });

  } catch (err) {
    console.error('Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Solon PD Policy Bot running on port ' + PORT);
});
