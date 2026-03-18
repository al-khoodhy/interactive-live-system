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

.op-page { padding: 32px 24px 60px; min-height: 100vh; background: var(--bg); }

/* ── PAGE HEADER ─────────────────────────────────────────────────────── */
.op-header { max-width: 1200px; margin: 0 auto 28px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
.op-header__left { display: flex; align-items: center; gap: 14px; }
.op-header__icon { width: 44px; height: 44px; border-radius: 10px; background: linear-gradient(135deg, #58a6ff22, #58a6ff44); border: 1px solid #58a6ff55; display: flex; align-items: center; justify-content: center; font-size: 20px; }
.op-header__title { font-size: 20px; font-weight: 700; color: var(--text); }
.op-header__sub   { font-size: 12px; color: var(--text2); margin-top: 2px; }

.engine-pill { display: inline-flex; align-items: center; gap: 7px; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 600; border: 1px solid var(--border); background: var(--surface); font-family: var(--mono); }
.engine-pill .dot { width: 8px; height: 8px; border-radius: 50%; animation: pulse 2s ease infinite; }
.dot--green { background: var(--green); box-shadow: 0 0 6px var(--green); }
.dot--red   { background: var(--red);   box-shadow: 0 0 6px var(--red); }
@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: .5; } }

/* ── GRID ────────────────────────────────────────────────────────────── */
.op-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; max-width: 1200px; margin: 0 auto; }
@media (max-width: 860px) { .op-grid { grid-template-columns: 1fr; } }
.op-col { display: flex; flex-direction: column; gap: 20px; }

