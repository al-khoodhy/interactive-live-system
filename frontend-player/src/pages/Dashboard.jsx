// frontend-player/src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import api from '../utils/api';
import axios from 'axios';

/* ─── shared CSS (injected once) ─────────────────────────────────────── */
const SHARED_CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg:        #0d1117;
  --surface:   #161b22;
  --surface2:  #1c2333;
  --border:    #30363d;
  --border2:   #21262d;
  --text:      #e6edf3;
  --text2:     #8b949e;
  --text3:     #484f58;
  --green:     #3fb950;
  --green-dim: #1a3829;
  --red:       #f85149;
  --red-dim:   #3d1a19;
  --blue:      #58a6ff;
  --blue-dim:  #1a2d4a;
  --purple:    #bc8cff;
  --purple-dim:#2a1e4a;
  --yellow:    #d29922;
  --yellow-dim:#2e2006;
  --radius:    10px;
  --font:      'DM Sans', sans-serif;
  --mono:      'DM Mono', monospace;
}

body { background: var(--bg); color: var(--text); font-family: var(--font); }

.op-page {
  padding: 32px 24px 60px;
  min-height: 100vh;
  background: var(--bg);
}

/* ── PAGE HEADER ─────────────────────────────────────────────────────── */
.op-header {
  max-width: 1200px; margin: 0 auto 28px;
  display: flex; align-items: center; justify-content: space-between;
  flex-wrap: wrap; gap: 12px;
}
.op-header__left { display: flex; align-items: center; gap: 14px; }
.op-header__icon {
  width: 44px; height: 44px; border-radius: 10px;
  background: linear-gradient(135deg, #58a6ff22, #58a6ff44);
  border: 1px solid #58a6ff55;
  display: flex; align-items: center; justify-content: center;
  font-size: 20px;
}
.op-header__title { font-size: 20px; font-weight: 700; color: var(--text); }
.op-header__sub   { font-size: 12px; color: var(--text2); margin-top: 2px; }

.engine-pill {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 600;
  border: 1px solid var(--border);
  background: var(--surface);
  font-family: var(--mono);
}
.engine-pill .dot {
  width: 8px; height: 8px; border-radius: 50%;
  animation: pulse 2s ease infinite;
}
.dot--green { background: var(--green); box-shadow: 0 0 6px var(--green); }
.dot--red   { background: var(--red);   box-shadow: 0 0 6px var(--red); }
@keyframes pulse {
  0%,100% { opacity: 1; }
  50% { opacity: .5; }
}

/* ── GRID ────────────────────────────────────────────────────────────── */
.op-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  max-width: 1200px; margin: 0 auto;
}
@media (max-width: 860px) { .op-grid { grid-template-columns: 1fr; } }
.op-col { display: flex; flex-direction: column; gap: 20px; }

