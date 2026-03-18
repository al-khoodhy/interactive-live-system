// frontend-player/src/pages/Player.jsx
import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

const PLAYER_CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');

.player-overlay {
  position: absolute; z-index: 999; inset: 0;
  background: radial-gradient(ellipse at center, #0d1117 0%, #000 100%);
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  font-family: 'DM Sans', sans-serif;
  gap: 0;
}

.player-overlay__logo {
  width: 72px; height: 72px; border-radius: 20px;
  background: linear-gradient(135deg, #58a6ff22, #58a6ff44);
  border: 1px solid #58a6ff44;
  display: flex; align-items: center; justify-content: center;
  font-size: 34px;
  margin-bottom: 28px;
  animation: logoFloat 3s ease-in-out infinite;
}
@keyframes logoFloat {
  0%,100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

.player-overlay__title {
  font-size: 26px; font-weight: 700; color: #e6edf3;
  margin-bottom: 8px; letter-spacing: -.02em;
}
.player-overlay__sub {
  font-size: 14px; color: #8b949e; margin-bottom: 40px;
  display: flex; align-items: center; gap: 8px;
}
.player-overlay__sub .dot-live {
  width: 8px; height: 8px; border-radius: 50%;
  animation: pulseDot 1.8s ease infinite;
}
.dot-live--green { background: #3fb950; box-shadow: 0 0 6px #3fb950; }
.dot-live--gray  { background: #484f58; }
@keyframes pulseDot {
  0%,100% { opacity: 1; }
  50% { opacity: .4; }
}

.player-start-btn {
  padding: 16px 48px;
  background: #3fb950; color: #000;
  border: none; border-radius: 12px;
  font-size: 16px; font-weight: 700;
  font-family: 'DM Sans', sans-serif;
  cursor: pointer; letter-spacing: .02em;
  transition: all .2s;
  box-shadow: 0 0 24px #3fb95044;
}
.player-start-btn:hover:not(:disabled) {
  background: #56d364;
  box-shadow: 0 0 36px #3fb95066;
  transform: translateY(-2px);
}
.player-start-btn:disabled {
  background: #21262d; color: #484f58;
  cursor: not-allowed; box-shadow: none;
}

.player-start-btn-sub {
  font-size: 12px; color: #484f58; margin-top: 16px;
  font-family: 'DM Sans', sans-serif; text-align: center;
}

/* scanning lines effect on overlay */
.player-overlay::after {
  content: '';
  position: absolute; inset: 0; pointer-events: none;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(255,255,255,.015) 2px,
    rgba(255,255,255,.015) 4px
  );
}
`;

function injectCSS(id, css) {
  if (document.getElementById(id)) return;
  const s = document.createElement('style');
  s.id = id; s.textContent = css;
  document.head.appendChild(s);
}

export default function Player() {
  const [isConnected, setIsConnected] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [activePlayerState, setActivePlayerState] = useState(1);

  const activePlayerRef = useRef(1);
  const player1Ref = useRef(null);
  const player2Ref = useRef(null);
  const socketRef = useRef(null);
  const currentVideoMeta = useRef({ category: null, id: null, sequenceId: null });
  const isEndingNotified = useRef(false);
  const pendingPlay = useRef(null);

  const EARLY_TRIGGER_SECONDS = 0.5;

  const setActivePlayer = (num) => {
    activePlayerRef.current = num;
    setActivePlayerState(num);
  };

  useEffect(() => {
    injectCSS('player-css', PLAYER_CSS);
    const socket = io('http://localhost:3000', { reconnection: true });
    socketRef.current = socket;

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    socket.on('play_video', (payload) => {
      const currentActive = activePlayerRef.current;
      const standbyNum = currentActive === 1 ? 2 : 1;
      const standbyVideo = currentActive === 1 ? player2Ref.current : player1Ref.current;
      const activeVideo  = currentActive === 1 ? player1Ref.current : player2Ref.current;

      try {
        standbyVideo.src = payload.url;
        standbyVideo.loop = false;
        standbyVideo.muted = false;
        standbyVideo.load();

        currentVideoMeta.current = {
          category: payload.category,
          id: payload.videoId,
          sequenceId: payload.sequenceId
        };

        if (activeVideo.paused && activeVideo.currentTime === 0) {
          setActivePlayer(standbyNum);
          standbyVideo.play().catch(e => console.error(e));
          isEndingNotified.current = false;
        } else {
          pendingPlay.current = () => {
            setActivePlayer(standbyNum);
            standbyVideo.currentTime = 0;
            standbyVideo.play().catch(e => console.error(e));
            isEndingNotified.current = false;
            setTimeout(() => {
              activeVideo.pause();
              activeVideo.src = '';
            }, 100);
          };
        }
      } catch (err) { console.error('[Player] Error:', err); }
    });

    return () => socket.disconnect();
  }, []);

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
            socketRef.current.emit('video_ended', { ...currentVideoMeta.current });
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
        if (socketRef.current) {
          socketRef.current.emit('video_ended', { ...currentVideoMeta.current });
        }
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

  const getPlayerStyle = (num) => ({
    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
    objectFit: 'cover',
    zIndex: activePlayerState === num ? 10 : 1,
    visibility: activePlayerState === num ? 'visible' : 'hidden',
  });

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', backgroundColor: '#000', overflow: 'hidden' }}>
      {!hasInteracted && (
        <div className="player-overlay">
          <div className="player-overlay__logo">📺</div>
          <div className="player-overlay__title">Monitor Siaran</div>
          <div className="player-overlay__sub">
            <span className={`dot-live ${isConnected ? 'dot-live--green' : 'dot-live--gray'}`} />
            {isConnected ? 'Mesin siap mentransmisikan video' : 'Menunggu sinyal dari engine...'}
          </div>
          <button
            className="player-start-btn"
            onClick={handleStartInteraction}
            disabled={!isConnected}
          >
            ▶ Mulai Siaran Otomatis
          </button>
          <div className="player-start-btn-sub">
            {isConnected
              ? 'Klik untuk mengaktifkan audio & memulai pemutar'
              : 'Hubungkan engine terlebih dahulu dari Layar 1'}
          </div>
        </div>
      )}

      <video ref={player1Ref} style={getPlayerStyle(1)} onEnded={handleNativeEnded} playsInline preload="auto" />
      <video ref={player2Ref} style={getPlayerStyle(2)} onEnded={handleNativeEnded} playsInline preload="auto" />
    </div>
  );
}