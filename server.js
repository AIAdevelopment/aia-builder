
const express = require('express');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

const app = express();
app.use(express.json());

app.post('/generate-aia', async (req, res) => {
    const appJson = req.body;
    const appName = appJson.appName || 'MyApp';
    const tmpDir = `/tmp/${Date.now()}`;
    const aiaPath = `/tmp/${appName}.aia`;

    fs.mkdirSync(tmpDir, { recursive: true });

    // For example, add basic structure for an empty AIA
    const srcDir = path.join(tmpDir, appName);
    fs.mkdirSync(srcDir);

    // Add mock Screen1.scm
    const scmContent = `(V1
  (Properties
    (Name "Screen1")
  )
)`;
    fs.writeFileSync(path.join(srcDir, 'Screen1.scm'), scmContent);

    // Create zip file
    const output = fs.createWriteStream(aiaPath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(output);
    archive.directory(srcDir, false);
    await archive.finalize();

    output.on('close', () => {
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename=${appName}.aia`);
        fs.createReadStream(aiaPath).pipe(res);
    });
});

app.listen(3000, () => console.log('AIA builder running on port 3000'));