/* ── CARD ────────────────────────────────────────────────────────────── */
.op-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 24px;
  position: relative;
  overflow: hidden;
}
.op-card__accent {
  position: absolute; top: 0; left: 0;
  width: 4px; height: 100%;
  border-radius: var(--radius) 0 0 var(--radius);
}
.op-card__accent--blue   { background: var(--blue); }
.op-card__accent--green  { background: var(--green); }
.op-card__accent--red    { background: var(--red); }
.op-card__accent--purple { background: var(--purple); }
.op-card__accent--black  { background: #ffffff22; }

.op-card-title {
  font-size: 14px; font-weight: 700; color: var(--text);
  margin-bottom: 18px; display: flex; align-items: center; gap: 8px;
  text-transform: uppercase; letter-spacing: .05em;
}
.op-card-title .num {
  width: 22px; height: 22px; border-radius: 50%;
  background: var(--surface2); border: 1px solid var(--border);
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 700; color: var(--text2);
  flex-shrink: 0;
}

/* ── FORM CONTROLS ───────────────────────────────────────────────────── */
.op-label {
  display: block; font-size: 12px; font-weight: 600;
  color: var(--text2); margin-bottom: 8px; letter-spacing: .03em;
  text-transform: uppercase;
}
.op-hint { font-size: 12px; color: var(--text3); margin-bottom: 10px; line-height: 1.5; }
.op-hint a { color: var(--blue); text-decoration: none; }
.op-hint a:hover { text-decoration: underline; }

.op-input, .op-select, .op-textarea {
  width: 100%; padding: 10px 14px;
  background: var(--bg); border: 1px solid var(--border);
  border-radius: 8px; color: var(--text);
  font-size: 14px; font-family: var(--font);
  outline: none; transition: border-color .15s, box-shadow .15s;
  margin-bottom: 14px;
}
.op-input:focus, .op-select:focus, .op-textarea:focus {
  border-color: var(--blue); box-shadow: 0 0 0 3px #58a6ff20;
}
.op-input:disabled, .op-select:disabled {
  opacity: .5; cursor: not-allowed;
}
.op-select option { background: var(--surface); }
.op-input--last, .op-select--last { margin-bottom: 0; }

.op-row { display: flex; gap: 10px; align-items: center; }
.op-row .op-input { margin-bottom: 0; }

/* ── BUTTONS ─────────────────────────────────────────────────────────── */
.op-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  padding: 11px 20px; border-radius: 8px;
  font-size: 13px; font-weight: 700; font-family: var(--font);
  cursor: pointer; border: none; transition: all .15s;
  letter-spacing: .02em;
}
.op-btn--full { width: 100%; }
.op-btn--green  { background: var(--green); color: #000; }
.op-btn--green:hover  { background: #56d364; box-shadow: 0 0 14px #3fb95044; }
.op-btn--blue   { background: var(--blue);  color: #000; }
.op-btn--blue:hover   { background: #79c0ff; box-shadow: 0 0 14px #58a6ff44; }
.op-btn--red    { background: var(--red);   color: #fff; }
.op-btn--red:hover    { background: #ff6b63; box-shadow: 0 0 14px #f8514944; }
.op-btn--black  { background: var(--text);  color: var(--bg); }
.op-btn--black:hover  { background: #c9d1d9; }
.op-btn--purple { background: var(--purple); color: #000; }
.op-btn--purple:hover { background: #d2a8ff; }
.op-btn--ghost  { background: var(--surface2); color: var(--text2); border: 1px solid var(--border); }
.op-btn--ghost:hover  { background: var(--surface); color: var(--text); }
.op-btn:disabled { opacity: .4; cursor: not-allowed; pointer-events: none; }

/* ── STATUS BANNER ───────────────────────────────────────────────────── */
.op-status {
  margin-top: 14px; padding: 12px 16px; border-radius: 8px;
  font-size: 13px; font-weight: 600;
  display: flex; align-items: center; gap: 8px;
}
.op-status--green  { background: var(--green-dim); color: var(--green); border: 1px solid #3fb95033; }
.op-status--red    { background: var(--red-dim);   color: var(--red);   border: 1px solid #f8514933; }
.op-status--blue   { background: var(--blue-dim);  color: var(--blue);  border: 1px solid #58a6ff33; }
.op-status--yellow { background: var(--yellow-dim);color: var(--yellow);border: 1px solid #d2992233; }

/* ── LAB CARD ────────────────────────────────────────────────────────── */
.mock-result {
  margin-top: 12px; padding: 10px 14px; border-radius: 8px;
  font-size: 13px; font-weight: 600; text-align: center;
  background: var(--green-dim); color: var(--green);
  border: 1px solid #3fb95033;
  animation: fadeIn .3s ease;
}
@keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }

/* ── TEXTAREA ────────────────────────────────────────────────────────── */
.op-textarea { resize: vertical; min-height: 80px; margin-bottom: 14px; }

/* ── DIVIDER ─────────────────────────────────────────────────────────── */
.op-divider {
  border: none; border-top: 1px solid var(--border2);
  margin: 18px 0;
}
`;

function injectCSS(id, css) {
  if (document.getElementById(id)) return;
  const s = document.createElement('style');
  s.id = id;
  s.textContent = css;
  document.head.appendChild(s);
}

export default function Dashboard() {
  const [engineStatus, setEngineStatus] = useState('Terputus');
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [tiktokUsername, setTiktokUsername] = useState('mas_alsaja');
  const [eulerApiKey, setEulerApiKey] = useState('euler_YTVmOTAzYTNkNzVkYzc4YmQzMjMyOTUyMTVjZDllMDI5YTI1Mjk4ZGQzMmNkZDczMDE5OWQ4');
  const [tiktokStatus, setTiktokStatus] = useState('disconnected');
  const [tiktokMsg, setTiktokMsg] = useState('');
  const [maxResponses, setMaxResponses] = useState(3);
  const [mockUser, setMockUser] = useState('user_test_01');
  const [mockText, setMockText] = useState('');
  const [mockResult, setMockResult] = useState('');

  useEffect(() => {
    injectCSS('op-shared-css', SHARED_CSS);
    const socket = io('http://localhost:3000', { reconnection: true });
    socket.on('connect', () => setEngineStatus('Terhubung'));
    socket.on('disconnect', () => setEngineStatus('Terputus'));
    socket.on('tiktok_status', (data) => {
      setTiktokStatus(data.status);
      if (data.message) setTiktokMsg(data.message);
    });
    api.get('/projects').then(res => {
      const data = res.data.data || [];
      setProjects(data);
      if (data.length > 0) setSelectedProjectId(data[0].id);
    }).catch(() => {});
    return () => socket.disconnect();
  }, []);

  const isConnected = engineStatus === 'Terhubung';

  const handleUpdateSettings = async () => {
    try {
      await axios.post('http://localhost:3000/api/engine/settings', { maxResponsesPerUser: maxResponses });
      alert(`✅ Setiap penonton kini maksimal dibalas ${maxResponses} kali.`);
    } catch { alert('❌ Gagal mengubah pengaturan mesin.'); }
  };

  const handleOpenPlayer = () => {
    if (!selectedProjectId) return alert('Pilih profil live terlebih dahulu!');
    window.open(`/player?projectId=${selectedProjectId}`, '_blank');
  };

  const handleConnectTikTok = async () => {
    setTiktokStatus('connecting');
    setTiktokMsg('Mencari ruang siaran (Live Room)...');
    try {
      const res = await axios.post('http://localhost:3000/api/tiktok/connect', { tiktokUsername, apiKey: eulerApiKey });
      setTiktokMsg(res.data.message);
    } catch (err) {
      setTiktokStatus('error');
      setTiktokMsg(err.response?.data?.error || 'Gagal terhubung ke peladen TikTok.');
    }
  };

  const handleDisconnectTikTok = async () => {
    try {
      await axios.post('http://localhost:3000/api/tiktok/disconnect');
      setTiktokMsg('Koneksi diputus.');
    } catch {}
  };

  const handleInjectMock = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:3000/api/test-comment', { username: mockUser, text: mockText });
      setMockResult('✅ Berhasil disuntikkan ke AI!');
      setMockText('');
      setTimeout(() => setMockResult(''), 3000);
    } catch { setMockResult('❌ Gagal menyuntikkan.'); }
  };

  const handleForceNext = async () => {
    try {
      await axios.post('http://localhost:3000/api/force-next');
      alert('Perintah Skip berhasil dikirim.');
    } catch (err) {
      alert('Ditolak: ' + (err.response?.data?.error || 'Sedang memutar materi, tidak bisa dipotong.'));
    }
  };

  const tiktokConnected = tiktokStatus === 'connected';
  const tiktokConnecting = tiktokStatus === 'connecting';

  const tiktokStatusClass =
    tiktokConnected ? 'op-status--green' :
    tiktokStatus === 'error' ? 'op-status--red' :
    tiktokConnecting ? 'op-status--yellow' : '';

  return (
    <div className="op-page">
      {/* HEADER */}
      <div className="op-header">
        <div className="op-header__left">
          <div className="op-header__icon">🎛️</div>
          <div>
            <div className="op-header__title">Operator Console</div>
            <div className="op-header__sub">Layar 1 — Kendali Utama Siaran</div>
          </div>
        </div>
        <div className={`engine-pill`}>
          <span className={`dot ${isConnected ? 'dot--green' : 'dot--red'}`} />
          Mesin: {engineStatus}
        </div>
      </div>

      <div className="op-grid">
        {/* ── COL LEFT ── */}
        <div className="op-col">

          {/* CARD 1 — PELUNCURAN */}
          <div className="op-card">
            <div className="op-card__accent op-card__accent--green" />
            <div className="op-card-title">
              <span className="num">1</span> Peluncuran Siaran
            </div>
            <label className="op-label">Profil / Skenario FSM</label>
            <select className="op-select" value={selectedProjectId} onChange={e => setSelectedProjectId(e.target.value)}>
              {projects.length === 0 && <option value="">-- Belum ada profil --</option>}
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <button onClick={handleOpenPlayer} disabled={!selectedProjectId} className="op-btn op-btn--green op-btn--full">
              🎬 Buka Layar 2 (Pemutar Video) ↗
            </button>
          </div>

          {/* CARD — PENGATURAN AI ENGINE */}
          <div className="op-card">
            <div className="op-card__accent op-card__accent--purple" />
            <div className="op-card-title">⚙️ Pengaturan AI Engine</div>
            <label className="op-label">Batas Balasan Per Penonton</label>
            <p className="op-hint">Mencegah satu orang memborong antrean Q&A. Isi 99 untuk tanpa batas.</p>
            <div className="op-row">
              <input type="number" className="op-input op-input--last" style={{ flex: 1 }}
                value={maxResponses} onChange={e => setMaxResponses(e.target.value)} min="1" />
              <button onClick={handleUpdateSettings} className="op-btn op-btn--purple" style={{ whiteSpace: 'nowrap' }}>
                Terapkan
              </button>
            </div>
          </div>

          {/* CARD 2 — TIKTOK */}
          <div className="op-card">
            <div className="op-card__accent op-card__accent--black" />
            <div className="op-card-title">
              <span className="num">2</span> Integrasi TikTok Live
            </div>

            <label className="op-label">Username TikTok (Tanpa @)</label>
            <input className="op-input" placeholder="jualan_kaos_murah"
              value={tiktokUsername} onChange={e => setTiktokUsername(e.target.value)}
              disabled={tiktokConnected} />

            <label className="op-label" style={{ color: 'var(--blue)' }}>EulerStream API Key</label>
            <p className="op-hint">
              Dapatkan API Key gratis di <a href="https://eulerstream.com/" target="_blank" rel="noreferrer">eulerstream.com</a> untuk mencegah terblokir.
            </p>
            <input type="password" className="op-input"
              placeholder="Masukkan API Key EulerStream Anda..."
              value={eulerApiKey} onChange={e => setEulerApiKey(e.target.value)}
              disabled={tiktokConnected} />

            {tiktokConnected ? (
              <button onClick={handleDisconnectTikTok} className="op-btn op-btn--red op-btn--full">
                🔴 Putuskan Koneksi TikTok
              </button>
            ) : (
              <button onClick={handleConnectTikTok} disabled={tiktokConnecting} className="op-btn op-btn--black op-btn--full">
                {tiktokConnecting ? '⏳ Menghubungkan...' : '🔗 Hubungkan ke TikTok'}
              </button>
            )}

            {tiktokMsg && (
              <div className={`op-status ${tiktokStatusClass}`}>
                {tiktokConnecting && <span style={{ display:'inline-block', width:12, height:12, border:'2px solid currentColor', borderTopColor:'transparent', borderRadius:'50%', animation:'spin .7s linear infinite', flexShrink:0 }} />}
                {tiktokMsg}
              </div>
            )}
          </div>
        </div>

        {/* ── COL RIGHT ── */}
        <div className="op-col">

          {/* CARD — LAB */}
          <div className="op-card">
            <div className="op-card__accent op-card__accent--blue" />
            <div className="op-card-title">🧪 Laboratorium Uji Coba</div>
            <p className="op-hint" style={{ marginBottom: 18 }}>
              Uji FSM dan AI <strong style={{ color: 'var(--text)' }}>tanpa perlu masuk ke TikTok</strong>. Suntikkan komentar simulasi langsung ke mesin.
            </p>
            <form onSubmit={handleInjectMock}>
              <label className="op-label">Username Simulasi</label>
              <input className="op-input" value={mockUser}
                onChange={e => setMockUser(e.target.value)} required />
              <label className="op-label">Teks Komentar</label>
              <textarea className="op-textarea" value={mockText}
                onChange={e => setMockText(e.target.value)}
                placeholder="Ketik pertanyaan simulasi penonton..." required />
              <button type="submit" className="op-btn op-btn--blue op-btn--full">
                💬 Suntikkan Komentar ke AI
              </button>
            </form>
            {mockResult && <div className="mock-result">{mockResult}</div>}
          </div>

          {/* CARD — INTERVENSI MANUAL */}
          <div className="op-card" style={{ border: '1px solid var(--red-dim)', background: '#0d0f11' }}>
            <div className="op-card__accent op-card__accent--red" />
            <div className="op-card-title" style={{ color: 'var(--red)' }}>⚡ Intervensi Manual</div>
            <p className="op-hint" style={{ marginBottom: 18 }}>
              Memotong durasi video yang sedang berjalan atau melewati sesi secara instan. Gunakan dengan hati-hati.
            </p>
            <button onClick={handleForceNext} className="op-btn op-btn--red op-btn--full" style={{ fontSize: 14 }}>
              ⏭️ Potong / Skip Paksa Sekarang
            </button>
          </div>

        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}