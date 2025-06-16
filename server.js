const express = require('express');
const fs = require('fs');
const archiver = require('archiver');
const path = require('path');

const app = express();
app.use(express.json());

app.post('/build', async (req, res) => {
  const appData = req.body;
  const appName = appData.app_name || 'MyApp';
  const safeAppName = appName.replace(/\s+/g, '_'); // For folder naming
  const outputDir = `/tmp/${safeAppName}`;

  fs.mkdirSync(outputDir, { recursive: true });

  // Create Screen1.scm
  const scm = {
    blocks: [],
    properties: {
      $Name: 'Screen1',
      Title: appName,
      AppName: appName,
      Sizing: 'Responsive',
      ShowStatusBar: true
    },
    components: appData.screens?.[0]?.components || []
  };
  fs.writeFileSync(`${outputDir}/Screen1.scm`, JSON.stringify(scm, null, 2));

  // Create Screen1.bky (empty for now)
  fs.writeFileSync(`${outputDir}/Screen1.bky`, '');

  // Create youngandroidproject
  const yap = {
    name: appName,
    assets: [],
    source: ['Screen1.scm', 'Screen1.bky'],
    build: {}
  };
  fs.writeFileSync(`${outputDir}/youngandroidproject`, JSON.stringify(yap, null, 2));

  // Create .aia ZIP file
  const aiaPath = `/tmp/${safeAppName}.aia`;
  const output = fs.createWriteStream(aiaPath);
  const archive = archiver('zip', { zlib: { level: 9 } });

  archive.pipe(output);
  archive.directory(outputDir, false);


  await archive.finalize();

  output.on('close', () => {
    const aiaData = fs.readFileSync(aiaPath);
    const base64AIA = aiaData.toString('base64');

    res.json({
      filename: `${appName}.aia`,
      data: base64AIA
    });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`AIA Builder running on port ${PORT}`);
});
