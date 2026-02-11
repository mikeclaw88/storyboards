import { useState } from 'react';
import { runCityImport } from '../lib/cityImporter';
import { useCityStore } from '../stores/cityStore';

export function MenuBar() {
  const [importing, setImporting] = useState(false);
  const heightPercent = useCityStore((s) => s.heightPercent);
  const setHeightPercent = useCityStore((s) => s.setHeightPercent);
  const setBuildings = useCityStore((s) => s.setBuildings);
  const setProcessedHeightTexture = useCityStore((s) => s.setProcessedHeightTexture);

  const handleImport = async () => {
    setImporting(true);
    try {
      const result = await runCityImport(heightPercent);
      setBuildings(result.buildings);
      setProcessedHeightTexture(result.processedHeightTexture);
    } catch (err) {
      console.error('City import failed:', err);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: 16,
        left: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        zIndex: 10,
      }}
    >
      <div
        style={{
          color: 'white',
          fontSize: 18,
          fontWeight: 700,
          textShadow: '0 2px 4px rgba(0,0,0,0.5)',
        }}
      >
        City Viewer
      </div>
      <button
        onClick={handleImport}
        disabled={importing}
        style={{
          padding: '8px 16px',
          background: importing ? '#666' : '#2563eb',
          color: 'white',
          border: 'none',
          borderRadius: 6,
          fontSize: 14,
          fontWeight: 600,
          cursor: importing ? 'wait' : 'pointer',
          boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
        }}
      >
        {importing ? 'Importing...' : 'City V1 Import'}
      </button>
      <label
        style={{
          color: 'white',
          fontSize: 13,
          fontWeight: 600,
          textShadow: '0 1px 3px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        Height: {heightPercent}%
        <input
          type="range"
          min={0}
          max={100}
          value={heightPercent}
          onChange={(e) => setHeightPercent(Number(e.target.value))}
          style={{ width: '100%' }}
        />
      </label>
    </div>
  );
}
