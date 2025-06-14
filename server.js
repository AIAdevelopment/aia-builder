const express = require('express');
const fs = require('fs');
const archiver = require('archiver');
const path = require('path');

const app = express();
app.use(express.json());

app.post('/build', async (req, res) => {
  const appName = req.body.appName || 'MyApp';
  const outputDir = `/tmp/${appName}`;

  fs.mkdirSync(outputDir, { recursive: true });

  fs.writeFileSync(`${outputDir}/Screen1.scm`, `
#|$JSON
{
  "blocks": [],
  "properties": {
    "AppName": "${appName}",
    "Uuid": "0",
    "VersionCode": 1,
    "VersionName": "1.0"
  }
}
`);
  fs.writeFileSync(`${outputDir}/Screen1.bky`, '');
  fs.writeFileSync(`${outputDir}/youngandroidproject`, `
#|$JSON
{
  "name": "${appName}",
  "assets": [],
  "source": ["Screen1.scm", "Screen1.bky"],
  "build": {}
}
`);

  const aiaPath = `/tmp/${appName}.aia`;
  const output = fs.createWriteStream(aiaPath);
  const archive = archiver('zip', { zlib: { level: 9 } });

  archive.pipe(output);
  archive.directory(outputDir, appName);
  await archive.finalize();

  const aiaData = fs.readFileSync(aiaPath);
  const base64AIA = aiaData.toString('base64');

  res.json({
    filename: `${appName}.aia`,
    data: base64AIA
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`AIA Builder running on port ${PORT}`);
});
