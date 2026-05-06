// Elara Chat Widget — embed on any page with:
// <script src="/ecw-widget.js"></script>
(function() {
  'use strict';

  var BACKEND = 'https://carely-backend-production.up.railway.app';
  var chatHistory = [];
  var isOpen = false;
  var isBusy = false;

  // ── Inject styles ──────────────────────────────────────────────────
  var style = document.createElement('style');
  style.textContent = [
    '#ecw-widget *{box-sizing:border-box;margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}',
    '#ecw-fab{position:fixed;bottom:24px;right:24px;width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#028090,#02C39A);box-shadow:0 4px 20px rgba(2,128,144,0.4);cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:9998;border:none;transition:transform 0.2s,box-shadow 0.2s}',
    '#ecw-fab:hover{transform:scale(1.08);box-shadow:0 6px 28px rgba(2,128,144,0.5)}',
    '#ecw-badge{position:absolute;top:-3px;right:-3px;width:18px;height:18px;background:#F43F5E;border-radius:50%;font-size:0.62rem;font-weight:800;color:white;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity 0.2s}',
    '#ecw-panel{position:fixed;bottom:90px;right:24px;width:340px;max-height:520px;background:white;border-radius:18px;box-shadow:0 8px 40px rgba(13,51,71,0.18);z-index:9999;display:flex;flex-direction:column;overflow:hidden;transform:translateY(12px) scale(0.96);opacity:0;pointer-events:none;transition:all 0.22s cubic-bezier(0.34,1.56,0.64,1)}',
    '#ecw-panel.open{transform:translateY(0) scale(1);opacity:1;pointer-events:all}',
    '#ecw-head{background:linear-gradient(135deg,#028090,#02C39A);padding:16px 16px 12px;display:flex;align-items:center;gap:10px}',
    '.ecw-avatar{width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:1.1rem}',
    '.ecw-info{flex:1}',
    '.ecw-name{font-size:0.88rem;font-weight:800;color:white;letter-spacing:-0.01em}',
    '.ecw-sub{font-size:0.68rem;color:rgba(255,255,255,0.75);margin-top:1px}',
    '#ecw-close{width:28px;height:28px;border-radius:50%;background:rgba(255,255,255,0.15);border:none;color:white;font-size:1rem;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0}',
    '#ecw-msgs{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:8px;min-height:200px;max-height:320px}',
    '#ecw-msgs::-webkit-scrollbar{width:3px}',
    '#ecw-msgs::-webkit-scrollbar-thumb{background:rgba(2,128,144,0.2);border-radius:2px}',
    '.ecw-bubble{max-width:82%;padding:9px 12px;border-radius:12px;font-size:0.82rem;line-height:1.55;word-break:break-word}',
    '.ecw-bubble.bot{background:#F4F8F7;color:#0D2B24;border-bottom-left-radius:4px;align-self:flex-start}',
    '.ecw-bubble.user{background:linear-gradient(135deg,#028090,#02C39A);color:white;border-bottom-right-radius:4px;align-self:flex-end}',
    '.ecw-typing{display:flex;gap:4px;align-items:center;padding:9px 12px;background:#F4F8F7;border-radius:12px;border-bottom-left-radius:4px;width:fit-content}',
    '.ecw-dot{width:6px;height:6px;border-radius:50%;background:#02C39A;animation:ecwDot 1.2s infinite}',
    '.ecw-dot:nth-child(2){animation-delay:0.2s}.ecw-dot:nth-child(3){animation-delay:0.4s}',
    '@keyframes ecwDot{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}',
    '#ecw-form{padding:10px 12px;border-top:1px solid #E2EDEB;display:flex;gap:7px}',
    '#ecw-input{flex:1;border:1.5px solid #E2EDEB;border-radius:8px;padding:8px 12px;font-size:0.82rem;font-family:inherit;outline:none;resize:none;max-height:80px;line-height:1.45;color:#0D2B24;background:white;transition:border-color 0.15s}',
    '#ecw-input:focus{border-color:#028090}',
    '#ecw-input::placeholder{color:#7A9490}',
    '#ecw-send{width:36px;height:36px;border-radius:8px;background:linear-gradient(135deg,#028090,#02C39A);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:opacity 0.15s}',
    '#ecw-send:hover{opacity:0.85}',
    '#ecw-send:disabled{opacity:0.4;cursor:not-allowed}',
    '@media(max-width:400px){#ecw-panel{width:calc(100vw - 20px);right:10px;bottom:80px}}',
  ].join('');
  document.head.appendChild(style);

  // ── Build DOM safely (no innerHTML) ───────────────────────────────
  var widget = document.createElement('div');
  widget.id = 'ecw-widget';

  // FAB button
  var fab = document.createElement('button');
  fab.id = 'ecw-fab';
  fab.setAttribute('aria-label', 'Chat with Elara');

  var badge = document.createElement('div');
  badge.id = 'ecw-badge';
  badge.textContent = '1';

  var fabSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  fabSvg.setAttribute('viewBox', '0 0 24 24');
  fabSvg.style.cssText = 'width:26px;height:26px;fill:white';
  var fabPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  fabPath.setAttribute('d', 'M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z');
  fabSvg.appendChild(fabPath);
  fab.appendChild(badge);
  fab.appendChild(fabSvg);

  // Panel
  var panel = document.createElement('div');
  panel.id = 'ecw-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Chat with Elara');

  // Header
  var head = document.createElement('div');
  head.id = 'ecw-head';

  var avatarEl = document.createElement('div');
  avatarEl.className = 'ecw-avatar';
  avatarEl.textContent = '💊';

  var infoEl = document.createElement('div');
  infoEl.className = 'ecw-info';
  var nameEl = document.createElement('div');
  nameEl.className = 'ecw-name';
  nameEl.textContent = 'Elara';
  var subEl = document.createElement('div');
  subEl.className = 'ecw-sub';
  subEl.textContent = 'Carely AI · Usually replies instantly';
  infoEl.appendChild(nameEl);
  infoEl.appendChild(subEl);

  var closeBtn = document.createElement('button');
  closeBtn.id = 'ecw-close';
  closeBtn.setAttribute('aria-label', 'Close chat');
  closeBtn.textContent = '✕';

  head.appendChild(avatarEl);
  head.appendChild(infoEl);
  head.appendChild(closeBtn);

  // Messages area
  var msgs = document.createElement('div');
  msgs.id = 'ecw-msgs';

  // Input form
  var form = document.createElement('div');
  form.id = 'ecw-form';

  var input = document.createElement('textarea');
  input.id = 'ecw-input';
  input.setAttribute('placeholder', 'Ask anything about Carely...');
  input.rows = 1;

  var sendBtn = document.createElement('button');
  sendBtn.id = 'ecw-send';
  sendBtn.setAttribute('aria-label', 'Send');
  var sendSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  sendSvg.setAttribute('viewBox', '0 0 24 24');
  sendSvg.style.cssText = 'width:16px;height:16px;fill:white';
  var sendPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  sendPath.setAttribute('d', 'M2.01 21L23 12 2.01 3 2 10l15 2-15 2z');
  sendSvg.appendChild(sendPath);
  sendBtn.appendChild(sendSvg);

  form.appendChild(input);
  form.appendChild(sendBtn);

  panel.appendChild(head);
  panel.appendChild(msgs);
  panel.appendChild(form);

  widget.appendChild(fab);
  widget.appendChild(panel);
  document.body.appendChild(widget);

  // ── Initial greeting ─────────────────────────────────────────────
  setTimeout(function() {
    badge.style.opacity = '1';
    addBotMsg("Hi! I'm Elara — Carely's AI assistant. Have a question about the app or how it works? I'm here to help.");
  }, 1500);

  // ── Toggle ───────────────────────────────────────────────────────
  fab.addEventListener('click', function() {
    isOpen = !isOpen;
    panel.classList.toggle('open', isOpen);
    badge.style.opacity = '0';
    if (isOpen) { setTimeout(function(){ input.focus(); }, 250); }
  });
  closeBtn.addEventListener('click', function() {
    isOpen = false;
    panel.classList.remove('open');
  });

  // ── Message helpers ──────────────────────────────────────────────
  function addBotMsg(text) {
    var b = document.createElement('div');
    b.className = 'ecw-bubble bot';
    b.textContent = text;
    msgs.appendChild(b);
    msgs.scrollTop = msgs.scrollHeight;
  }
  function addUserMsg(text) {
    var b = document.createElement('div');
    b.className = 'ecw-bubble user';
    b.textContent = text;
    msgs.appendChild(b);
    msgs.scrollTop = msgs.scrollHeight;
  }
  function showTyping() {
    var t = document.createElement('div');
    t.className = 'ecw-typing';
    t.id = 'ecw-typing';
    for (var i = 0; i < 3; i++) {
      var d = document.createElement('div');
      d.className = 'ecw-dot';
      t.appendChild(d);
    }
    msgs.appendChild(t);
    msgs.scrollTop = msgs.scrollHeight;
  }
  function removeTyping() {
    var t = document.getElementById('ecw-typing');
    if (t) t.remove();
  }

  // ── Send message ─────────────────────────────────────────────────
  function doSend() {
    if (isBusy) return;
    var text = input.value.trim();
    if (!text || text.length > 500) return;
    input.value = '';
    input.style.height = '';
    isBusy = true;
    sendBtn.disabled = true;
    addUserMsg(text);
    chatHistory.push({ role: 'user', content: text });
    showTyping();

    var payload = JSON.stringify({ message: text, history: chatHistory.slice(-6) });

    fetch(BACKEND + '/elara/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
    })
    .then(function(r) { return r.json(); })
    .then(function(d) {
      removeTyping();
      var reply = (d && d.reply) ? d.reply : "I'm having trouble right now. Email hello@carely.fit";
      addBotMsg(reply);
      chatHistory.push({ role: 'assistant', content: reply });
    })
    .catch(function() {
      removeTyping();
      addBotMsg("Connection issue. Email hello@carely.fit — TJ responds within 24h.");
    })
    .finally(function() {
      isBusy = false;
      sendBtn.disabled = false;
      input.focus();
    });
  }

  sendBtn.addEventListener('click', doSend);
  input.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); doSend(); }
  });
  input.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 80) + 'px';
  });
})();
