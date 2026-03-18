// frontend-player/src/pages/TriggerBuilder.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import VideoUploader from '../components/VideoUploader';
import api from '../utils/api';

/* ─── shared CSS reuse same variables from Dashboard ─────────────────── */
const TB_CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

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
  --yellow:    #d29922;
  --radius:    10px;
  --font:      'DM Sans', sans-serif;
  --mono:      'DM Mono', monospace;
}

.tb-page {
  padding: 32px 24px 60px;
  min-height: 100vh;
  background: var(--bg);
  color: var(--text);
  font-family: var(--font);
}

/* ── PAGE HEADER ─────────────────────────────────────────────────────── */
.tb-header {
  max-width: 900px; margin: 0 auto 28px;
  display: flex; align-items: center; gap: 14px;
}
.tb-header__icon {
  width: 44px; height: 44px; border-radius: 10px;
  background: linear-gradient(135deg, #3fb95022, #3fb95044);
  border: 1px solid #3fb95044;
  display: flex; align-items: center; justify-content: center; font-size: 20px;
}
.tb-header__title { font-size: 20px; font-weight: 700; }
.tb-header__sub   { font-size: 12px; color: var(--text2); margin-top: 2px; }

/* ── CARD ────────────────────────────────────────────────────────────── */
.tb-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 28px;
  max-width: 900px; margin: 0 auto 24px;
  position: relative; overflow: hidden;
}
.tb-card__accent {
  position: absolute; top: 0; left: 0;
  width: 4px; height: 100%;
  border-radius: var(--radius) 0 0 var(--radius);
}
.tb-card__accent--green  { background: var(--green); }
.tb-card__accent--blue   { background: var(--blue); }

.tb-card-title {
  font-size: 14px; font-weight: 700;
  color: var(--text);
  margin-bottom: 22px;
  text-transform: uppercase; letter-spacing: .05em;
  display: flex; align-items: center; gap: 8px;
}

/* ── FORM ────────────────────────────────────────────────────────────── */
.tb-label {
  display: block; font-size: 12px; font-weight: 600;
  color: var(--text2); margin-bottom: 8px;
  letter-spacing: .03em; text-transform: uppercase;
}
.tb-hint { font-size: 12px; color: var(--text3); margin-top: 5px; line-height: 1.5; }
.tb-hint b { color: var(--text2); }

.tb-input, .tb-select {
  width: 100%; padding: 10px 14px;
  background: var(--bg); border: 1px solid var(--border);
  border-radius: 8px; color: var(--text);
  font-size: 14px; font-family: var(--font);
  outline: none; transition: border-color .15s, box-shadow .15s;
}
.tb-input:focus, .tb-select:focus {
  border-color: var(--blue); box-shadow: 0 0 0 3px #58a6ff20;
}
.tb-select option { background: var(--surface); }

.tb-form-row {
  display: grid; grid-template-columns: 2fr 1fr;
  gap: 20px; margin-bottom: 24px; align-items: start;
}
@media (max-width: 640px) { .tb-form-row { grid-template-columns: 1fr; } }

.tb-form-group { display: flex; flex-direction: column; gap: 8px; }

/* ── VIDEO ROW ───────────────────────────────────────────────────────── */
.video-item {
  background: var(--bg); border: 1px solid var(--border2);
  border-radius: 8px; padding: 20px; margin-bottom: 14px;
  position: relative;
}
.video-item__grid {
  display: grid; grid-template-columns: 1fr 100px 40px;
  gap: 16px; align-items: start;
}
@media (max-width: 560px) { .video-item__grid { grid-template-columns: 1fr; } }

.video-item__num {
  position: absolute; top: -1px; left: -1px;
  background: var(--blue); color: #000;
  width: 22px; height: 22px; border-radius: 8px 0 6px 0;
  font-size: 11px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  font-family: var(--mono);
}

.vid-divider {
  border: none; border-top: 1px dashed var(--border2);
  margin: 12px 0;
  font-size: 11px; color: var(--text3); text-align: center;
  position: relative;
}
.vid-divider::after {
  content: 'ATAU UNGGAH BARU';
  position: absolute; top: -9px; left: 50%; transform: translateX(-50%);
  background: var(--bg); padding: 0 10px;
  font-size: 10px; color: var(--text3); font-weight: 600; letter-spacing: .05em;
}

