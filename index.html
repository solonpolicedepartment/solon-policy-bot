<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Solon PD Assistant</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.0.0/tabler-icons.min.css"/>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #eef0f4;
      display: flex; align-items: center; justify-content: center;
      min-height: 100vh; padding: 16px;
    }
    .shell {
      display: flex; flex-direction: column;
      width: 100%; max-width: 760px;
      height: 92vh; max-height: 820px;
      border-radius: 18px; overflow: hidden;
      background: #ffffff;
      box-shadow: 0 8px 40px rgba(0,0,0,0.13);
    }

    /* Header */
    .header {
      display: flex; align-items: center; gap: 13px;
      padding: 15px 20px;
      background: #0d2b55;
      flex-shrink: 0;
    }
    .header-logo {
      width: 42px; height: 42px; border-radius: 10px;
      background: rgba(255,255,255,0.12);
      display: flex; align-items: center; justify-content: center;
      color: #fff; font-size: 21px; flex-shrink: 0;
    }
    .header-info h1 { font-size: 15px; font-weight: 600; color: #fff; letter-spacing: 0.1px; }
    .header-info p { font-size: 11.5px; color: rgba(255,255,255,0.55); margin-top: 2px; }
    .header-status { margin-left: auto; display: flex; align-items: center; gap: 6px; }
    .dot { width: 7px; height: 7px; border-radius: 50%; background: #4ade80; box-shadow: 0 0 6px #4ade80; }
    .dot-label { font-size: 11px; color: rgba(255,255,255,0.55); }

    /* Quick topics */
    .topics {
      display: flex; gap: 5px; padding: 10px 16px;
      background: #f7f8fa;
      border-bottom: 1px solid #e8eaed;
      overflow-x: auto; flex-shrink: 0;
      scrollbar-width: none;
    }
    .topics::-webkit-scrollbar { display: none; }
    .topic {
      font-size: 11.5px; padding: 5px 12px; border-radius: 20px;
      border: 1px solid #d5d8de;
      background: #fff; color: #555;
      cursor: pointer; white-space: nowrap;
      transition: all 0.14s; font-family: inherit;
      flex-shrink: 0;
    }
    .topic:hover { background: #0d2b55; color: #fff; border-color: #0d2b55; }

    /* Messages */
    .messages {
      flex: 1; overflow-y: auto; padding: 18px 16px;
      display: flex; flex-direction: column; gap: 14px;
      scroll-behavior: smooth;
    }
    .msg { display: flex; gap: 10px; align-items: flex-start; max-width: 94%; }
    .msg.user { flex-direction: row-reverse; align-self: flex-end; }
    .msg.bot { align-self: flex-start; }
    .av {
      width: 32px; height: 32px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 15px; flex-shrink: 0; margin-top: 1px;
    }
    .av.b { background: #0d2b55; color: #fff; }
    .av.u { background: #dbeafe; color: #1d4ed8; }
    .bubble {
      padding: 11px 15px; border-radius: 16px;
      font-size: 13.5px; line-height: 1.7; color: #1a1a2e;
    }
    .msg.bot .bubble {
      background: #f4f5f8; border: 1px solid #e8eaed;
      border-bottom-left-radius: 4px;
    }
    .msg.user .bubble {
      background: #0d2b55; color: #fff;
      border-bottom-right-radius: 4px;
    }

    /* Inline badges */
    .badge-go {
      display: inline-block; background: #dbeafe; color: #1e40af;
      font-size: 11px; font-weight: 600; padding: 2px 7px;
      border-radius: 4px; margin: 0 2px; border: 1px solid #bfdbfe;
    }
    .badge-orc {
      display: inline-block; background: #dcfce7; color: #166534;
      font-size: 11px; font-weight: 600; padding: 2px 7px;
      border-radius: 4px; margin: 0 2px; border: 1px solid #bbf7d0;
    }
    .badge-ord {
      display: inline-block; background: #fef9c3; color: #854d0e;
      font-size: 11px; font-weight: 600; padding: 2px 7px;
      border-radius: 4px; margin: 0 2px; border: 1px solid #fde68a;
    }

    /* PDF / doc link button */
    .doc-btn {
      display: inline-flex; align-items: center; gap: 6px;
      margin-top: 10px; padding: 8px 15px;
      background: #0d2b55; color: #fff !important;
      border-radius: 8px; text-decoration: none !important;
      font-size: 13px; font-weight: 600; transition: background 0.14s;
    }
    .doc-btn:hover { background: #07193a; }

    /* Source block */
    .src {
      margin-top: 10px; padding: 8px 12px;
      background: #f0f4ff; border-left: 3px solid #0d2b55;
      border-radius: 0 6px 6px 0; font-size: 12px; color: #374151;
    }
    .bubble hr { border: none; border-top: 1px solid #e5e7eb; margin: 10px 0; }

    /* Typing */
    .typing {
      display: flex; gap: 5px; padding: 12px 14px;
      background: #f4f5f8; border: 1px solid #e8eaed;
      border-radius: 16px; border-bottom-left-radius: 4px; width: fit-content;
    }
    .typing span {
      width: 6px; height: 6px; background: #aaa; border-radius: 50%;
      animation: bop 1.2s infinite;
    }
    .typing span:nth-child(2) { animation-delay: .2s; }
    .typing span:nth-child(3) { animation-delay: .4s; }
    @keyframes bop { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-6px)} }

    /* Suggestions */
    .suggestions {
      display: flex; flex-wrap: wrap; gap: 6px;
      padding: 8px 16px 10px; flex-shrink: 0;
    }
    .sug {
      font-size: 12px; padding: 5px 12px; border-radius: 20px;
      border: 1px solid #d5d8de; background: #fff; color: #555;
      cursor: pointer; transition: all 0.14s; font-family: inherit;
    }
    .sug:hover { background: #0d2b55; color: #fff; border-color: #0d2b55; }

    /* Input */
    .input-row {
      display: flex; gap: 9px; padding: 12px 14px;
      border-top: 1px solid #e8eaed; background: #fff;
      flex-shrink: 0; align-items: flex-end;
    }
    textarea {
      flex: 1; resize: none; border: 1.5px solid #d5d8de;
      border-radius: 10px; padding: 9px 13px;
      font-size: 13.5px; font-family: inherit; color: #1a1a2e;
      background: #fff; line-height: 1.5;
      min-height: 40px; max-height: 120px;
      outline: none; transition: border-color 0.15s;
    }
    textarea:focus { border-color: #0d2b55; }
    textarea::placeholder { color: #aaa; }
    .send {
      width: 40px; height: 40px; border-radius: 10px;
      background: #0d2b55; border: none; color: #fff;
      font-size: 17px; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: background 0.14s; flex-shrink: 0;
    }
    .send:hover { background: #07193a; }
    .send:disabled { background: #e5e7eb; color: #aaa; cursor: not-allowed; }
    .disclaimer {
      font-size: 11px; color: #bbb; text-align: center;
      padding: 5px 16px 10px; flex-shrink: 0;
    }
  </style>
</head>
<body>
<div class="shell">

  <div class="header">
    <div class="header-logo"><i class="ti ti-shield-check"></i></div>
    <div class="header-info">
      <h1>Solon PD Assistant</h1>
      <p>Policies · Ohio Law · Ordinances · Procedures</p>
    </div>
    <div class="header-status">
      <div class="dot"></div>
      <span class="dot-label">Online</span>
    </div>
  </div>

  <div class="topics">
    <button class="topic" onclick="ask('General Orders and department policy')">📋 Policy</button>
    <button class="topic" onclick="ask('Ohio Revised Code statutes')">⚖️ ORC</button>
    <button class="topic" onclick="ask('Solon city ordinances — reference https://codelibrary.amlegal.com/codes/solon/latest/solon_oh/0-0-0-1')">🏛️ Ordinances</button>
    <button class="topic" onclick="ask('traffic law and traffic stops')">🚗 Traffic</button>
    <button class="topic" onclick="ask('use of force policy and procedures')">👮 Use of Force</button>
    <button class="topic" onclick="ask('search and seizure law and warrant requirements')">🔍 Search & Seizure</button>
    <button class="topic" onclick="ask('report writing and NIBRS documentation')">📝 Reports</button>
    <button class="topic" onclick="ask('evidence handling and chain of custody')">🔒 Evidence</button>
    <button class="topic" onclick="ask('criminal law and case law')">📚 Criminal Law</button>
    <button class="topic" onclick="ask('domestic violence procedures and protection orders')">🏠 Domestic</button>
    <button class="topic" onclick="ask('mental health crisis response procedures')">🧠 Mental Health</button>
    <button class="topic" onclick="ask('juvenile procedures and laws')">👦 Juvenile</button>
  </div>

  <div class="messages" id="msgs">
    <div class="msg bot">
      <div class="av b"><i class="ti ti-shield"></i></div>
      <div class="bubble">
        Hello! I'm the <strong>Solon PD Assistant</strong>. Ask me anything about:<br><br>
        <strong>📋 General Orders</strong> — Department policy with GO citations<br>
        <strong>⚖️ Ohio Revised Code</strong> — State statutes and criminal law<br>
        <strong>🏛️ Solon Ordinances</strong> — Local municipal codes<br>
        <strong>👮 Procedures</strong> — Traffic, arrests, evidence, reports<br>
        <strong>📚 Case Law</strong> — Miranda, Graham v. Connor, and more<br><br>
        What do you need?
      </div>
    </div>
  </div>

  <div class="suggestions" id="sugs">
    <button class="sug" onclick="useSug(this)">Vehicle pursuit policy</button>
    <button class="sug" onclick="useSug(this)">OVI stop procedure</button>
    <button class="sug" onclick="useSug(this)">Use of force rules</button>
    <button class="sug" onclick="useSug(this)">Body camera policy</button>
    <button class="sug" onclick="useSug(this)">Miranda rights</button>
    <button class="sug" onclick="useSug(this)">Evidence handling</button>
    <button class="sug" onclick="useSug(this)">Search warrant requirements</button>
    <button class="sug" onclick="useSug(this)">Domestic violence response</button>
  </div>

  <div class="input-row">
    <textarea id="inp" rows="1"
      placeholder="Ask about policy, Ohio law, ordinances, procedures…"
      onkeydown="handleKey(event)" oninput="resize(this)"></textarea>
    <button class="send" id="sendBtn" onclick="send()">
      <i class="ti ti-send"></i>
    </button>
  </div>
  <div class="disclaimer">AI-generated. Verify critical information against official sources before acting.</div>
</div>

<script>
  const API = 'https://solon-pd-bot.onrender.com';
  let history = [], busy = false;

  function resize(el) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  }
  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  }
  function useSug(btn) {
    document.getElementById('sugs').style.display = 'none';
    document.getElementById('inp').value = btn.textContent;
    send();
  }
  function ask(topic) {
    document.getElementById('sugs').style.display = 'none';
    document.getElementById('inp').value = 'Give me an overview of ' + topic + ' for Solon PD officers';
    send();
  }

  function addMsg(role, html) {
    const c = document.getElementById('msgs');
    const w = document.createElement('div');
    w.className = 'msg ' + (role === 'user' ? 'user' : 'bot');
    const av = document.createElement('div');
    av.className = 'av ' + (role === 'user' ? 'u' : 'b');
    av.innerHTML = role === 'user' ? '<i class="ti ti-user"></i>' : '<i class="ti ti-shield"></i>';
    const b = document.createElement('div');
    b.className = 'bubble';
    b.innerHTML = html;
    w.appendChild(av); w.appendChild(b);
    c.appendChild(w);
    c.scrollTop = c.scrollHeight;
  }

  function showTyping() {
    const c = document.getElementById('msgs');
    const w = document.createElement('div');
    w.className = 'msg bot'; w.id = 'typing';
    const av = document.createElement('div');
    av.className = 'av b';
    av.innerHTML = '<i class="ti ti-shield"></i>';
    const t = document.createElement('div');
    t.className = 'typing';
    t.innerHTML = '<span></span><span></span><span></span>';
    w.appendChild(av); w.appendChild(t);
    c.appendChild(w);
    c.scrollTop = c.scrollHeight;
  }
  function hideTyping() {
    const t = document.getElementById('typing');
    if (t) t.remove();
  }

  function fmt(text) {
    return text
      // General Order citations — blue
      .replace(/\[([A-Z]\d{4}[-–]\d{2,3}[^\]]*)\]/g, '<span class="badge-go">$1</span>')
      // ORC citations — green
      .replace(/\[ORC\s+(\d[\d.]+[^\]]*)\]/gi, '<span class="badge-orc">ORC $1</span>')
      .replace(/\[Ohio\s+Rev(?:ised)?\s+Code\s+(\d[\d.]+[^\]]*)\]/gi, '<span class="badge-orc">ORC $1</span>')
      // Solon Ordinance citations — yellow
      .replace(/\[Solon\s+Ord(?:inance)?\s+([^\]]+)\]/gi, '<span class="badge-ord">Solon Ord. $1</span>')
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // HR
      .replace(/^---$/gm, '<hr>')
      // Source block
      .replace(/\*\*Source:\*\*\s*(.+)/g, '<div class="src"><strong>Source:</strong> $1</div>')
      // Doc link buttons
      .replace(/🔗 \*\*View[^:]*:\*\*\s*(https?:\/\/[^\s<\n]+)/g, '<a href="$1" target="_blank" rel="noopener" class="doc-btn"><i class="ti ti-file-text"></i> View Document</a>')
      .replace(/(https?:\/\/drive\.google\.com\/[^\s<\n"]+)/g, '<a href="$1" target="_blank" rel="noopener" class="doc-btn"><i class="ti ti-file-text"></i> View Document</a>')
      .replace(/(https?:\/\/codelibrary\.amlegal\.com\/[^\s<\n"]+)/g, '<a href="$1" target="_blank" rel="noopener" class="doc-btn"><i class="ti ti-external-link"></i> View Solon Ordinances</a>')
      // Breaks
      .replace(/\n\n/g, '<br><br>')
      .replace(/\n/g, '<br>');
  }

  async function send() {
    if (busy) return;
    const inp = document.getElementById('inp');
    const text = inp.value.trim();
    if (!text) return;

    busy = true;
    document.getElementById('sendBtn').disabled = true;
    inp.value = ''; inp.style.height = 'auto';
    document.getElementById('sugs').style.display = 'none';

    addMsg('user', text.replace(/</g,'&lt;').replace(/>/g,'&gt;'));
    history.push({ role: 'user', content: text });
    showTyping();

    try {
      const res = await fetch(API + '/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history })
      });
      hideTyping();
      if (!res.ok) throw new Error('Server error ' + res.status);
      const data = await res.json();
      history.push({ role: 'assistant', content: data.reply });
      addMsg('bot', fmt(data.reply));
    } catch(err) {
      hideTyping();
      addMsg('bot', '⚠️ Could not reach the server. Please try again in a moment.');
    }

    busy = false;
    document.getElementById('sendBtn').disabled = false;
    inp.focus();
  }
</script>
</body>
</html>
