// frontend-player/src/pages/Player.jsx
import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
// IMPORT LOTTIE PLAYER DARI PUSTAKA RESMI
import { Player as LottiePlayer } from '@lottiefiles/react-lottie-player'; 

export default function Player() {
    const [isConnected, setIsConnected] = useState(false);
    const [hasInteracted, setHasInteracted] = useState(false);
    const [activePlayerState, setActivePlayerState] = useState(1);
    
    // STATE UNTUK OVERLAY KOMENTAR
    const [overlay, setOverlay] = useState({ visible: false, username: '', text: '' });

// STATE UNTUK ANIMASI LOTTIE (JSON)
const [activeAnimationData, setActiveAnimationData] = useState(null);
const [isAnimationVisible, setIsAnimationVisible] = useState(false);
const [animationKey, setAnimationKey] = useState(0);

    const activePlayerRef = useRef(1);
    const player1Ref = useRef(null);
    const player2Ref = useRef(null);
    
    // REF UNTUK PEMUTAR AUDIO TERPISAH
    const ttsAudioRef = useRef(null); 
    const sfxAudioRef = useRef(null); 
    
    const socketRef = useRef(null);
    const currentVideoMeta = useRef({ category: null, id: null, sequenceId: null });

    const isEndingNotified = useRef(false);
    const pendingPlay = useRef(null); 
    const overlayTimeoutRef = useRef(null); 
    const animationTimeoutRef = useRef(null); // Timer pengaman animasi

    const EARLY_TRIGGER_SECONDS = 0.5;

    const setActivePlayer = (num) => {
        activePlayerRef.current = num;
        setActivePlayerState(num);
    };

    useEffect(() => {
        const socket = io('http://localhost:3000', { reconnection: true });
        socketRef.current = socket;

        socket.on('connect', () => setIsConnected(true));
        socket.on('disconnect', () => setIsConnected(false));

        // --- 1. PENANGKAP SINYAL SFX (EFEK SUARA ACAK) ---
        socket.on('play_sfx', (payload) => {
            if (sfxAudioRef.current) {
                sfxAudioRef.current.src = payload.url;
                sfxAudioRef.current.volume = 0.4; 
                sfxAudioRef.current.load(); 
                const playPromise = sfxAudioRef.current.play();
                if (playPromise !== undefined) {
                    playPromise.catch(e => console.error("SFX Play Error:", e));
                }
            }
        });

        // --- 2. PENANGKAP SINYAL ANIMASI (LOTTIE) ---
        socket.on('play_animation', (payload) => {
            console.log("Menerima Data Lottie Mentah dari Socket");
            // Menyimpan objek data langsung dari Node.js
            setActiveAnimationData(payload.animationData);
            setIsAnimationVisible(true);
            setAnimationKey(prev => prev + 1); 
            
            if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current);
            animationTimeoutRef.current = setTimeout(() => {
                setIsAnimationVisible(false);
            }, 15000); 
        });

        // --- 3. PENANGKAP SINYAL VIDEO & TTS ---
        socket.on('play_video', (payload) => {
            const currentActive = activePlayerRef.current;
            const standbyNum = currentActive === 1 ? 2 : 1;
            const standbyVideo = currentActive === 1 ? player2Ref.current : player1Ref.current;
            const activeVideo = currentActive === 1 ? player1Ref.current : player2Ref.current;

            try {
                // Pre-load video standby
                standbyVideo.src = payload.url;
                standbyVideo.loop = false;
                standbyVideo.muted = false; 
                standbyVideo.load(); 

                currentVideoMeta.current = {
                    category: payload.category, id: payload.videoId, sequenceId: payload.sequenceId
                };

                const executePlay = () => {
                    setActivePlayer(standbyNum);
                    standbyVideo.currentTime = 0; 
                    standbyVideo.play().catch(e => console.error(e));
                    isEndingNotified.current = false; 

                    // LOGIKA OVERLAY & TTS (DIEKSEKUSI SAAT VIDEO GANTI)
                    if (payload.category === 'response') {
                        
                        // Overlay Komentar
                        if (payload.showOverlay) {
                            setOverlay({ visible: true, username: payload.username, text: payload.comment });
                            if (overlayTimeoutRef.current) clearTimeout(overlayTimeoutRef.current);
                            overlayTimeoutRef.current = setTimeout(() => {
                                setOverlay(prev => ({ ...prev, visible: false }));
                            }, 8000);
                        } else {
                            setOverlay({ visible: false, username: '', text: '' });
                        }
                        
                        // Suara Robot (TTS)
                        if (payload.ttsUrl && ttsAudioRef.current) {
                            ttsAudioRef.current.src = payload.ttsUrl;
                            ttsAudioRef.current.volume = payload.ttsVolume !== undefined ? payload.ttsVolume : 1.0;
                            ttsAudioRef.current.load(); 
                            
                            const playPromise = ttsAudioRef.current.play();
                            if (playPromise !== undefined) {
                                playPromise.catch(e => console.error("TTS Play Error:", e));
                            }
                        }

                    } else {
                        // Sembunyikan overlay jika kembali ke materi biasa
                        setOverlay({ visible: false, username: '', text: '' });
                    }

                    // Bersihkan video lama
                    setTimeout(() => {
                        activeVideo.pause();
                        activeVideo.src = ""; 
                    }, 100);
                };

                if (activeVideo.paused && activeVideo.currentTime === 0) {
                    executePlay();
                } else {
                    pendingPlay.current = executePlay;
                }

            } catch (error) { console.error('[Player] Error:', error); }
        });

        return () => socket.disconnect();
    }, []);

    // SENSOR PELATUK WAKTU VIDEO
    useEffect(() => {
        let animationId;
        const monitorTime = () => {
            const currentActive = activePlayerRef.current;
            const activeVideo = currentActive === 1 ? player1Ref.current : player2Ref.current;

            if (activeVideo && activeVideo.duration > 0 && activeVideo.currentTime > 1) {
                const timeLeft = activeVideo.duration - activeVideo.currentTime;
                if (timeLeft <= EARLY_TRIGGER_SECONDS && !isEndingNotified.current) {
                    isEndingNotified.current = true; 
                    if (socketRef.current) {
                        const meta = currentVideoMeta.current;
                        socketRef.current.emit('video_ended', { ...meta });
                    }
                }
            }
            animationId = requestAnimationFrame(monitorTime);
        };
        animationId = requestAnimationFrame(monitorTime);
        return () => cancelAnimationFrame(animationId);
    }, []);

    const handleNativeEnded = () => {
        if (pendingPlay.current) {
            pendingPlay.current();
            pendingPlay.current = null;
        } else {
            if (!isEndingNotified.current) {
                isEndingNotified.current = true;
                if (socketRef.current) socketRef.current.emit('video_ended', { ...currentVideoMeta.current });
            }
        }
    };

    const handleStartInteraction = () => {
        setHasInteracted(true);
        if (socketRef.current) {
            const params = new URLSearchParams(window.location.search);
            socketRef.current.emit('player_ready', { projectId: params.get('projectId') });
        }
    };

    // --- STYLING UI ---
    const containerStyle = { position: 'relative', width: '100vw', height: '100vh', backgroundColor: '#000', overflow: 'hidden' };
    const getPlayerStyle = (playerNum) => ({
        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 1,
        zIndex: activePlayerState === playerNum ? 10 : 1, visibility: activePlayerState === playerNum ? 'visible' : 'hidden'
    });
    
    const overlayIntroStyle = {
        position: 'absolute', zIndex: 99999, top: 0, left: 0, width: '100%', height: '100%',
        backgroundColor: '#111827', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#ffffff'
    };

    const commentBubbleStyle = {
        position: 'absolute',
        zIndex: 99,
        top: '15%',
        left: '5%',
        maxWidth: '75%',
        backgroundColor: 'rgba(0, 0, 0, 0.6)', 
        backdropFilter: 'blur(8px)', 
        borderRadius: '16px',
        padding: '15px 20px',
        color: 'white',
        borderLeft: '4px solid #10b981', 
        boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
        transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: overlay.visible ? 'translateX(0) scale(1)' : 'translateX(-50px) scale(0.9)',
        opacity: overlay.visible ? 1 : 0,
        pointerEvents: 'none' 
    };

    // Style Khusus untuk Animasi Lottie (Berada di atas video, tapi di bawah pop-up interaksi)
    const animationOverlayStyle = {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 50, 
        pointerEvents: 'none', 
        display: isAnimationVisible ? 'block' : 'none'
    };

    return (
        <div style={containerStyle}>
            {!hasInteracted && (
                <div style={overlayIntroStyle}>
                    <h1 style={{ marginBottom: '10px' }}>Monitor Siaran (Layar 2)</h1>
                    <p style={{ marginBottom: '30px', color: '#9ca3af' }}>{isConnected ? '🟢 Mesin Siap Mentransmisikan Video' : '🔴 Menunggu Sinyal Engine...'}</p>
                    <button onClick={handleStartInteraction} disabled={!isConnected} style={{ padding: '15px 40px', fontSize: '20px', fontWeight: 'bold', cursor: isConnected ? 'pointer' : 'not-allowed', backgroundColor: isConnected ? '#10b981' : '#4b5563', color: 'white', border: 'none', borderRadius: '8px' }}>
                        MULAI SIARAN OTOMATIS
                    </button>
                </div>
            )}

            {/* AUDIO TAG TERSEMBUNYI UNTUK SUARA AI (TTS) */}
            <audio ref={ttsAudioRef} style={{ display: 'none' }} />
            
            {/* AUDIO TAG TERSEMBUNYI UNTUK EFEK SUARA (SFX) */}
            <audio ref={sfxAudioRef} style={{ display: 'none' }} />

{/* LAYER ANIMASI LOTTIE (.json) BEBAS CORS */}
<div style={animationOverlayStyle}>
                {activeAnimationData && isAnimationVisible && (
                    <LottiePlayer
                        key={animationKey}
                        src={activeAnimationData} // Menerima data Object, bukan URL
                        autoplay={true}
                        loop={false}
                        onEvent={event => {
                            if (event === 'complete') setIsAnimationVisible(false);
                        }}
                        style={{ height: '100%', width: '100%' }}
                    />
                )}
            </div>

            {/* OVERLAY STIKER Q&A KOMENTAR */}
            <div style={commentBubbleStyle}>
                <div style={{ fontSize: '13px', color: '#a7f3d0', fontWeight: 'bold', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ fontSize: '16px' }}>💬</span> @{overlay.username} bertanya:
                </div>
                <div style={{ fontSize: '18px', fontWeight: '500', lineHeight: '1.4', textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>
                    "{overlay.text}"
                </div>
            </div>

            <video ref={player1Ref} style={getPlayerStyle(1)} onEnded={handleNativeEnded} playsInline preload="auto" />
            <video ref={player2Ref} style={getPlayerStyle(2)} onEnded={handleNativeEnded} playsInline preload="auto" />
        </div>
    );
}