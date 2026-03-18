// realtime-engine/services/LiveEngine.js
const db = require('../config/db');
const { NlpManager } = require('node-nlp');
const axios = require('axios');
const googleTTS = require('google-tts-api');

class LiveEngine {
    constructor(io) {
        this.io = io;
        this.currentState = 'IDLE'; 
        this.projectId = null; 
        
        this.flowData = [];           
        this.currentBlockIndex = 0;   
        this.loopCounter = 1;         
        
        this.qaQueue = []; 
        this.remainingQuota = 0;
        
        // --- PENGATURAN KENDALI ADMIN ---
        this.maxResponsesPerUser = 3; 
        this.enableTts = true;
        this.enableOverlay = true;
        this.ttsVolume = 1.0;
        this.ttsLang = 'id';
        this.ttsSpeed = false;

        // --- PENGATURAN ANIMASI OVERLAY ---
        this.enableAnimation = false;
        this.animationInterval = 300; // Muncul setiap 300 detik
        this.animationTimer = null;
        this.animationList = [];
        
        this.fetchAnimationList(); // Panggil di constructor
        
        // --- PENGATURAN SFX DINAMIS ---
        this.enableSfx = false;
        this.sfxMin = 30;
        this.sfxMax = 120;
        this.sfxTimer = null;
        this.sfxList = []; // WAJIB KOSONG: Akan diisi otomatis dari API Laravel
        
        this.userResponseCount = new Map();
        this.isProcessingComment = false;
        this.userCooldowns = new Map(); 

        // KAMUS TRANSLASI BAHASA GAUL (SLANG & TYPO DICTIONARY)
        this.slangDictionary = {
            "brp": "berapa", "brapa": "berapa", "hrg": "harga", "hrga": "harga", "bl": "beli", 
            "bku": "buku", "co": "checkout", "tf": "transfer", "ongkir": "ongkos kirim", 
            "cod": "bayar di tempat", "duit": "uang", "mahal": "mahal", "murah": "murah", "diskon": "promo",
            "bg": "bang", "bng": "bang", "min": "admin", "kk": "kakak", "kak": "kakak", 
            "sy": "saya", "aq": "aku", "gw": "saya", "gue": "saya", "lu": "kamu", "km": "kamu",
            "gmn": "bagaimana", "gimana": "bagaimana", "cr": "cara", "klo": "kalau", "klu": "kalau", 
            "mna": "dimana", "dmn": "dimana", "yg": "yang", "knp": "kenapa", "dgn": "dengan", 
            "utk": "untuk", "buat": "untuk", "trs": "terus", "tp": "tapi", "kpn": "kapan", "dr": "dari",
            "jrwtn": "jerawatan", "jrwt": "jerawat", "bruntus": "bruntusan", "kusem": "kusam", 
            "bks": "bekas", "fw": "sabun muka", "ss": "sunscreen", "moist": "pelembap", 
            "krim": "cream", "brminyak": "berminyak", "minyakan": "berminyak", "kering": "kering",
            "sensi": "sensitif", "bopeng": "bekas luka", "flek": "noda hitam", "glowing": "cerah",
            "spill": "kasih tahu", "dong": "tolong", "pls": "tolong", "bgt": "banget", 
            "beneran": "sungguh", "bner": "benar", "gk": "tidak", "ga": "tidak", "gak": "tidak",
            "tdk": "tidak", "blm": "belum", "udah": "sudah", "udh": "sudah", "dpt": "dapat"
        };

        this.nlp = new NlpManager({ languages: ['id'], forceNER: true, nlu: { log: false } });
        
        // INISIASI KECERDASAN SAAT SERVER MENYALA
        this.trainAiModel();
        this.fetchSfxList(); 
    }

    // --- FUNGSI SFX ---
    async fetchSfxList() {
        try {
            const res = await axios.get('http://127.0.0.1:8000/api/v1/sfx');
            if (res.data && res.data.data) {
                // Menyimpan URL absolut yang siap diputar oleh Layar 2 (React)
                this.sfxList = res.data.data.map(item => item.url);
                console.log(`[SFX Engine] 🎵 Berhasil memuat ${this.sfxList.length} efek suara dari CMS.`);
            }
        } catch (error) {
            console.error('[SFX Engine] ❌ Gagal memuat daftar SFX dari Laravel. (Mencoba lagi nanti...)');
        }
    }

