const express = require('express');
const fs = require('fs');
const archiver = require('archiver');
const path = require('path');

const app = express();
app.use(express.json());

// Debug log on startup
console.log('🥁 AIA Builder starting up...');

app.post('/build', async (req, res) => {
  console.log('🔔 Received /build request with body:', JSON.stringify(req.body));
  try {
    const appData = req.body;
    const appName = appData.app_name || 'MyApp';
    const safeAppName = appName.replace(/\s+/g, '_');
    const outputDir = `/tmp/${safeAppName}`;

    // Clean up any existing folder
    if (fs.existsSync(outputDir)) {
      fs.rmdirSync(outputDir, { recursive: true });
      console.log('🗑️ Cleared old outputDir:', outputDir);
    }
    fs.mkdirSync(outputDir, { recursive: true });

    // Write project files
    console.log('✏️ Writing project files to', outputDir);
    fs.writeFileSync(`${outputDir}/Screen1.scm`, JSON.stringify({
      blocks: [],
      properties: {
        $Name: 'Screen1',
        Title: appName,
        AppName: appName,
        Sizing: 'Responsive',
        ShowStatusBar: true
      },
      components: appData.screens?.[0]?.components || []
    }, null, 2));
    fs.writeFileSync(`${outputDir}/Screen1.bky`, '');
    fs.writeFileSync(`${outputDir}/youngandroidproject`, JSON.stringify({
      name: appName,
      assets: [],
      source: ['Screen1.scm', 'Screen1.bky'],
      build: {}
    }, null, 2));

    // Zip it
    const aiaPath = `/tmp/${safeAppName}.aia`;
    console.log('📦 Zipping to', aiaPath);
    const output = fs.createWriteStream(aiaPath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(output);
    archive.directory(outputDir, false);
    await archive.finalize();

    output.on('close', () => {
      console.log('✅ ZIP created, size:', archive.pointer());
      const aiaData = fs.readFileSync(aiaPath);
      const base64AIA = aiaData.toString('base64');
      res.json({ filename: `${appName}.aia`, data: base64AIA });
      console.log('📤 Response sent with base64 data length:', base64AIA.length);
    });

    output.on('error', err => { throw err; });
  } catch (e) {
    console.error('❌ Build error:', e);
    res.status(500).json({ error: e.message, stack: e.stack });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 AIA Builder listening on port ${PORT}`));
