const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware to handle large JSON payloads (point clouds can be big)
app.use(bodyParser.json({ limit: '50mb' }));
app.use(express.static('public')); // Serves index.html and images
app.use('/output', express.static(path.join(__dirname, 'output'))); // Serves tree textures etc.
app.use('/assets', express.static(path.join(__dirname, '../../public/assets'))); // Serves main project assets

// Ensure output directory exists
const outputDir = path.join(__dirname, 'output');
if (!fs.existsSync(outputDir)){
    fs.mkdirSync(outputDir);
}

// THE SAVE ENDPOINT (legacy - saves to output folder)
app.post('/save-data', (req, res) => {
    const data = req.body;

    console.log("Received bake data...");

    try {
        // 1. Save as JSON (Best for your engine)
        const jsonPath = path.join(outputDir, 'forest_data.json');
        fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2));

        // 2. Save as TXT (If you need a simple coordinate list)
        // Format: "Tree: x,y" and "LipVert: x,y"
        let txtContent = "--- FOREST DATA ---\n";
        txtContent += `Total Trees: ${data.trees.length}\n`;
        txtContent += `Total Lip Vertices: ${data.lipVertices.length}\n\n`;

        txtContent += "--- TREES (X, Y) ---\n";
        data.trees.forEach(t => {
            txtContent += `${t.x},${t.y}\n`;
        });

        txtContent += "\n--- LIP GEOMETRY (X, Y) ---\n";
        data.lipVertices.forEach(v => {
            txtContent += `${v.x},${v.y}\n`;
        });

        const txtPath = path.join(outputDir, 'forest_data.txt');
        fs.writeFileSync(txtPath, txtContent);

        console.log(`Success! Saved to: \n  - ${jsonPath}\n  - ${txtPath}`);
        res.json({ status: 'success', message: 'Files saved to /output folder' });

    } catch (err) {
        console.error("Error writing files:", err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// Assets base path
const assetsPath = path.join(__dirname, '../../public/assets');

// GET list of available holes
app.get('/api/holes', (req, res) => {
    try {
        const dirs = fs.readdirSync(assetsPath, { withFileTypes: true })
            .filter(d => d.isDirectory() && d.name.startsWith('hole'))
            .map(d => d.name)
            .sort();
        res.json(dirs);
    } catch (err) {
        console.error("Error listing holes:", err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// GET forest data for a hole
app.get('/api/holes/:hole/forest', (req, res) => {
    try {
        const dataPath = path.join(assetsPath, req.params.hole, 'forest_data.json');
        const data = fs.readFileSync(dataPath, 'utf8');
        res.json(JSON.parse(data));
    } catch (err) {
        console.error("Error reading forest data:", err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// POST save forest data for a hole
app.post('/api/holes/:hole/forest', (req, res) => {
    try {
        const dataPath = path.join(assetsPath, req.params.hole, 'forest_data.json');
        fs.writeFileSync(dataPath, JSON.stringify(req.body, null, 2));
        console.log(`Saved forest data to ${dataPath}`);
        res.json({ status: 'success', message: 'Forest data saved' });
    } catch (err) {
        console.error("Error saving forest data:", err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// Legacy endpoints for hole1 (backwards compatibility)
app.get('/api/hole1/forest', (req, res) => {
    res.redirect('/api/holes/hole1/forest');
});
app.post('/api/hole1/forest', (req, res) => {
    try {
        const dataPath = path.join(assetsPath, 'hole1', 'forest_data.json');
        fs.writeFileSync(dataPath, JSON.stringify(req.body, null, 2));
        console.log(`Saved forest data to ${dataPath}`);
        res.json({ status: 'success', message: 'Forest data saved' });
    } catch (err) {
        console.error("Error saving forest data:", err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`\n⛳ Golf Baker Server running at: http://localhost:${PORT}`);
    console.log(`   Assets served from /assets/\n`);
});