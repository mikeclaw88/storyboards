import { useState, useEffect } from 'react';
import { useProgress } from '@react-three/drei';

export function LoadScreen() {
  const { active, progress } = useProgress();
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // Wait for R3F to be done + minimal delay to hide initial flicker
    if (!active && progress === 100) {
      const timer = setTimeout(() => {
        setFading(true);
        setTimeout(() => setVisible(false), 500); // Remove from DOM after fade
      }, 800); // 800ms hold time
      return () => clearTimeout(timer);
    }
  }, [active, progress]);

  if (!visible) return null;

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      background: '#1a1a1a',
      zIndex: 10000,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'opacity 0.5s ease-out',
      opacity: fading ? 0 : 1,
      pointerEvents: visible ? 'auto' : 'none',
    }}>
      <svg width="200" height="200" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="45" stroke="#4ade80" strokeWidth="2" />
        <path d="M30 70 Q 50 20 70 70" stroke="#4ade80" strokeWidth="4" strokeLinecap="round" />
        <circle cx="50" cy="30" r="5" fill="#fff" />
      </svg>
      <h1 style={{ 
        color: '#fff', 
        fontFamily: 'sans-serif', 
        marginTop: '20px',
        letterSpacing: '2px',
        textTransform: 'uppercase',
        fontSize: '1.5rem'
      }}>
        Golf Swing Trainer
      </h1>
      <div style={{
        marginTop: '20px',
        width: '200px',
        height: '4px',
        background: '#333',
        borderRadius: '2px',
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${progress}%`,
          height: '100%',
          background: '#4ade80',
          transition: 'width 0.2s ease-out'
        }} />
      </div>
    </div>
  );
}