/* ── CARD ────────────────────────────────────────────────────────────── */
.op-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 24px; position: relative; overflow: hidden; }
.op-card__accent { position: absolute; top: 0; left: 0; width: 4px; height: 100%; border-radius: var(--radius) 0 0 var(--radius); }
.op-card__accent--blue   { background: var(--blue); }
.op-card__accent--green  { background: var(--green); }
.op-card__accent--red    { background: var(--red); }
.op-card__accent--purple { background: var(--purple); }
.op-card__accent--black  { background: #ffffff22; }
.op-card__accent--yellow { background: var(--yellow); }

.op-card-title { font-size: 14px; font-weight: 700; color: var(--text); margin-bottom: 18px; display: flex; align-items: center; gap: 8px; text-transform: uppercase; letter-spacing: .05em; }
.op-card-title .num { width: 22px; height: 22px; border-radius: 50%; background: var(--surface2); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: var(--text2); flex-shrink: 0; }

/* ── FORM CONTROLS ───────────────────────────────────────────────────── */
.op-label { display: block; font-size: 12px; font-weight: 600; color: var(--text2); margin-bottom: 8px; letter-spacing: .03em; text-transform: uppercase; }
.op-hint { font-size: 12px; color: var(--text3); margin-bottom: 10px; line-height: 1.5; }
.op-input, .op-select, .op-textarea { width: 100%; padding: 10px 14px; background: var(--bg); border: 1px solid var(--border); border-radius: 8px; color: var(--text); font-size: 14px; font-family: var(--font); outline: none; transition: border-color .15s, box-shadow .15s; margin-bottom: 14px; }
.op-input:focus, .op-select:focus, .op-textarea:focus { border-color: var(--blue); box-shadow: 0 0 0 3px #58a6ff20; }
.op-input:disabled, .op-select:disabled { opacity: .5; cursor: not-allowed; }
.op-select option { background: var(--surface); }
.op-input--last, .op-select--last { margin-bottom: 0; }

.op-row { display: flex; gap: 10px; align-items: center; }
.op-row .op-input { margin-bottom: 0; }

/* ── BUTTONS ─────────────────────────────────────────────────────────── */
.op-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 11px 20px; border-radius: 8px; font-size: 13px; font-weight: 700; font-family: var(--font); cursor: pointer; border: none; transition: all .15s; letter-spacing: .02em; }
.op-btn--full { width: 100%; }
.op-btn--green  { background: var(--green); color: #000; } .op-btn--green:hover  { background: #56d364; box-shadow: 0 0 14px #3fb95044; }
.op-btn--blue   { background: var(--blue);  color: #000; } .op-btn--blue:hover   { background: #79c0ff; box-shadow: 0 0 14px #58a6ff44; }
.op-btn--red    { background: var(--red);   color: #fff; } .op-btn--red:hover    { background: #ff6b63; box-shadow: 0 0 14px #f8514944; }
.op-btn--black  { background: var(--text);  color: var(--bg); } .op-btn--black:hover  { background: #c9d1d9; }
.op-btn--purple { background: var(--purple); color: #000; } .op-btn--purple:hover { background: #d2a8ff; }
.op-btn--yellow { background: var(--yellow); color: #000; } .op-btn--yellow:hover { background: #e3a92b; box-shadow: 0 0 14px #d2992244; }
.op-btn:disabled { opacity: .4; cursor: not-allowed; pointer-events: none; }

/* ── STATUS BANNER ───────────────────────────────────────────────────── */
.op-status { margin-top: 14px; padding: 12px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; display: flex; align-items: center; gap: 8px; }
.op-status--green  { background: var(--green-dim); color: var(--green); border: 1px solid #3fb95033; }
.op-status--red    { background: var(--red-dim);   color: var(--red);   border: 1px solid #f8514933; }
.op-status--yellow { background: var(--yellow-dim);color: var(--yellow);border: 1px solid #d2992233; }

.mock-result { margin-top: 12px; padding: 10px 14px; border-radius: 8px; font-size: 13px; font-weight: 600; text-align: center; background: var(--green-dim); color: var(--green); border: 1px solid #3fb95033; animation: fadeIn .3s ease; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }

.op-textarea { resize: vertical; min-height: 80px; margin-bottom: 14px; }
.op-divider { border: none; border-top: 1px solid var(--border2); margin: 18px 0; }
`;

function injectCSS(id, css) {
  if (document.getElementById(id)) return;
  const s = document.createElement('style'); s.id = id; s.textContent = css; document.head.appendChild(s);
}

export default function Dashboard() {
  // STATUS KONEKSI
  const [engineStatus, setEngineStatus] = useState('Terputus');
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  
  // TIKTOK
  const [tiktokUsername, setTiktokUsername] = useState('');
  const [eulerApiKey, setEulerApiKey] = useState('');
  const [tiktokStatus, setTiktokStatus] = useState('disconnected');
  const [tiktokMsg, setTiktokMsg] = useState('');
  
  // STATE PENGATURAN AI ENGINE & VISUAL
  const [maxResponses, setMaxResponses] = useState(3);
  const [enableTts, setEnableTts] = useState(true);
  const [enableOverlay, setEnableOverlay] = useState(true);
  const [ttsVolume, setTtsVolume] = useState(1.0);
  const [ttsLang, setTtsLang] = useState('id');
  const [ttsSpeed, setTtsSpeed] = useState(false);

  // STATE ANIMASI PERIODIK
  const [enableAnimation, setEnableAnimation] = useState(false);
  const [animationInterval, setAnimationInterval] = useState(300);
  const [animationList, setAnimationList] = useState([]);
  const [isUploadingAnimation, setIsUploadingAnimation] = useState(false);

  // STATE SFX ACAK
  const [enableSfx, setEnableSfx] = useState(false);
  const [sfxMin, setSfxMin] = useState(30);
  const [sfxMax, setSfxMax] = useState(120);
  const [sfxList, setSfxList] = useState([]);
  const [isUploadingSfx, setIsUploadingSfx] = useState(false);

  // STATE LABORATORIUM
  const [mockUser, setMockUser] = useState('user_test_01');
  const [mockText, setMockText] = useState('');
  const [mockResult, setMockResult] = useState('');

  // ─── INIT DATA & SOCKET ───
  useEffect(() => {
    injectCSS('op-shared-css', SHARED_CSS);
    const socket = io('http://localhost:3000', { reconnection: true });
    socket.on('connect', () => setEngineStatus('Terhubung'));
    socket.on('disconnect', () => setEngineStatus('Terputus'));
    socket.on('tiktok_status', (data) => {
      setTiktokStatus(data.status);
      if (data.message) setTiktokMsg(data.message);
    });

    // Fetch Initial Data
    api.get('/projects').then(res => {
      const data = res.data.data || []; setProjects(data);
      if (data.length > 0) setSelectedProjectId(data[0].id);
    }).catch(() => {});

    api.get('/sfx').then(res => setSfxList(res.data.data || [])).catch(() => {});
    api.get('/animations').then(res => setAnimationList(res.data.data || [])).catch(() => {});

    return () => socket.disconnect();
  }, []);

  const isConnected = engineStatus === 'Terhubung';

  // ─── PENYIMPANAN PENGATURAN ───
  const handleUpdateSettings = async () => {
    try {
      await axios.post('http://localhost:3000/api/engine/settings', { 
        maxResponsesPerUser: maxResponses, 
        enableTts, enableOverlay, ttsVolume, ttsLang, ttsSpeed,
        enableSfx, sfxMin, sfxMax,
        enableAnimation, animationInterval
      });
      alert(`✅ Konfigurasi Mesin Berhasil Disimpan & Diterapkan!`);
    } catch { alert('❌ Gagal mengubah pengaturan mesin.'); }
  };

  // ─── CRUD ANIMASI OVERLAY ───
  const handleUploadAnimation = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setIsUploadingAnimation(true);
    const formData = new FormData(); formData.append('file', file);
    try {
      await api.post('/animations', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      const res = await api.get('/animations'); setAnimationList(res.data.data || []);
      await axios.post('http://localhost:3000/api/engine/refresh-animations'); 
      alert('🎬 Animasi berhasil ditambahkan!');
    } catch (err) { alert('❌ Gagal mengunggah Animasi. Pastikan ukurannya di bawah 10MB.'); }
    setIsUploadingAnimation(false); e.target.value = null; 
  };

  const handleDeleteAnimation = async (filename) => {
    if (!window.confirm('Hapus animasi overlay ini?')) return;
    try {
      await api.delete(`/animations/${filename}`);
      const res = await api.get('/animations'); setAnimationList(res.data.data || []);
      await axios.post('http://localhost:3000/api/engine/refresh-animations'); 
    } catch (err) { alert('❌ Gagal menghapus Animasi.'); }
  };

  // ─── CRUD SFX ───
  const handleUploadSfx = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setIsUploadingSfx(true);
    const formData = new FormData(); formData.append('file', file);
    try {
      await api.post('/sfx', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      const res = await api.get('/sfx'); setSfxList(res.data.data || []);
      await axios.post('http://localhost:3000/api/engine/refresh-sfx'); 
    } catch (err) { alert('❌ Gagal mengunggah SFX.'); }
    setIsUploadingSfx(false); e.target.value = null; 
  };

  const handleDeleteSfx = async (filename) => {
    if (!window.confirm('Hapus efek suara ini permanen?')) return;
    try {
      await api.delete(`/sfx/${filename}`);
      const res = await api.get('/sfx'); setSfxList(res.data.data || []);
      await axios.post('http://localhost:3000/api/engine/refresh-sfx'); 
    } catch (err) { alert('❌ Gagal menghapus SFX.'); }
  };

  // ─── TIKTOK & CONTROLS ───
  const handleOpenPlayer = () => {
    if (!selectedProjectId) return alert('Pilih profil live terlebih dahulu!');
    window.open(`/player?projectId=${selectedProjectId}`, '_blank');
  };

  const handleConnectTikTok = async () => {
    setTiktokStatus('connecting'); setTiktokMsg('Mencari ruang siaran (Live Room)...');
    try {
      const res = await axios.post('http://localhost:3000/api/tiktok/connect', { tiktokUsername, apiKey: eulerApiKey });
      setTiktokMsg(res.data.message);
    } catch (err) {
      setTiktokStatus('error');
      setTiktokMsg(err.response?.data?.error || 'Gagal terhubung ke TikTok.');
    }
  };

  const handleDisconnectTikTok = async () => {
    try { await axios.post('http://localhost:3000/api/tiktok/disconnect'); setTiktokMsg('Koneksi diputus.'); } catch {}
  };

  const handleInjectMock = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:3000/api/test-comment', { username: mockUser, text: mockText });
      setMockResult('✅ Berhasil disuntikkan ke AI!'); setMockText('');
      setTimeout(() => setMockResult(''), 3000);
    } catch { setMockResult('❌ Gagal menyuntikkan.'); }
  };

  const handleForceNext = async () => {
    try { await axios.post('http://localhost:3000/api/force-next'); alert('Perintah Skip terkirim.'); } catch { alert('Ditolak.'); }
  };

  const tiktokConnected = tiktokStatus === 'connected';
  const tiktokConnecting = tiktokStatus === 'connecting';
  const tiktokStatusClass = tiktokConnected ? 'op-status--green' : tiktokStatus === 'error' ? 'op-status--red' : tiktokConnecting ? 'op-status--yellow' : '';

  return (
    <div className="op-page">
      {/* ── HEADER ── */}
      <div className="op-header">
        <div className="op-header__left">
          <div className="op-header__icon">🎛️</div>
          <div>
            <div className="op-header__title">Operator Console</div>
            <div className="op-header__sub">Layar 1 — Kendali Utama Siaran & Penjadwalan</div>
          </div>
        </div>
        <div className={`engine-pill`}>
          <span className={`dot ${isConnected ? 'dot--green' : 'dot--red'}`} />
          Mesin: {engineStatus}
        </div>
      </div>

      <div className="op-grid">
        
        {/* ── KOLOM KIRI (KONTROL UTAMA & AI) ── */}
        <div className="op-col">

          {/* CARD: PELUNCURAN SIARAN */}
          <div className="op-card">
            <div className="op-card__accent op-card__accent--green" />
            <div className="op-card-title"><span className="num">1</span> Peluncuran Siaran</div>
            <label className="op-label">Profil / Skenario FSM</label>
            <select className="op-select" value={selectedProjectId} onChange={e => setSelectedProjectId(e.target.value)}>
              {projects.length === 0 && <option value="">-- Belum ada profil --</option>}
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <button onClick={handleOpenPlayer} disabled={!selectedProjectId} className="op-btn op-btn--green op-btn--full">
              🎬 Buka Layar 2 (Pemutar Video) ↗
            </button>
          </div>

          {/* CARD: PENGATURAN AI & PENJADWALAN */}
          <div className="op-card">
            <div className="op-card__accent op-card__accent--purple" />
            <div className="op-card-title">⚙️ Kendali Mesin & Penjadwalan</div>
            
            <label className="op-label">Batas Balasan Per Penonton</label>
            <p className="op-hint">Mencegah spam antrean Q&A.</p>
            <input type="number" className="op-input" value={maxResponses} onChange={e => setMaxResponses(e.target.value)} min="1" />

            <hr className="op-divider" />
            
            <label className="op-label">Sakelar Fitur Visual & Suara (Layar 2)</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>
                <input type="checkbox" checked={enableOverlay} onChange={e => setEnableOverlay(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: 'var(--purple)' }} />
                Tampilkan Overlay Stiker Komentar
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>
                <input type="checkbox" checked={enableTts} onChange={e => setEnableTts(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: 'var(--purple)' }} />
                Aktifkan Suara Robot (TTS)
              </label>
            </div>

            {/* KUSTOMISASI SUARA AI */}
            {enableTts && (
              <div style={{ marginTop: '15px', padding: '15px', backgroundColor: 'var(--surface2)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <h4 style={{ marginBottom: '15px', fontSize: '13px', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '6px' }}>🎚️ Kustomisasi Suara AI</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                  <div>
                    <label className="op-label" style={{ fontSize: '10px' }}>Logat Suara</label>
                    <select className="op-select op-select--last" value={ttsLang} onChange={e => setTtsLang(e.target.value)} style={{ fontSize: '12px', padding: '8px' }}>
                      <option value="id">Indonesia</option>
                      <option value="ms">Melayu</option>
                      <option value="en">Inggris (Bule)</option>
                    </select>
                  </div>
                  <div>
                    <label className="op-label" style={{ fontSize: '10px' }}>Kecepatan</label>
                    <select className="op-select op-select--last" value={ttsSpeed} onChange={e => setTtsSpeed(e.target.value === 'true')} style={{ fontSize: '12px', padding: '8px' }}>
                      <option value="false">Normal</option>
                      <option value="true">Lambat</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="op-label" style={{ fontSize: '10px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Volume Suara</span><span style={{ color: 'var(--purple)' }}>{Math.round(ttsVolume * 100)}%</span>
                  </label>
                  <input type="range" min="0" max="1" step="0.1" value={ttsVolume} onChange={e => setTtsVolume(parseFloat(e.target.value))} style={{ width: '100%', accentColor: 'var(--purple)', cursor: 'pointer' }} />
                </div>
              </div>
            )}

            <hr className="op-divider" />

            {/* JADWAL ANIMASI OVERLAY */}
            <label className="op-label">Penjadwalan Animasi Overlay (WebM/GIF)</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', marginTop: '10px' }}>
              <input type="checkbox" checked={enableAnimation} onChange={e => setEnableAnimation(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: 'var(--purple)' }} />
              Aktifkan Animasi Overlay Periodik
            </label>
            {enableAnimation && (
              <div style={{ marginTop: '10px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: 'var(--text2)' }}>Muncul setiap:</span>
                <input type="number" className="op-input op-input--last" value={animationInterval} onChange={e => setAnimationInterval(e.target.value)} min="30" style={{ width: '80px', padding: '8px' }} />
                <span style={{ fontSize: '12px', color: 'var(--text2)' }}>Detik</span>
              </div>
            )}

            <hr className="op-divider" />

            {/* JADWAL SFX */}
            <label className="op-label">Penjadwalan Efek Suara (SFX)</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', marginTop: '10px' }}>
              <input type="checkbox" checked={enableSfx} onChange={e => setEnableSfx(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: 'var(--purple)' }} />
              Aktifkan SFX Acak
            </label>
            {enableSfx && (
              <div style={{ marginTop: '15px', padding: '15px', backgroundColor: 'var(--surface2)', borderRadius: '8px', border: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div><label className="op-label" style={{ fontSize: '10px' }}>Min (Detik)</label><input type="number" className="op-input op-input--last" value={sfxMin} onChange={e => setSfxMin(e.target.value)} min="5" style={{ fontSize: '12px', padding: '8px' }} /></div>
                <div><label className="op-label" style={{ fontSize: '10px' }}>Max (Detik)</label><input type="number" className="op-input op-input--last" value={sfxMax} onChange={e => setSfxMax(e.target.value)} min="10" style={{ fontSize: '12px', padding: '8px' }} /></div>
              </div>
            )}

            <button onClick={handleUpdateSettings} className="op-btn op-btn--purple op-btn--full" style={{ marginTop: '20px' }}>
              💾 Simpan Seluruh Konfigurasi Mesin
            </button>
          </div>

        </div>

        {/* ── KOLOM KANAN (CRUD MEDIA & TIKTOK) ── */}
        <div className="op-col">

          {/* MANAJEMEN ANIMASI OVERLAY */}
          <div className="op-card">
            <div className="op-card__accent op-card__accent--yellow" />
            <div className="op-card-title" style={{ color: 'var(--yellow)' }}>✨ Manajemen Animasi Overlay</div>
            <p className="op-hint">Unggah file <strong style={{ color: 'var(--text)' }}>.json (Lottie Animations)</strong>. Sangat ringan, resolusi tajam, dan tidak memberatkan laptop.</p>
            
            <label className="op-btn op-btn--yellow op-btn--full" style={{ cursor: 'pointer', marginBottom: '15px' }}>
              {isUploadingAnimation ? '⏳ Mengunggah...' : '➕ Unggah Animasi Baru (.json)'}
              <input type="file" accept=".json, application/json" style={{ display: 'none' }} onChange={handleUploadAnimation} disabled={isUploadingAnimation} />
            </label>
            
            <div style={{ backgroundColor: 'var(--surface2)', borderRadius: '8px', border: '1px solid var(--border)', overflow: 'hidden' }}>
              {animationList.length === 0 ? (
                <div style={{ padding: '15px', textAlign: 'center', fontSize: '12px', color: 'var(--text2)' }}>Belum ada animasi Lottie.</div>
              ) : (
                animationList.map((anim, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 15px', borderBottom: idx === animationList.length - 1 ? 'none' : '1px solid var(--border)' }}>
                    <div style={{ fontSize: '13px', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '75%' }}>🎞️ {anim.filename}</div>
                    <button onClick={() => handleDeleteAnimation(anim.filename)} style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: '16px' }}>🗑️</button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* CARD: MANAJEMEN SFX */}
          <div className="op-card">
            <div className="op-card__accent op-card__accent--blue" />
            <div className="op-card-title">🎵 Manajemen Efek Suara (SFX)</div>
            <p className="op-hint">Unggah file <strong style={{ color: 'var(--text)' }}>.mp3</strong> untuk suara latar acak (Tepuk tangan, dll).</p>
            
            <label className="op-btn op-btn--blue op-btn--full" style={{ cursor: 'pointer', marginBottom: '15px' }}>
              {isUploadingSfx ? '⏳ Mengunggah...' : '➕ Unggah File MP3'}
              <input type="file" accept="audio/mp3, audio/wav" style={{ display: 'none' }} onChange={handleUploadSfx} disabled={isUploadingSfx} />
            </label>
            
            <div style={{ backgroundColor: 'var(--surface2)', borderRadius: '8px', border: '1px solid var(--border)', overflow: 'hidden' }}>
              {sfxList.length === 0 ? (
                <div style={{ padding: '15px', textAlign: 'center', fontSize: '12px', color: 'var(--text2)' }}>Belum ada efek suara.</div>
              ) : (
                sfxList.map((sfx, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 15px', borderBottom: idx === sfxList.length - 1 ? 'none' : '1px solid var(--border)' }}>
                    <div style={{ fontSize: '13px', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '75%' }}>🎧 {sfx.filename}</div>
                    <button onClick={() => handleDeleteSfx(sfx.filename)} style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: '16px' }}>🗑️</button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* CARD: LAB PREVIEW */}
          <div className="op-card">
            <div className="op-card__accent op-card__accent--blue" />
            <div className="op-card-title">🧪 Laboratorium Uji Coba</div>
            <form onSubmit={handleInjectMock}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input className="op-input" style={{ flex: 1 }} value={mockUser} onChange={e => setMockUser(e.target.value)} required placeholder="Username" />
              </div>
              <textarea className="op-textarea" style={{ minHeight: '60px' }} value={mockText} onChange={e => setMockText(e.target.value)} placeholder="Ketik pertanyaan untuk memancing AI..." required />
              <button type="submit" className="op-btn op-btn--ghost op-btn--full">💬 Suntikkan Komentar</button>
            </form>
            {mockResult && <div className="mock-result" style={{ marginTop: '10px' }}>{mockResult}</div>}
          </div>

          {/* CARD: TIKTOK */}
          <div className="op-card">
            <div className="op-card__accent op-card__accent--black" />
            <div className="op-card-title"><span className="num">2</span> Integrasi TikTok Live</div>
            <label className="op-label">Username TikTok (Tanpa @)</label>
            <input className="op-input" placeholder="jualan_kaos" value={tiktokUsername} onChange={e => setTiktokUsername(e.target.value)} disabled={tiktokConnected} />
            <label className="op-label" style={{ color: 'var(--blue)' }}>EulerStream API Key</label>
            <input type="password" className="op-input" placeholder="Masukkan API Key EulerStream..." value={eulerApiKey} onChange={e => setEulerApiKey(e.target.value)} disabled={tiktokConnected} />
            
            {tiktokConnected ? (
              <button onClick={handleDisconnectTikTok} className="op-btn op-btn--red op-btn--full">🔴 Putuskan Koneksi TikTok</button>
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

          {/* CARD: INTERVENSI MANUAL */}
          <div className="op-card" style={{ border: '1px solid var(--red-dim)', background: '#0d0f11' }}>
            <div className="op-card__accent op-card__accent--red" />
            <div className="op-card-title" style={{ color: 'var(--red)' }}>⚡ Intervensi Manual</div>
            <p className="op-hint">Memotong durasi video yang sedang berjalan secara instan.</p>
            <button onClick={handleForceNext} className="op-btn op-btn--red op-btn--full">⏭️ Potong / Skip Paksa</button>
          </div>

        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}