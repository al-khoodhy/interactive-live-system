// frontend-player/src/pages/VisualFlowBuilder.jsx
import React, { useState, useEffect } from 'react';
import VideoUploader from '../components/VideoUploader';
import api from '../utils/api';

export default function VisualFlowBuilder() {
    const [projects, setProjects] = useState([]);
    const [activeProjectId, setActiveProjectId] = useState('');
    const [existingAssets, setExistingAssets] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const [templateMode, setTemplateMode] = useState('digital'); 
    const [blocks, setBlocks] = useState([]);

    useEffect(() => { fetchMasterData(); }, []);

    useEffect(() => {
        if (activeProjectId && projects.length > 0) {
            const selectedProject = projects.find(p => p.id === activeProjectId);
            if (selectedProject && selectedProject.flow_data) {
                try {
                    const parsedFlow = typeof selectedProject.flow_data === 'string' ? JSON.parse(selectedProject.flow_data) : selectedProject.flow_data;
                    setBlocks(parsedFlow && parsedFlow.length > 0 ? parsedFlow : []);
                    setTemplateMode(selectedProject.template_mode || 'digital');
                } catch (error) { setBlocks([]); }
            } else { setBlocks([]); }
        }
    }, [activeProjectId, projects]);

    const fetchMasterData = async () => {
        setIsLoading(true);
        try {
            const [projectsRes, assetsRes] = await Promise.all([api.get('/projects'), api.get('/assets')]);
            const projectsData = projectsRes.data.data || [];
            setProjects(projectsData);
            if (projectsData.length > 0 && !activeProjectId) setActiveProjectId(projectsData[0].id);
            setExistingAssets(assetsRes.data.data || []);
        } catch (error) { console.error(error); } finally { setIsLoading(false); }
    };

    const handleCreateProject = async () => {
        const projectName = prompt("Masukkan Nama Profil Live Baru:");
        if (!projectName) return;
        try {
            const response = await api.post('/projects', { name: projectName });
            setActiveProjectId(response.data.data.id);
            fetchMasterData();
        } catch (error) { alert('❌ Gagal membuat profil.'); }
    };

    const loadTemplate = (type) => {
        setTemplateMode(type);
        if (type === 'skincare') {
            setBlocks([
                { id: `b_${Date.now()}_1`, type: 'explanation_random', label: 'Penjelasan Produk Acak', videos: [{ asset_id: '', url: '', weight: 1 }] },
                { id: `b_${Date.now()}_2`, type: 'qa_session', label: 'Sesi Tanya Jawab Langsung', quota: 3 },
                { id: `b_${Date.now()}_3`, type: 'offer_ask', label: 'Pancingan Bertanya', videos: [{ asset_id: '', url: '', weight: 1 }] }
            ]);
        } else if (type === 'digital') {
            setBlocks([
                { id: `d_${Date.now()}_1`, type: 'explanation_sequential', label: 'Penjelasan Tahap 1', step: 1, videos: [{ asset_id: '', url: '', version: 1 }] },
                { id: `q_${Date.now()}_1`, type: 'qa_session', label: 'Jawab Pertanyaan Tahap 1', quota: 2 }
            ]);
        }
    };

    const addDigitalStep = () => {
        const currentSteps = blocks.filter(b => b.type === 'explanation_sequential').length;
        const nextStep = currentSteps + 1;
        setBlocks([...blocks,
            { id: `d_${Date.now()}`, type: 'explanation_sequential', label: `Penjelasan Tahap ${nextStep}`, step: nextStep, videos: [{ asset_id: '', url: '', version: 1 }] },
            { id: `q_${Date.now()}`, type: 'qa_session', label: `Jawab Pertanyaan Tahap ${nextStep}`, quota: 2 }
        ]);
    };

    const removeDigitalStepPair = (stepNumber) => {
        const newBlocks = blocks.filter(b => {
            if (b.type === 'explanation_sequential' && b.step === stepNumber) return false;
            const expIndex = blocks.findIndex(ex => ex.type === 'explanation_sequential' && ex.step === stepNumber);
            if (blocks.indexOf(b) === expIndex + 1) return false;
            return true;
        });
        let stepCounter = 1;
        newBlocks.forEach((b, idx) => {
            if (b.type === 'explanation_sequential') {
                b.step = stepCounter; b.label = `Penjelasan Tahap ${stepCounter}`;
                if (newBlocks[idx + 1] && newBlocks[idx + 1].type === 'qa_session') newBlocks[idx + 1].label = `Jawab Pertanyaan Tahap ${stepCounter}`;
                stepCounter++;
            }
        });
        setBlocks(newBlocks);
    };

    const addVideoRow = (blockIndex) => {
        const newBlocks = [...blocks];
        const block = newBlocks[blockIndex];
        if (block.type === 'explanation_sequential') block.videos.push({ asset_id: '', url: '', version: block.videos.length + 1 });
        else block.videos.push({ asset_id: '', url: '', weight: 1 });
        setBlocks(newBlocks);
    };

    const updateVideoRow = (blockIndex, videoIndex, field, value) => {
        const newBlocks = [...blocks]; newBlocks[blockIndex].videos[videoIndex][field] = value; setBlocks(newBlocks);
    };

    const handleUploadSuccess = async (blockIndex, videoIndex, uploadedAsset) => {
        const newBlocks = [...blocks];
        newBlocks[blockIndex].videos[videoIndex].asset_id = uploadedAsset.id;
        newBlocks[blockIndex].videos[videoIndex].url = uploadedAsset.file_path;
        setBlocks(newBlocks); fetchMasterData(); 
    };

    const removeVideoRow = (blockIndex, videoIndex) => {
        const newBlocks = [...blocks];
        newBlocks[blockIndex].videos.splice(videoIndex, 1);
        if (newBlocks[blockIndex].type === 'explanation_sequential') {
            newBlocks[blockIndex].videos.forEach((vid, idx) => vid.version = idx + 1);
        }
        setBlocks(newBlocks);
    };

    const updateQuota = (bIdx, val) => { const nb = [...blocks]; nb[bIdx].quota = parseInt(val) || 1; setBlocks(nb); };
    
    const saveProfile = async () => { 
        if (!activeProjectId) return alert('Pilih Profil terlebih dahulu!');
        try {
            await api.put(`/projects/${activeProjectId}/flow`, { templateMode, flowData: blocks });
            alert("✅ Struktur Alur Berhasil Disimpan!"); 
            const updatedProjects = projects.map(p => p.id === activeProjectId ? { ...p, flow_data: JSON.stringify(blocks), template_mode: templateMode } : p);
            setProjects(updatedProjects);
        } catch (error) { alert("❌ Gagal menyimpan alur: " + error.message); }
    };

    const styles = { container: { padding: '30px', backgroundColor: '#e5e7eb', minHeight: '100vh', fontFamily: 'system-ui' }, headerPanel: { display: 'flex', justifyContent: 'space-between', backgroundColor: '#ffffff', padding: '20px', borderRadius: '10px', border: '1px solid #d1d5db', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '20px' }, btnBlue: { backgroundColor: '#1d4ed8', color: '#ffffff', padding: '10px 20px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }, btnGreen: { backgroundColor: '#047857', color: '#ffffff', padding: '12px 20px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', width: '100%', marginTop: '20px', fontSize: '16px' }, btnOutline: { backgroundColor: '#f9fafb', color: '#111827', border: '1px solid #9ca3af', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }, card: { backgroundColor: '#ffffff', padding: '24px', borderRadius: '8px', borderLeft: '6px solid #2563eb', marginBottom: '20px', borderTop: '1px solid #e5e7eb', borderRight: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }, row: { display: 'grid', gridTemplateColumns: '1fr 2fr 100px auto', gap: '15px', alignItems: 'center', backgroundColor: '#f3f4f6', padding: '15px', borderRadius: '6px', marginTop: '15px', border: '1px solid #d1d5db' }, input: { width: '100%', padding: '10px', border: '1px solid #9ca3af', borderRadius: '4px', boxSizing: 'border-box', color: '#111827', backgroundColor: '#ffffff', fontWeight: '500' } };

    if (isLoading) return <div style={{ padding: '100px', textAlign: 'center', color: '#111827' }}><h2>🔄 Menghubungkan ke Database...</h2></div>;

    return (
        <div style={styles.container}>
            <div style={styles.headerPanel}>
                <div>
                    <h1 style={{ margin: '0 0 10px 0', fontSize: '24px', color: '#111827' }}>🎛️ Visual Flow Orchestrator</h1>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        {projects.length === 0 ? <span style={{ color: '#b91c1c', fontWeight: 'bold', padding: '10px', backgroundColor: '#fee2e2', borderRadius: '4px' }}>⚠️ Belum ada profil.</span> : (
                            <select style={styles.input} value={activeProjectId} onChange={(e) => setActiveProjectId(e.target.value)}>
                                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        )}
                        <button style={styles.btnOutline} onClick={handleCreateProject}>+ Buat Profil Baru</button>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button style={{...styles.btnOutline, backgroundColor: templateMode === 'skincare' ? '#dbeafe' : '#f9fafb', borderColor: templateMode === 'skincare' ? '#1d4ed8' : '#9ca3af', color: templateMode === 'skincare' ? '#1e3a8a' : '#111827'}} onClick={() => loadTemplate('skincare')}>✨ Mode Acak (Fisik)</button>
                    <button style={{...styles.btnOutline, backgroundColor: templateMode === 'digital' ? '#d1fae5' : '#f9fafb', borderColor: templateMode === 'digital' ? '#047857' : '#9ca3af', color: templateMode === 'digital' ? '#064e3b' : '#111827'}} onClick={() => loadTemplate('digital')}>📚 Mode Urut (Digital)</button>
                    <button style={styles.btnBlue} onClick={saveProfile} disabled={projects.length === 0 || blocks.length === 0}>💾 Simpan Alur Profil Ini</button>
                </div>
            </div>

            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                {blocks.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '50px', backgroundColor: '#ffffff', borderRadius: '8px', border: '2px dashed #9ca3af' }}>
                        <h3 style={{ color: '#111827' }}>Alur Masih Kosong</h3>
                        <p style={{ color: '#4b5563', fontSize: '16px' }}>Pilih template <strong>Mode Acak</strong> atau <strong>Mode Urut</strong> di atas untuk memulai.</p>
                    </div>
                )}

                {blocks.map((block, index) => (
                    <div key={block.id} style={{ ...styles.card, borderLeftColor: block.type === 'qa_session' ? '#059669' : '#2563eb' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '18px', color: '#111827' }}>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <span style={{ backgroundColor: '#111827', color: '#ffffff', padding: '6px 12px', borderRadius: '4px', fontSize: '14px', marginRight: '15px' }}>Langkah {index + 1}</span> 
                                {block.label}
                            </div>
                            {templateMode === 'digital' && block.type === 'explanation_sequential' && (
                                <button onClick={() => removeDigitalStepPair(block.step)} style={{ background: '#fee2e2', border: '1px solid #f87171', color: '#b91c1c', cursor: 'pointer', fontWeight: 'bold', padding: '8px 15px', borderRadius: '4px' }}>🗑️ Hapus Pasangan Ini</button>
                            )}
                        </div>

                        {block.type !== 'qa_session' && (
                            <div style={{ marginTop: '20px' }}>
                                {block.videos.map((vid, vIdx) => (
                                    <div key={vIdx} style={styles.row}>
                                        <div style={{ fontWeight: 'bold', color: '#111827', fontSize: '15px' }}>
                                            {block.type === 'explanation_sequential' ? `Versi ${vid.version} (${block.step}.${vid.version})` : `Variasi Acak ${vIdx + 1}`}
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <select style={styles.input} value={vid.asset_id} onChange={(e) => {
                                                const selectedAsset = existingAssets.find(a => a.id === e.target.value);
                                                updateVideoRow(index, vIdx, 'asset_id', e.target.value);
                                                if(selectedAsset) updateVideoRow(index, vIdx, 'url', selectedAsset.file_path);
                                            }}>
                                                <option value="">-- Pilih dari Pustaka Video --</option>
                                                {existingAssets.map(a => <option key={a.id} value={a.id}>{a.file_path.split('/').pop()}</option>)}
                                            </select>
                                            <VideoUploader category="content" onUploadSuccess={(asset) => handleUploadSuccess(index, vIdx, asset)} />
                                            {vid.url && <div style={{ fontSize: '13px', color: '#047857', fontWeight: 'bold', marginTop: '5px', backgroundColor: '#d1fae5', padding: '5px', borderRadius: '4px' }}>✅ Terpilih: {vid.url.split('/').pop()}</div>}
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '13px', display: 'block', marginBottom: '8px', color: '#374151', fontWeight: 'bold' }}>{block.type === 'explanation_sequential' ? 'Urutan' : 'Bobot'}</label>
                                            <input type="number" style={styles.input} value={block.type === 'explanation_sequential' ? vid.version : vid.weight} onChange={(e) => updateVideoRow(index, vIdx, 'weight', e.target.value)} disabled={block.type === 'explanation_sequential'} />
                                        </div>
                                        <div style={{ paddingTop: '25px' }}>
                                            {block.videos.length > 1 && <button onClick={() => removeVideoRow(index, vIdx)} style={{ padding: '10px 15px', cursor: 'pointer', backgroundColor: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '4px', color: '#b91c1c', fontWeight: 'bold' }}>HAPUS</button>}
                                        </div>
                                    </div>
                                ))}
                                <button style={{ ...styles.btnOutline, marginTop: '15px', fontSize: '14px', borderStyle: 'dashed', backgroundColor: '#ffffff', width: '100%' }} onClick={() => addVideoRow(index)}>➕ Tambah Alternatif Video / Putaran Baru</button>
                            </div>
                        )}

                        {block.type === 'qa_session' && (
                            <div style={{ marginTop: '20px', backgroundColor: '#f0fdf4', padding: '20px', borderRadius: '6px', border: '1px solid #86efac' }}>
                                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                                    <label style={{ fontWeight: 'bold', marginRight: '15px', color: '#064e3b', fontSize: '16px' }}>Batas Menjawab Pertanyaan (Kuota):</label>
                                    <input type="number" style={{ padding: '10px', width: '80px', borderRadius: '4px', border: '1px solid #10b981', fontSize: '16px', fontWeight: 'bold', color: '#064e3b' }} value={block.quota} onChange={(e) => updateQuota(index, e.target.value)} min="1" />
                                </div>
                                <p style={{ margin: 0, fontSize: '14px', color: '#047857' }}>
                                    <strong>Mode Instan Aktif:</strong> Saat tahap ini tiba, sistem akan langsung menarik pertanyaan dari memori latar belakang. Jika antrean kosong, tahap ini akan langsung dilewati <strong>tanpa jeda/waktu tunggu</strong>.
                                </p>
                            </div>
                        )}
                    </div>
                ))}
                {templateMode === 'digital' && blocks.length > 0 && <button style={styles.btnGreen} onClick={addDigitalStep}>➕ Tambah Tahap Penjelasan Baru (Beserta Sesi Q&A)</button>}
            </div>
        </div>
    );
}