/* ── BUTTONS ─────────────────────────────────────────────────────────── */
.tb-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  padding: 11px 18px; border-radius: 8px;
  font-size: 13px; font-weight: 700; font-family: var(--font);
  cursor: pointer; border: none; transition: all .15s;
}
.tb-btn--full { width: 100%; margin-top: 8px; }
.tb-btn--green  { background: var(--green); color: #000; }
.tb-btn--green:hover  { background: #56d364; box-shadow: 0 0 14px #3fb95044; }
.tb-btn--blue   { background: var(--blue);  color: #000; }
.tb-btn--blue:hover   { background: #79c0ff; }
.tb-btn--red    { background: var(--red-dim); color: var(--red); border: 1px solid #f8514933; }
.tb-btn--red:hover    { background: #4d1f1e; }
.tb-btn--dashed {
  background: transparent; color: var(--text2);
  border: 1.5px dashed var(--border);
  width: 100%; padding: 12px;
}
.tb-btn--dashed:hover { border-color: var(--blue); color: var(--blue); }
.tb-btn--icon {
  padding: 10px; background: var(--red-dim);
  color: var(--red); border: 1px solid #f8514933;
  border-radius: 8px; cursor: pointer; font-size: 14px;
  transition: background .15s;
}
.tb-btn--icon:hover { background: #4d1f1e; }

/* ── TOAST ───────────────────────────────────────────────────────────── */
.tb-toast {
  margin-top: 18px; padding: 12px 16px; border-radius: 8px;
  font-size: 13px; font-weight: 600;
  display: flex; align-items: center; gap: 8px;
  animation: tbFadeIn .25s ease;
}
.tb-toast--success { background: var(--green-dim); color: var(--green); border: 1px solid #3fb95033; }
.tb-toast--error   { background: var(--red-dim);   color: var(--red);   border: 1px solid #f8514933; }
.tb-toast--process { background: var(--blue-dim);  color: var(--blue);  border: 1px solid #58a6ff33; }
@keyframes tbFadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }

/* ── MAPPING TABLE ───────────────────────────────────────────────────── */
.tb-table-wrap {
  border: 1px solid var(--border2);
  border-radius: 8px; overflow: hidden;
}
.tb-table {
  width: 100%; border-collapse: collapse; font-size: 13px;
}
.tb-table thead tr {
  background: var(--bg);
  border-bottom: 1px solid var(--border);
}
.tb-table th {
  padding: 12px 16px; font-size: 11px; font-weight: 700;
  color: var(--text2); text-transform: uppercase; letter-spacing: .05em;
  text-align: left;
}
.tb-table td {
  padding: 14px 16px; border-bottom: 1px solid var(--border2);
  vertical-align: top;
}
.tb-table tbody tr:last-child td { border-bottom: none; }
.tb-table tbody tr:hover td { background: #ffffff05; }

.kw-badge {
  display: inline-flex; align-items: center; gap: 6px;
  background: var(--blue-dim); color: var(--blue);
  padding: 4px 10px; border-radius: 20px;
  font-family: var(--mono); font-size: 12px; font-weight: 500;
  border: 1px solid #58a6ff22;
}

.asset-link {
  display: flex; align-items: center; gap: 6px;
  color: var(--green); text-decoration: none;
  font-size: 12px; font-family: var(--mono);
  padding: 3px 0;
  transition: color .12s;
}
.asset-link:hover { color: #56d364; text-decoration: underline; }
.asset-link::before { content: '▶'; font-size: 9px; }

/* ── LOADING / EMPTY ─────────────────────────────────────────────────── */
.tb-loading {
  min-height: 100vh; background: var(--bg);
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 16px; font-family: var(--font); color: var(--text2);
}
.tb-loading .spinner {
  width: 32px; height: 32px;
  border: 3px solid var(--border);
  border-top-color: var(--blue);
  border-radius: 50%;
  animation: spin .8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.tb-empty {
  text-align: center; color: var(--text3);
  padding: 40px 20px; font-size: 14px;
}
`;

function injectCSS(id, css) {
  if (document.getElementById(id)) return;
  const s = document.createElement('style');
  s.id = id; s.textContent = css;
  document.head.appendChild(s);
}

export default function TriggerBuilder() {
  const [assets, setAssets] = useState([]);
  const [projects, setProjects] = useState([]);
  const [intents, setIntents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [projectId, setProjectId] = useState('');
  const [keyword, setKeyword] = useState('');
  const [priority, setPriority] = useState(10);
  const [responseAssets, setResponseAssets] = useState([{ asset_id: '', weight: 1 }]);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
  const [savedTriggers, setSavedTriggers] = useState([]);

  useEffect(() => {
    injectCSS('tb-css', TB_CSS);
    fetchMasterData();
  }, []);

  useEffect(() => {
    if (projectId) fetchSavedTriggers(projectId);
  }, [projectId]);

  const fetchMasterData = async () => {
    setIsLoading(true);
    try {
      const [aRes, pRes, iRes] = await Promise.all([
        api.get('/assets'), api.get('/projects'), api.get('/intents')
      ]);
      setAssets(aRes.data.data || []);
      const fetchedProjects = pRes.data.data || [];
      setProjects(fetchedProjects);
      if (fetchedProjects.length > 0 && !projectId) setProjectId(fetchedProjects[0].id);
      const fetchedIntents = iRes.data.data || [];
      setIntents(fetchedIntents);
      if (fetchedIntents.length > 0 && !keyword) setKeyword(fetchedIntents[0].name);
    } catch {}
    finally { setIsLoading(false); }
  };

  const fetchSavedTriggers = async (id) => {
    try {
      const res = await api.get(`/projects/${id}/triggers`);
      setSavedTriggers(res.data.data || []);
    } catch {}
  };

  const handleUploadSuccess = (index, uploadedAsset) => {
    const arr = [...responseAssets];
    arr[index].asset_id = uploadedAsset.id;
    setResponseAssets(arr);
    fetchMasterData();
  };

  const handleAssetChange = (index, field, value) => {
    const arr = [...responseAssets];
    arr[index][field] = value;
    setResponseAssets(arr);
  };

  const addRow = () => setResponseAssets([...responseAssets, { asset_id: '', weight: 1 }]);
  const removeRow = (index) => {
    const arr = [...responseAssets];
    arr.splice(index, 1);
    setResponseAssets(arr);
  };

  const showStatus = (type, text) => {
    setStatusMessage({ type, text });
    if (type !== 'process') setTimeout(() => setStatusMessage({ type: '', text: '' }), 5000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleaned = responseAssets.filter(i => i.asset_id !== '');
    if (cleaned.length === 0 || !projectId || !keyword)
      return showStatus('error', 'Profil, Intensi, dan minimal 1 video wajib diisi.');
    showStatus('process', 'Menyimpan konfigurasi AI...');
    try {
      await api.post(`/projects/${projectId}/triggers`, {
        keyword, priority: parseInt(priority),
        response_assets: cleaned.map(i => ({ asset_id: i.asset_id, weight: parseInt(i.weight) }))
      });
      showStatus('success', 'Pemetaan AI berhasil disimpan!');
      setResponseAssets([{ asset_id: '', weight: 1 }]);
      fetchSavedTriggers(projectId);
    } catch { showStatus('error', 'Gagal menyimpan. Coba lagi.'); }
  };

  const handleDeleteTrigger = async (triggerId) => {
    if (!window.confirm('Yakin ingin menghapus mapping ini? AI tidak akan bisa merespons intent ini lagi.')) return;
    try {
      await api.delete(`/projects/${projectId}/triggers/${triggerId}`);
      fetchSavedTriggers(projectId);
    } catch { alert('Gagal menghapus.'); }
  };

  if (isLoading) return (
    <div className="tb-loading">
      <div className="spinner" />
      <span>Memuat data...</span>
    </div>
  );

  return (
    <div className="tb-page">

      {/* HEADER */}
      <div className="tb-header">
        <div className="tb-header__icon">⚙️</div>
        <div>
          <div className="tb-header__title">Mapping AI & Video Jawaban</div>
          <div className="tb-header__sub">Hubungkan intensi penonton dengan video respons yang tepat</div>
        </div>
      </div>

      {/* ── FORM CARD ── */}
      <div className="tb-card">
        <div className="tb-card__accent tb-card__accent--green" />
        <div className="tb-card-title">➕ Tambah / Edit Pemetaan</div>

        <form onSubmit={handleSubmit}>

          {/* Profil */}
          <div className="tb-form-group" style={{ marginBottom: 20 }}>
            <label className="tb-label">1. Profil Live Target</label>
            <select className="tb-select" value={projectId} onChange={e => setProjectId(e.target.value)} required>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          {/* Intensi + Prioritas */}
          <div className="tb-form-row">
            <div className="tb-form-group">
              <label className="tb-label">2. Deteksi Intensi Penanya (AI)</label>
              <select className="tb-select" value={keyword} onChange={e => setKeyword(e.target.value)} required>
                {intents.map(i => <option key={i.id} value={i.name}>{i.label} — {i.name}</option>)}
              </select>
              <p className="tb-hint">Tip: untuk <b>mengedit</b>, pilih intent yang sama dan simpan ulang — sistem akan menimpa otomatis.</p>
            </div>
            <div className="tb-form-group">
              <label className="tb-label">Prioritas (0–100)</label>
              <input type="number" className="tb-input" value={priority}
                onChange={e => setPriority(e.target.value)} min="0" max="100" />
            </div>
          </div>

          {/* Video Items */}
          <label className="tb-label" style={{ marginBottom: 14 }}>3. Video Jawaban</label>
          {responseAssets.map((item, index) => (
            <div key={index} className="video-item">
              <span className="video-item__num">{index + 1}</span>
              <div className="video-item__grid">
                <div>
                  <label className="tb-label" style={{ marginBottom: 8 }}>Pilih dari Pustaka</label>
                  <select className="tb-select" value={item.asset_id}
                    onChange={e => handleAssetChange(index, 'asset_id', e.target.value)}>
                    <option value="">-- Pilih Video --</option>
                    {assets.map(a => (
                      <option key={a.id} value={a.id}>{a.file_path.split('/').pop()}</option>
                    ))}
                  </select>
                  <div className="vid-divider" style={{ marginTop: 16 }} />
                  <div style={{ marginTop: 16 }}>
                    <VideoUploader category="response" onUploadSuccess={(a) => handleUploadSuccess(index, a)} />
                  </div>
                </div>
                <div>
                  <label className="tb-label">Bobot Acak</label>
                  <input type="number" className="tb-input" value={item.weight}
                    onChange={e => handleAssetChange(index, 'weight', e.target.value)} min="1" required />
                </div>
                <div style={{ paddingTop: 26 }}>
                  {responseAssets.length > 1 && (
                    <button type="button" className="tb-btn--icon" onClick={() => removeRow(index)}>✕</button>
                  )}
                </div>
              </div>
            </div>
          ))}

          <button type="button" onClick={addRow} className="tb-btn tb-btn--dashed" style={{ marginBottom: 20 }}>
            ➕ Tambah Variasi Video
          </button>

          <button type="submit" className="tb-btn tb-btn--green tb-btn--full" style={{ fontSize: 14, padding: '14px' }}>
            💾 Simpan Hubungan AI & Video
          </button>

          {statusMessage.text && (
            <div className={`tb-toast tb-toast--${statusMessage.type}`}>
              {statusMessage.text}
            </div>
          )}
        </form>
      </div>

      {/* ── MAPPING TABLE ── */}
      <div className="tb-card" style={{ maxWidth: 900 }}>
        <div className="tb-card__accent tb-card__accent--blue" />
        <div className="tb-card-title" style={{ marginBottom: 18 }}>
          📚 Pemetaan Aktif
          {savedTriggers.length > 0 && (
            <span style={{
              background: 'var(--blue-dim)', color: 'var(--blue)',
              padding: '2px 10px', borderRadius: 20, fontSize: 11,
              fontFamily: 'var(--mono)', marginLeft: 8
            }}>
              {savedTriggers.length}
            </span>
          )}
        </div>

        {savedTriggers.length === 0 ? (
          <div className="tb-empty">Belum ada video jawaban yang dipetakan pada profil ini.</div>
        ) : (
          <div className="tb-table-wrap">
            <table className="tb-table">
              <thead>
                <tr>
                  <th>Kode Intensi AI</th>
                  <th>Video Jawaban Tertaut</th>
                  <th style={{ textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {savedTriggers.map(trig => (
                  <tr key={trig.id}>
                    <td style={{ width: '220px' }}>
                      <span className="kw-badge">{trig.keyword}</span>
                    </td>
                    <td>
                      {trig.assets.map(a => (
                        <a key={a.id} href={a.file_path} target="_blank" rel="noreferrer" className="asset-link">
                          {a.file_path.split('/').pop()}
                        </a>
                      ))}
                    </td>
                    <td style={{ textAlign: 'right', width: '80px' }}>
                      <button onClick={() => handleDeleteTrigger(trig.id)} className="tb-btn tb-btn--red" style={{ padding: '7px 12px', fontSize: 12 }}>
                        🗑️ Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}