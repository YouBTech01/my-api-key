const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
const { exec } = require('child_process');
const archiver = require('archiver');
const extract = require('extract-zip');

const app = express();
const port = process.env.PORT || 3000;

// Add health check endpoint
app.get('/', (req, res) => {
  res.json({ status: 'ok' });
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tempDir = path.join(__dirname, '../temp', uuidv4());
    fs.ensureDirSync(tempDir);
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage });

// Create temp directory if it doesn't exist
fs.ensureDirSync(path.join(__dirname, '../temp'));

// Template directory path
const templateDir = path.join(__dirname, '../templates/android-webview');

// Function to check if Android SDK is available
const checkAndroidSDK = () => {
  return new Promise((resolve, reject) => {
    exec('sdkmanager --list', (error, stdout, stderr) => {
      if (error) {
        console.error('Android SDK not available:', error);
        reject(error);
      } else {
        resolve(true);
      }
    });
  });
};

app.post('/generate-app', upload.fields([
  { name: 'icon', maxCount: 1 },
  { name: 'htmlFile', maxCount: 1 }
]), async (req, res) => {
  try {
    // Check Android SDK availability
    try {
      await checkAndroidSDK();
    } catch (error) {
      return res.status(503).json({ 
        error: 'Android SDK not available. Please try again later.',
        details: error.message 
      });
    }

    const { appName, packageName, version, url } = req.body;
    const files = req.files;
    
    if (!appName || !packageName || !version || !url) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create a unique build directory
    const buildId = uuidv4();
    const buildDir = path.join(__dirname, '../temp', buildId);
    fs.ensureDirSync(buildDir);

    // Copy template to build directory
    await fs.copy(templateDir, buildDir);

    // Update AndroidManifest.xml
    const manifestPath = path.join(buildDir, 'app/src/main/AndroidManifest.xml');
    let manifest = await fs.readFile(manifestPath, 'utf8');
    manifest = manifest
      .replace('{{PACKAGE_NAME}}', packageName)
      .replace('{{APP_NAME}}', appName)
      .replace('{{VERSION}}', version);
    await fs.writeFile(manifestPath, manifest);

    // Update build.gradle
    const gradlePath = path.join(buildDir, 'app/build.gradle');
    let gradle = await fs.readFile(gradlePath, 'utf8');
    gradle = gradle
      .replace('{{PACKAGE_NAME}}', packageName)
      .replace('{{VERSION}}', version);
    await fs.writeFile(gradlePath, gradle);

    // Handle icon
    if (files.icon) {
      const iconPath = files.icon[0].path;
      const targetIconPath = path.join(buildDir, 'app/src/main/res/mipmap-xxxhdpi/ic_launcher.png');
      await fs.copy(iconPath, targetIconPath);
    }

    // Handle HTML file if provided
    if (files.htmlFile) {
      const htmlPath = files.htmlFile[0].path;
      const targetHtmlPath = path.join(buildDir, 'app/src/main/assets/web');
      
      if (path.extname(htmlPath) === '.zip') {
        await extract(htmlPath, { dir: targetHtmlPath });
      } else {
        await fs.copy(htmlPath, path.join(targetHtmlPath, 'index.html'));
      }
    }

    // Update WebView URL in MainActivity.java
    const mainActivityPath = path.join(buildDir, 'app/src/main/java/com/example/webview/MainActivity.java');
    let mainActivity = await fs.readFile(mainActivityPath, 'utf8');
    mainActivity = mainActivity.replace('{{URL}}', url);
    await fs.writeFile(mainActivityPath, mainActivity);

    // Build APK using Gradle
    const gradleCommand = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
    exec(`${gradleCommand} assembleDebug`, { cwd: buildDir }, async (error, stdout, stderr) => {
      if (error) {
        console.error(`Build error: ${error}`);
        return res.status(500).json({ 
          error: 'Failed to build APK',
          details: error.message,
          stdout,
          stderr
        });
      }

      const apkPath = path.join(buildDir, 'app/build/outputs/apk/debug/app-debug.apk');
      
      if (fs.existsSync(apkPath)) {
        // Clean up temporary files
        await fs.remove(path.dirname(files.icon[0].path));
        if (files.htmlFile) {
          await fs.remove(path.dirname(files.htmlFile[0].path));
        }

        res.json({
          success: true,
          apkPath: apkPath,
          downloadUrl: `/download/${buildId}`
        });
      } else {
        res.status(500).json({ error: 'APK generation failed' });
      }
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Download route
app.get('/download/:buildId', (req, res) => {
  const buildId = req.params.buildId;
  const apkPath = path.join(__dirname, '../temp', buildId, 'app/build/outputs/apk/debug/app-debug.apk');
  
  if (fs.existsSync(apkPath)) {
    res.download(apkPath, 'app.apk', (err) => {
      if (err) {
        console.error('Download error:', err);
      }
      // Clean up after download
      fs.remove(path.dirname(apkPath)).catch(console.error);
    });
  } else {
    res.status(404).json({ error: 'APK not found' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 