    manageSfxLoop() {
        // 1. Bersihkan timer lama agar suara tidak tumpang tindih
        if (this.sfxTimer) {
            clearTimeout(this.sfxTimer);
            this.sfxTimer = null;
        }

        // 2. Berhenti jika sakelar dimatikan atau database suara kosong
        if (!this.enableSfx || !this.sfxList || this.sfxList.length === 0) {
            console.log(`[SFX Engine] ⏸️ SFX Acak Dimatikan / Daftar Suara Kosong.`);
            return;
        }

        // 3. Kalkulasi Waktu & Eksekusi
        const randomSeconds = Math.floor(Math.random() * (this.sfxMax - this.sfxMin + 1)) + this.sfxMin;
        console.log(`[SFX Engine] ⏳ Menyiapkan efek suara berikutnya dalam ${randomSeconds} detik...`);

        this.sfxTimer = setTimeout(() => {
            const randomSfxUrl = this.sfxList[Math.floor(Math.random() * this.sfxList.length)];
            const fileName = randomSfxUrl.split('/').pop(); // Mengambil nama file untuk log terminal
            
            console.log(`[SFX Engine] 🔊 Memainkan efek suara: ${fileName}`);
            this.io.emit('play_sfx', { url: randomSfxUrl });
            
            // Panggil kembali dirinya sendiri untuk terus looping
            this.manageSfxLoop();
        }, randomSeconds * 1000);
    }

    async fetchAnimationList() {
        try {
            const res = await axios.get('http://127.0.0.1:8000/api/v1/animations');
            if (res.data && res.data.data) {
                // KUNCI: Kita simpan URL-nya, tapi nanti Node.js yang akan mendownload isinya
                this.animationList = res.data.data.map(item => item.url);
                console.log(`[Animation Engine] 🎬 Berhasil memuat ${this.animationList.length} animasi.`);
            }
        } catch (error) { console.error('[Animation Engine] ❌ Gagal memuat daftar Animasi.'); }
    }

    async manageAnimationLoop() {
        if (this.animationTimer) {
            clearInterval(this.animationTimer);
            this.animationTimer = null;
        }

        if (!this.enableAnimation || !this.animationList || this.animationList.length === 0) return;

        console.log(`[Animation Engine] ⏳ Animasi akan muncul setiap ${this.animationInterval} detik.`);
        
        this.animationTimer = setInterval(async () => {
            const randomAnimUrl = this.animationList[Math.floor(Math.random() * this.animationList.length)];
            
            try {
                // SOLUSI MUTLAK CORS: Node.js yang mendownload isi JSON-nya
                const response = await axios.get(randomAnimUrl);
                const animationData = response.data; // Ini adalah wujud asli file JSON Lottie
                
                console.log(`[Animation Engine] 🚀 Menyiarkan Data Animasi Lottie ke React!`);
                
                // Node.js mengirimkan "Isi JSON" (Object), bukan sekadar URL
                this.io.emit('play_animation', { animationData: animationData });
            } catch (error) {
                console.error(`[Animation Engine] Gagal membaca isi file Lottie dari Laravel.`);
            }
            
        }, this.animationInterval * 1000);
    }

    // --- FUNGSI NLP & KECERDASAN BUATAN ---
    preprocessText(text) {
        let words = text.toLowerCase().replace(/[^\w\s]/gi, '').split(' ');
        return words.map(word => this.slangDictionary[word] || word).join(' ');
    }

