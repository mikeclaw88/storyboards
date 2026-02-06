// src/tools/server.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Paths
const TOOLS_DIR = __dirname;
const PROJECT_ROOT = path.join(TOOLS_DIR, '../..');
const PUBLIC_DIR = path.join(TOOLS_DIR, 'public');
const ASSETS_DIR = path.join(PROJECT_ROOT, 'public/assets');

// Serve static files from src/tools/public (HTML/JS)
app.use(express.static(PUBLIC_DIR));

// Serve assets from project root public/assets (Textures/JSON)
// Access via /assets/hole1/height.png etc.
app.use('/assets', express.static(ASSETS_DIR));

// --- API ROUTES ---

// GET Forest Data
app.get('/api/hole1/forest', (req, res) => {
    const filePath = path.join(ASSETS_DIR, 'hole1/forest_data.json');
    if (fs.existsSync(filePath)) {
        res.json(JSON.parse(fs.readFileSync(filePath, 'utf8')));
    } else {
        res.status(404).json({ error: 'Forest data not found' });
    }
});

// POST Forest Data (Save)
app.post('/api/hole1/forest', (req, res) => {
    const filePath = path.join(ASSETS_DIR, 'hole1/forest_data.json');
    try {
        fs.writeFileSync(filePath, JSON.stringify(req.body, null, 2));
        console.log('Saved forest_data.json');
        res.json({ success: true });
    } catch (err) {
        console.error('Error saving forest data:', err);
        res.status(500).json({ error: 'Failed to save' });
    }
});

app.listen(PORT, () => {
    console.log(`Hole 1 Viewer running at http://localhost:${PORT}/hole1_viewer.html`);
    console.log(`Serving assets from: ${ASSETS_DIR}`);
});
