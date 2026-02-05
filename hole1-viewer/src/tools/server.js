const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware to handle large JSON payloads (point clouds can be big)
app.use(bodyParser.json({ limit: '50mb' }));
app.use(express.static('public')); // Serves index.html and images

// Ensure output directory exists
const outputDir = path.join(__dirname, 'output');
if (!fs.existsSync(outputDir)){
    fs.mkdirSync(outputDir);
}

// THE SAVE ENDPOINT
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

app.listen(PORT, () => {
    console.log(`\n⛳ Golf Baker Server running at: http://localhost:${PORT}`);
    console.log(`   (Place 'hole1_surface.png' in the /public folder)\n`);
});