    async trainAiModel() {
        console.log('[AI Engine] Mengunduh Kamus Pertanyaan dari Database...');
        try {
            const response = await axios.get('http://127.0.0.1:8000/api/v1/intents');
            const intentsData = response.data.data;
            
            if (!intentsData || intentsData.length === 0) {
                console.warn('[AI Engine] ⚠️ Kamus AI kosong. Pastikan Anda sudah mengisinya di CMS.');
                setTimeout(() => this.trainAiModel(), 30000); 
                return;
            }

            let trainedCount = 0;
            intentsData.forEach(intent => {
                let utterances = intent.utterances;
                try { if (typeof utterances === 'string') utterances = JSON.parse(utterances); } catch (e) {}
                
                if (Array.isArray(utterances)) {
                    utterances.forEach(utt => {
                        const textString = typeof utt === 'object' && utt !== null ? (utt.text || '') : utt;
                        if (typeof textString === 'string' && textString.trim() !== '') {
                            this.nlp.addDocument('id', textString.trim(), intent.name);
                            trainedCount++;
                        }
                    });
                }
            });

            if (trainedCount > 0) {
                await this.nlp.train();
                console.log(`[AI Engine] ✅ Berhasil melatih ${intentsData.length} Kategori dengan ${trainedCount} kalimat pola.`);
            } else {
                console.warn(`[AI Engine] ⚠️ Kamus ditemukan, tapi tidak ada pola yang valid.`);
            }
        } catch (error) { 
            console.error('[AI Engine] ❌ Gagal mengunduh kamus:', error.message); 
            console.log('[AI Engine] ⏳ Peladen Laravel belum siap. Mencoba lagi dalam 10 detik...');
            setTimeout(() => this.trainAiModel(), 10000); 
        }
    }

    // --- FUNGSI MANAJEMEN ALUR (FSM) ---
    async startActiveProject(targetProjectId) {
        if (!targetProjectId) return;
        try {
            const res = await db.query('SELECT id, flow_data FROM projects WHERE id = $1', [targetProjectId]);
            if (res.rows.length === 0) return;

            this.projectId = res.rows[0].id;
            const rawFlow = res.rows[0].flow_data;
            this.flowData = typeof rawFlow === 'string' ? JSON.parse(rawFlow) : rawFlow;

            console.log(`[Engine] Memuat Profil ID: ${this.projectId}. Total Blok: ${this.flowData.length}`);
            
            this.currentBlockIndex = 0; 
            this.loopCounter = 1;
            this.qaQueue = []; 
            this.userResponseCount.clear(); 
            
            this.manageAnimationLoop();
            this.manageSfxLoop(); // Picu putaran SFX Acak
            await this.executeCurrentBlock(); 
        } catch (error) { console.error(error); }
    }

    async executeCurrentBlock() {
        if (!this.flowData || this.flowData.length === 0) return;

        if (this.currentBlockIndex >= this.flowData.length) {
            this.currentBlockIndex = 0;
            this.loopCounter++; 
            console.log(`\n[Engine] 🔄 ALUR SELESAI. MENGULANG DARI AWAL (PUTARAN KE-${this.loopCounter})`);
        }

        const block = this.flowData[this.currentBlockIndex];
        console.log(`[Engine] ➡️ Eksekusi Langkah ${this.currentBlockIndex + 1}: ${block.label} (${block.type})`);

        if (block.type === 'explanation_sequential') {
            this.currentState = 'PLAYING_CONTENT';
            let selectedVideo = block.videos.find(v => parseInt(v.version) === this.loopCounter);
            if (!selectedVideo) selectedVideo = block.videos[block.videos.length - 1];

            if (selectedVideo && selectedVideo.url) {
                this.io.emit('play_video', { url: selectedVideo.url, category: 'content' });
            } else {
                this.currentBlockIndex++; await this.executeCurrentBlock();
            }

        } else if (block.type === 'explanation_random' || block.type === 'offer_ask') {
            this.currentState = 'PLAYING_CONTENT';
            let selectedVideo = block.videos[Math.floor(Math.random() * block.videos.length)];
            
            if (selectedVideo && selectedVideo.url) {
                this.io.emit('play_video', { url: selectedVideo.url, category: 'content' });
            } else {
                this.currentBlockIndex++; await this.executeCurrentBlock();
            }

        } else if (block.type === 'qa_session') {
            this.remainingQuota = parseInt(block.quota || 1);
            await this.processQaQueue();
        }
    }

    async processQaQueue() {
        if (this.remainingQuota > 0 && this.qaQueue.length > 0) {
            this.qaQueue.sort((a, b) => b.timestamp - a.timestamp);
            const nextQa = this.qaQueue.shift(); 
            
            console.log(`[Engine] 🎬 Memutar Jawaban untuk @${nextQa.username} (Intent: ${nextQa.intent}). Kuota sisa: ${this.remainingQuota - 1}`);
            
            this.currentState = 'PLAYING_RESPONSE';
            this.remainingQuota--;
            this.io.emit('play_video', { 
                url: nextQa.videoUrl, 
                category: 'response',
                username: nextQa.username,
                comment: nextQa.comment,
                ttsUrl: nextQa.ttsUrl,
                showOverlay: nextQa.showOverlay,
                ttsVolume: nextQa.ttsVolume
            });
        } else {
            console.log('[Engine] ⏭️ Antrean kosong/Kuota habis. Lanjut materi berikutnya.');
            this.currentBlockIndex++;
            await this.executeCurrentBlock();
        }
    }

