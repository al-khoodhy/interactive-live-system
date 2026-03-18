// frontend-player/src/pages/AiDictionary.jsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

// ── Icons ────────────────────────────────────────────────────────────────────
const Icon = ({ d, size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);
const BrainIcon = () => <Icon size={20} d="M9.5 2a2.5 2.5 0 0 1 5 0c1.5.2 2.7 1 3.5 2.1A4 4 0 0 1 22 8a4 4 0 0 1-2.5 3.7V13a2 2 0 0 1-2 2H13v2h2a1 1 0 0 1 0 2h-2v1a1 1 0 0 1-2 0v-1H9a1 1 0 0 1 0-2h2v-2H6.5a2 2 0 0 1-2-2v-1.3A4 4 0 0 1 2 8a4 4 0 0 1 4-4 4 4 0 0 1 .5-2z" />;
const SaveIcon = () => <Icon size={16} d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2zM17 21v-8H7v8M7 3v5h8" />;
const ImportIcon = () => <Icon size={16} d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />;
const TrashIcon = () => <Icon size={14} d="M3 6h18M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />;
const ChevronDown = () => <Icon size={14} d="M6 9l6 6 6-6" />;
const ChevronUp = () => <Icon size={14} d="M18 15l-6-6-6 6" />;
const SearchIcon = () => <Icon size={16} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />;
const BookIcon = () => <Icon size={18} d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z" />;

// ── Expandable row ────────────────────────────────────────────────────────────
function IntentRow({ intent, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const utterances = typeof intent.utterances === 'string'
    ? JSON.parse(intent.utterances) : intent.utterances;
  const preview = utterances.slice(0, 2);
  const rest = utterances.slice(2);

  return (
    <div className="intent-row">
      <div className="intent-row__header">
        {/* Left: info */}
        <div className="intent-row__info">
          <span className="intent-label">{intent.label}</span>
          <code className="intent-code">{intent.name}</code>
        </div>

        {/* Middle: utterances preview */}
        <div className="intent-row__utterances">
          <span className="badge">
            <span className="badge-dot" />
            {utterances.length} pola
          </span>
          <ul className="utt-preview">
            {preview.map((u, i) => <li key={i}>"{u}"</li>)}
          </ul>
          {rest.length > 0 && !expanded && (
            <button className="show-more-btn" onClick={() => setExpanded(true)}>
              <ChevronDown /> +{rest.length} kalimat lainnya
            </button>
          )}
          {expanded && (
            <>
              <ul className="utt-rest">
                {rest.map((u, i) => <li key={i}>"{u}"</li>)}
              </ul>
              <button className="show-more-btn" onClick={() => setExpanded(false)}>
                <ChevronUp /> Sembunyikan
              </button>
            </>
          )}
        </div>

        {/* Right: actions */}
        <div className="intent-row__actions">
          <button className="btn-delete" onClick={() => onDelete(intent.id)}>
            <TrashIcon /> Hapus
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AiDictionary() {
  const [intents, setIntents] = useState([]);
  const [name, setName] = useState('');
  const [label, setLabel] = useState('');
  const [utteranceInput, setUtteranceInput] = useState('');
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => { fetchIntents(); }, []);

  const fetchIntents = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:8000/api/v1/intents');
      setIntents(res.data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const showStatus = (type, text) => {
    setStatusMessage({ type, text });
    if (type !== 'process') setTimeout(() => setStatusMessage({ type: '', text: '' }), 5000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const utterancesArray = utteranceInput.split('\n').filter(u => u.trim() !== '');
    if (utterancesArray.length === 0)
      return showStatus('error', 'Minimal isi 1 kalimat pertanyaan.');
    showStatus('process', 'Menyimpan ke otak AI…');
    try {
      const payload = { name: name.trim().toLowerCase().replace(/\s+/g, '_'), label, utterances: utterancesArray };
      const res = await axios.post('http://localhost:8000/api/v1/intents', payload);
      showStatus('success', res.data.message);
      setName(''); setLabel(''); setUtteranceInput('');
      fetchIntents();
    } catch (err) {
      showStatus('error', err.response?.data?.message || 'Gagal menyimpan');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const jsonData = JSON.parse(event.target.result);
        showStatus('process', 'Memproses data ke otak AI…');
        const res = await axios.post('http://localhost:8000/api/v1/intents/import', { intents: jsonData });
        showStatus('success', res.data.message);
        fetchIntents();
      } catch (err) {
        const msg = err.response?.data?.message || err.response?.data?.error || 'File JSON tidak valid atau struktur data salah.';
        showStatus('error', msg);
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus seluruh memori Intensi ini secara permanen?')) return;
    try {
      await axios.delete(`http://localhost:8000/api/v1/intents/${id}`);
      fetchIntents();
    } catch { alert('Gagal menghapus.'); }
  };

  const filtered = intents.filter(i =>
    i.label.toLowerCase().includes(search.toLowerCase()) ||
    i.name.toLowerCase().includes(search.toLowerCase())
  );

  const lineCount = utteranceInput.split('\n').filter(l => l.trim()).length;

  return (
    <>
      <style>{CSS}</style>
      <div className="page">

        {/* ── HEADER ── */}
        <header className="page-header">
          <div className="page-header__left">
            <div className="header-icon"><BrainIcon /></div>
            <div>
              <h1 className="page-title">Pelatihan Otak AI</h1>
              <p className="page-subtitle">Kelola kamus NLP & intensi chatbot</p>
            </div>
          </div>
          <div className="header-stats">
            <div className="stat-chip">
              <span className="stat-num">{intents.length}</span>
              <span className="stat-label">Intensi</span>
            </div>
            <div className="stat-chip">
              <span className="stat-num">
                {intents.reduce((acc, i) => {
                  const u = typeof i.utterances === 'string' ? JSON.parse(i.utterances) : i.utterances;
                  return acc + u.length;
                }, 0)}
              </span>
              <span className="stat-label">Total Pola</span>
            </div>
          </div>
        </header>

        {/* ── FORM CARD ── */}
        <div className="card">
          <div className="card__top">
            <h2 className="card-title">Tambah Intensi Baru</h2>
            <div>
              <input type="file" accept=".json" style={{ display: 'none' }} ref={fileInputRef} onChange={handleFileUpload} />
              <button className="btn btn--outline" onClick={() => fileInputRef.current.click()}>
                <ImportIcon /> Import .json
              </button>
            </div>
          </div>

          <p className="hint">Ajarkan variasi kalimat agar AI makin cerdas. Sistem mendeteksi bahasa gaul secara otomatis.</p>

          <form onSubmit={handleSubmit} className="form">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Kode Intensi <span className="form-hint-inline">tanpa spasi</span></label>
                <input className="form-input" type="text" value={name}
                  onChange={e => setName(e.target.value)} required
                  placeholder="cth: rekomendasi_acne_oily" />
              </div>
              <div className="form-group">
                <label className="form-label">Deskripsi / Nama Tampilan</label>
                <input className="form-input" type="text" value={label}
                  onChange={e => setLabel(e.target.value)} required
                  placeholder="cth: Tanya Paket Jerawat" />
              </div>
            </div>

            <div className="form-group">
              <div className="textarea-label-row">
                <label className="form-label">Contoh Kalimat Penonton</label>
                {lineCount > 0 && <span className="line-counter">{lineCount} kalimat</span>}
              </div>
              <textarea className="form-textarea" value={utteranceInput}
                onChange={e => setUtteranceInput(e.target.value)} required
                placeholder={"spill buat kulit oily berjerawat dong kak\nkalau mukaku minyakan terus ada jerawat pakai paket apa\n..."} />
              <p className="form-caption">1 baris = 1 kalimat. Bisa ratusan baris sekaligus.</p>
            </div>

            <button type="submit" className="btn btn--primary btn--full">
              <SaveIcon /> Simpan ke Otak AI
            </button>
          </form>

          {statusMessage.text && (
            <div className={`toast toast--${statusMessage.type}`}>
              {statusMessage.type === 'process' && <span className="spinner" />}
              {statusMessage.text}
            </div>
          )}
        </div>

        {/* ── TABLE CARD ── */}
        <div className="card">
          <div className="card__top">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <BookIcon />
              <h2 className="card-title" style={{ margin: 0 }}>Pustaka Pengetahuan Aktif</h2>
              {intents.length > 0 && <span className="count-badge">{intents.length}</span>}
            </div>
            <div className="search-box">
              <SearchIcon />
              <input className="search-input" placeholder="Cari intensi…"
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>

          {loading ? (
            <div className="empty-state"><span className="spinner spinner--lg" /> Memuat data…</div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              {search ? `Tidak ada hasil untuk "${search}"` : 'Belum ada kamus yang dilatih.'}
            </div>
          ) : (
            <div className="intent-list">
              {filtered.map(intent => (
                <IntentRow key={intent.id} intent={intent} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ── CSS-in-JS ─────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .page {
    min-height: 100vh;
    background: #f0f2f5;
    font-family: 'Plus Jakarta Sans', sans-serif;
    padding: 32px 24px 60px;
    color: #111827;
  }

  /* ── HEADER ── */
  .page-header {
    display: flex; align-items: center; justify-content: space-between;
    max-width: 960px; margin: 0 auto 28px;
    flex-wrap: wrap; gap: 16px;
  }
  .page-header__left { display: flex; align-items: center; gap: 14px; }
  .header-icon {
    width: 48px; height: 48px; border-radius: 14px;
    background: linear-gradient(135deg, #2563eb, #7c3aed);
    display: flex; align-items: center; justify-content: center; color: white;
    box-shadow: 0 4px 12px rgba(37,99,235,.35);
    flex-shrink: 0;
  }
  .page-title { font-size: 22px; font-weight: 700; color: #0f172a; }
  .page-subtitle { font-size: 13px; color: #6b7280; margin-top: 2px; }
  .header-stats { display: flex; gap: 12px; }
  .stat-chip {
    background: white; border: 1px solid #e5e7eb; border-radius: 10px;
    padding: 10px 18px; text-align: center;
    box-shadow: 0 1px 3px rgba(0,0,0,.06);
  }
  .stat-num { display: block; font-size: 22px; font-weight: 700; color: #2563eb; line-height: 1; }
  .stat-label { display: block; font-size: 11px; color: #9ca3af; margin-top: 3px; font-weight: 500; }

  /* ── CARD ── */
  .card {
    background: white; border-radius: 16px; padding: 28px;
    max-width: 960px; margin: 0 auto 24px;
    box-shadow: 0 1px 4px rgba(0,0,0,.06), 0 4px 16px rgba(0,0,0,.04);
    border: 1px solid #e9edf2;
  }
  .card__top {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 20px; flex-wrap: wrap; gap: 12px;
  }
  .card-title { font-size: 16px; font-weight: 700; color: #0f172a; }

  /* ── BUTTONS ── */
  .btn {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 10px 18px; border-radius: 9px; font-size: 13px; font-weight: 600;
    cursor: pointer; border: none; transition: all .15s; font-family: inherit;
  }
  .btn--primary {
    background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white;
    box-shadow: 0 2px 8px rgba(37,99,235,.4);
  }
  .btn--primary:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(37,99,235,.5); }
  .btn--outline {
    background: white; color: #374151;
    border: 1px solid #d1d5db;
  }
  .btn--outline:hover { background: #f9fafb; border-color: #9ca3af; }
  .btn--full { width: 100%; justify-content: center; padding: 13px; font-size: 14px; }

  /* ── FORM ── */
  .hint { font-size: 13px; color: #6b7280; margin-bottom: 22px; }
  .form { display: flex; flex-direction: column; gap: 20px; }
  .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  @media (max-width: 600px) { .form-row { grid-template-columns: 1fr; } }
  .form-group { display: flex; flex-direction: column; gap: 8px; }
  .form-label { font-size: 13px; font-weight: 600; color: #374151; }
  .form-hint-inline { font-weight: 400; color: #9ca3af; font-size: 12px; }
  .form-input, .form-textarea {
    padding: 11px 14px; border: 1.5px solid #e5e7eb; border-radius: 9px;
    font-size: 14px; font-family: inherit; color: #111827;
    transition: border-color .15s, box-shadow .15s; outline: none;
    background: #fafafa;
  }
  .form-input:focus, .form-textarea:focus {
    border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,.12);
    background: white;
  }
  .form-textarea { min-height: 160px; resize: vertical; line-height: 1.6; }
  .textarea-label-row { display: flex; align-items: center; justify-content: space-between; }
  .line-counter {
    font-size: 12px; font-weight: 600; color: #2563eb;
    background: #eff6ff; border-radius: 20px; padding: 2px 10px;
  }
  .form-caption { font-size: 12px; color: #9ca3af; margin-top: 5px; }

  /* ── TOAST ── */
  .toast {
    margin-top: 18px; padding: 14px 18px; border-radius: 10px;
    font-size: 14px; font-weight: 600; display: flex; align-items: center; gap: 10px;
    animation: slideIn .25s ease;
  }
  .toast--success { background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; }
  .toast--error   { background: #fff1f2; color: #be123c; border: 1px solid #fecdd3; }
  .toast--process { background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }
  @keyframes slideIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }

  /* ── SPINNER ── */
  .spinner {
    display: inline-block; width: 14px; height: 14px; flex-shrink: 0;
    border: 2px solid currentColor; border-top-color: transparent;
    border-radius: 50%; animation: spin .7s linear infinite;
  }
  .spinner--lg { width: 22px; height: 22px; }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* ── SEARCH ── */
  .search-box {
    display: flex; align-items: center; gap: 8px;
    background: #f9fafb; border: 1.5px solid #e5e7eb;
    border-radius: 9px; padding: 8px 13px; min-width: 220px;
    transition: border-color .15s;
  }
  .search-box:focus-within { border-color: #2563eb; background: white; }
  .search-box svg { color: #9ca3af; flex-shrink: 0; }
  .search-input {
    border: none; outline: none; background: transparent;
    font-size: 13px; font-family: inherit; color: #111827; width: 100%;
  }
  .count-badge {
    background: #eff6ff; color: #2563eb; border-radius: 20px;
    padding: 2px 10px; font-size: 12px; font-weight: 700;
  }

  /* ── EMPTY ── */
  .empty-state {
    text-align: center; color: #9ca3af;
    padding: 48px 20px; font-size: 14px;
    display: flex; align-items: center; justify-content: center; gap: 10px;
  }

  /* ── INTENT LIST ── */
  .intent-list { display: flex; flex-direction: column; gap: 0; }
  .intent-row {
    border-bottom: 1px solid #f3f4f6;
    transition: background .12s;
  }
  .intent-row:last-child { border-bottom: none; }
  .intent-row:hover { background: #fafbff; }
  .intent-row__header {
    display: grid;
    grid-template-columns: 220px 1fr 100px;
    gap: 20px; padding: 18px 4px; align-items: start;
  }
  @media (max-width: 700px) {
    .intent-row__header { grid-template-columns: 1fr; gap: 10px; }
  }

  /* Left */
  .intent-row__info { display: flex; flex-direction: column; gap: 6px; padding-top: 2px; }
  .intent-label { font-size: 15px; font-weight: 700; color: #0f172a; }
  .intent-code {
    font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 500;
    background: #f3f4f6; color: #4b5563; padding: 3px 8px; border-radius: 5px;
    border: 1px solid #e5e7eb; display: inline-block;
  }

  /* Middle */
  .intent-row__utterances { display: flex; flex-direction: column; gap: 8px; }
  .badge {
    display: inline-flex; align-items: center; gap: 5px;
    background: #eff6ff; color: #1d4ed8;
    padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 600;
    width: fit-content;
  }
  .badge-dot {
    width: 7px; height: 7px; background: #2563eb;
    border-radius: 50%; flex-shrink: 0;
  }
  .utt-preview, .utt-rest {
    list-style: none; display: flex; flex-direction: column; gap: 4px;
  }
  .utt-preview li, .utt-rest li {
    font-size: 13px; color: #4b5563; padding: 5px 10px;
    background: #f9fafb; border-radius: 6px; border-left: 3px solid #dbeafe;
    line-height: 1.4;
  }
  .utt-rest { margin-top: 4px; }
  .show-more-btn {
    background: none; border: none; cursor: pointer;
    color: #2563eb; font-size: 12px; font-weight: 600;
    display: flex; align-items: center; gap: 4px;
    padding: 4px 0; font-family: inherit;
    transition: color .12s;
  }
  .show-more-btn:hover { color: #1d4ed8; }

  /* Right */
  .intent-row__actions { display: flex; justify-content: flex-end; padding-top: 2px; }
  .btn-delete {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 7px 12px; background: white;
    border: 1.5px solid #fca5a5; color: #dc2626;
    border-radius: 8px; cursor: pointer; font-size: 12px; font-weight: 600;
    font-family: inherit; transition: all .15s;
  }
  .btn-delete:hover { background: #fff1f2; border-color: #f87171; }
`;