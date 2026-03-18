// realtime-engine/services/LiveEngine.js
const db = require('../config/db');
const { NlpManager } = require('node-nlp');
const axios = require('axios');

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
        
        // PENGATURAN BATAS BALASAN ADMIN
        this.maxResponsesPerUser = 3; 
        this.userResponseCount = new Map();
        
        this.isProcessingComment = false;
        this.userCooldowns = new Map(); 

        this.slangDictionary = {
            // 1. Transaksi & Tanya Harga
            "brp": "berapa", "brapa": "berapa", "hrg": "harga", "hrga": "harga", "bl": "beli", 
            "bku": "buku", "co": "checkout", "tf": "transfer", "ongkir": "ongkos kirim", 
            "cod": "bayar di tempat", "duit": "uang", "mahal": "mahal", "murah": "murah", "diskon": "promo",
            
            // 2. Sapaan & Kata Ganti
            "bg": "bang", "bng": "bang", "min": "admin", "kk": "kakak", "kak": "kakak", 
            "sy": "saya", "aq": "aku", "gw": "saya", "gue": "saya", "lu": "kamu", "km": "kamu",
            
            // 3. Kata Hubung & Penunjuk Tempat
            "gmn": "bagaimana", "gimana": "bagaimana", "cr": "cara", "klo": "kalau", "klu": "kalau", 
            "mna": "dimana", "dmn": "dimana", "yg": "yang", "knp": "kenapa", "dgn": "dengan", 
            "utk": "untuk", "buat": "untuk", "trs": "terus", "tp": "tapi", "kpn": "kapan", "dr": "dari",
            
            // 4. Skincare & Beauty Terms (Spesifik Kulit)
            "jrwtn": "jerawatan", "jrwt": "jerawat", "bruntus": "bruntusan", "kusem": "kusam", 
            "bks": "bekas", "fw": "sabun muka", "ss": "sunscreen", "moist": "pelembap", 
            "krim": "cream", "brminyak": "berminyak", "minyakan": "berminyak", "kering": "kering",
            "sensi": "sensitif", "bopeng": "bekas luka", "flek": "noda hitam", "glowing": "cerah",
            
            // 5. TikTok Slang
            "spill": "kasih tahu", "dong": "tolong", "pls": "tolong", "bgt": "banget", 
            "beneran": "sungguh", "bner": "benar", "gk": "tidak", "ga": "tidak", "gak": "tidak",
            "tdk": "tidak", "blm": "belum", "udah": "sudah", "udh": "sudah", "dpt": "dapat"
        };

        this.nlp = new NlpManager({ languages: ['id'], forceNER: true, nlu: { log: false } });
        this.trainAiModel();
    }

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
                console.warn(`[AI Engine] ⚠️ Kamus ditemukan, tapi tidak ada kalimat pola yang valid.`);
            }
        } catch (error) { 
            console.error('[AI Engine] ❌ Gagal mengunduh kamus:', error.message); 
            console.log('[AI Engine] ⏳ Peladen Laravel sepertinya belum siap. Mencoba lagi dalam 10 detik...');
            setTimeout(() => this.trainAiModel(), 10000); 
        }
    }

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
            
            // RESET PENTING: Membuka kembali kuota semua pengguna saat siaran profil baru dimulai
            this.userResponseCount.clear(); 
            
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
            this.io.emit('play_video', { url: nextQa.videoUrl, category: 'response' });
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

        // PERBAIKAN MUTLAK 1: Sensor Anti-Spam sekarang memiliki "Suara" dan durasi dipangkas
        if (this.userCooldowns.has(username)) {
            console.log(`[AI Scanner] ⏳ Abaikan: @${username} sedang dalam jeda anti-spam (tunggu 3 detik).`);
            return;
        }

        // PERBAIKAN MUTLAK 2: Sensor Kuota Admin
        const currentCount = this.userResponseCount.get(username) || 0;
        if (currentCount >= this.maxResponsesPerUser) {
            console.log(`[AI Scanner] 🛑 Abaikan: @${username} sudah mencapai batas maksimal balasan dari Admin (${this.maxResponsesPerUser}x).`);
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
                
                if (!this.projectId) {
                    console.log(`[AI Queue] ❌ Ditolak. Engine belum memuat ID Profil dari Layar 2.`);
                    return;
                }

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
                    
                    // PENAMBAHAN KUOTA PENGGUNA YANG BERHASIL
                    this.userResponseCount.set(username, currentCount + 1);
                    console.log(`[AI Queue] ✔️ Video untuk '${response.intent}' siap. (Balasan ke-${currentCount + 1} untuk @${username})`);
                    
                    this.qaQueue.push({
                        username: username,
                        intent: response.intent,
                        videoUrl: videoUrl,
                        timestamp: Date.now()
                    });

                    // JEDA SEMENTARA DIPANGKAS MENJADI 3 DETIK SAJA
                    this.userCooldowns.set(username, true);
                    setTimeout(() => this.userCooldowns.delete(username), 3000); 
                } else {
                    console.log(`[AI Queue] ❌ Ditolak. Profil ID ${this.projectId} belum memetakan video untuk intent '${response.intent}'.`);
                }
            } else if (response.intent === 'None') {
                console.log(`[AI Scanner] Abaikan: Komentar tidak ada di Kamus AI.`);
            } else {
                console.log(`[AI Scanner] Abaikan: Skor terlalu rendah (< ${requiredConfidence}).`);
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