    async handleVideoEnded(data) {
        if (data.category === 'content' && this.currentState !== 'PLAYING_CONTENT') return;
        if (data.category === 'response' && this.currentState !== 'PLAYING_RESPONSE') return;

        if (data.category === 'content') {
            this.currentBlockIndex++;
            await this.executeCurrentBlock();
        } else if (data.category === 'response') {
            await this.processQaQueue();
        }
    }

    async handleIncomingComment(username, rawText) {
        if (this.isProcessingComment) return;

        if (this.userCooldowns.has(username)) {
            console.log(`[AI Scanner] ⏳ Abaikan: @${username} sedang dalam jeda anti-spam (3 detik).`);
            return;
        }

        const currentCount = this.userResponseCount.get(username) || 0;
        if (currentCount >= this.maxResponsesPerUser) {
            console.log(`[AI Scanner] 🛑 Abaikan: @${username} sudah mencapai batas maksimal balasan.`);
            return;
        }

        try {
            this.isProcessingComment = true; 
            const cleanText = this.preprocessText(rawText);
            const response = await this.nlp.process('id', cleanText);
            const wordCount = cleanText.split(' ').length;
            const requiredConfidence = wordCount <= 2 ? 0.7 : 0.6; 

            console.log(`[AI Scanner] Komentar: "${cleanText}" | Terdeteksi: ${response.intent} | Skor: ${response.score.toFixed(2)}`);

            if (response.intent !== 'None' && response.score >= requiredConfidence) {
                if (!this.projectId) return;

                const qAsset = `
                    SELECT a.file_path FROM trigger_response_assets tra
                    JOIN assets a ON tra.asset_id = a.id
                    JOIN triggers t ON tra.trigger_id = t.id
                    WHERE t.keyword = $1 AND t.project_id = $2 
                    ORDER BY RANDOM() LIMIT 1
                `;
                const assetRes = await db.query(qAsset, [response.intent, this.projectId]);

                if (assetRes.rows.length > 0) {
                    const videoUrl = assetRes.rows[0].file_path;
                    
                    // --- SISTEM TTS (Base64) ---
                    let ttsUrl = '';
                    if (this.enableTts) {
                        try {
                            const safeText = cleanText.length > 150 ? cleanText.substring(0, 150) : cleanText;
                            const sapaan = `Pertanyaan dari ${username}, ${safeText}`;
                            
                            const base64Audio = await googleTTS.getAudioBase64(sapaan, {
                                lang: this.ttsLang, 
                                slow: this.ttsSpeed,
                                host: 'https://translate.google.com',
                                timeout: 5000
                            });
                            ttsUrl = `data:audio/mp3;base64,${base64Audio}`;
                        } catch (err) {
                            console.error('[TTS] Gagal membuat suara:', err.message);
                        }
                    }
                    
                    this.userResponseCount.set(username, currentCount + 1);
                    console.log(`[AI Queue] ✔️ Video untuk '${response.intent}' siap. Masuk Antrean.`);
                    
                    this.qaQueue.push({
                        username: username,
                        comment: rawText, 
                        intent: response.intent,
                        videoUrl: videoUrl,
                        ttsUrl: ttsUrl,
                        showOverlay: this.enableOverlay,
                        ttsVolume: this.ttsVolume,
                        timestamp: Date.now()
                    });

                    this.userCooldowns.set(username, true);
                    setTimeout(() => this.userCooldowns.delete(username), 3000); 
                } else {
                    console.log(`[AI Queue] ❌ Ditolak. Belum dipetakan.`);
                }
            }
        } catch (error) { console.error('[Engine] Error AI:', error); } 
        finally { this.isProcessingComment = false; }
    }

    async forceNextSequence() {
        this.remainingQuota = 0; 
        this.currentBlockIndex++;
        await this.executeCurrentBlock();
        return { success: true, message: 'Berhasil melompat paksa.' };
    }
}

module.exports = LiveEngine;