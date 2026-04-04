const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const Detection = require('../models/Detection');

const PYTHON = process.env.PYTHON_PATH || 'python';
const PREDICT_SCRIPT = path.join(
  __dirname,
  '../ai models/traffic sing/S.A.V.E.S/predict.py'
);

const UPLOADS_DIR = path.join(__dirname, '../../uploads/esp32');
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB hard limit

// Ensure upload directory exists at startup
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/**
 * Spawn Python YOLO script, parse results, log to console, save to MongoDB.
 */
function processImageWithAI(filepath) {
  console.log(`🤖 [AI] Running YOLO on: ${path.basename(filepath)}`);

  const py = spawn(PYTHON, [PREDICT_SCRIPT, filepath]);

  let stdout = '';
  let stderr = '';

  py.stdout.on('data', (d) => { stdout += d.toString(); });
  py.stderr.on('data', (d) => { stderr += d.toString(); });

  py.on('close', async (code) => {
    if (code !== 0) {
      console.error(`❌ [AI] Python exited with code ${code}`);
      if (stderr) console.error(`   ${stderr.trim()}`);
      return;
    }

    let parsed;
    try {
      parsed = JSON.parse(stdout.trim());
    } catch (e) {
      console.error(`❌ [AI] Failed to parse Python output: ${stdout}`);
      return;
    }

    const { detections } = parsed;

    if (!detections || detections.length === 0) {
      console.log(`🔍 [AI] No detections found in ${path.basename(filepath)}`);
      return;
    }

    console.log(`\n📊 [AI] ${detections.length} detection(s) found:`);

    for (const det of detections) {
      if (det.isStop) {
        console.log(`   🚨 STOP SIGN DETECTED — confidence: ${(det.confidence * 100).toFixed(1)}%`);
      } else {
        console.log(`   🏷️  ${det.label} — confidence: ${(det.confidence * 100).toFixed(1)}%`);
      }

      try {
        await Detection.create({
          label:      det.label,
          confidence: det.confidence,
          isStop:     det.isStop,
          timestamp:  new Date(det.timestamp),
        });
        console.log(`   ✅ Saved to MongoDB`);
      } catch (err) {
        console.error(`   ❌ MongoDB save failed: ${err.message}`);
      }
    }

    console.log('');
  });
}

// @desc    List all saved ESP32 images
// @route   GET /api/upload
exports.listImages = (req, res) => {
  fs.readdir(UPLOADS_DIR, (err, files) => {
    if (err) return res.status(500).json({ success: false, message: 'Could not read uploads folder' });

    const images = files
      .filter((f) => f.endsWith('.jpg'))
      .map((f) => ({
        filename: f,
        url: `${req.protocol}://${req.get('host')}/api/upload/${f}`,
      }));

    return res.status(200).json({ success: true, count: images.length, images });
  });
};

// @desc    Serve a single image by filename
// @route   GET /api/upload/:filename
exports.getImage = (req, res) => {
  const filename = path.basename(req.params.filename); // sanitize
  const filepath = path.join(UPLOADS_DIR, filename);

  if (!fs.existsSync(filepath)) {
    return res.status(404).json({ success: false, message: 'Image not found' });
  }

  res.setHeader('Content-Type', 'image/jpeg');
  fs.createReadStream(filepath).pipe(res);
};

// @desc    Receive raw JPEG from ESP32-CAM and save to disk
// @route   POST /api/upload
// @access  Public
exports.receiveImage = (req, res) => {
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const contentType = req.headers['content-type'] || '';
  const timestamp = new Date().toISOString();

  console.log('─────────────────────────────────────────');
  console.log(`📡 [ESP32] Incoming connection`);
  console.log(`   IP          : ${clientIp}`);
  console.log(`   Time        : ${timestamp}`);
  console.log(`   Content-Type: ${contentType}`);

  // Reject non-JPEG
  if (!contentType.includes('image/jpeg')) {
    console.warn(`⚠️  [ESP32] Rejected — wrong Content-Type: ${contentType}`);
    return res.status(415).json({ success: false, message: 'Expected Content-Type: image/jpeg' });
  }

  // express.raw() already parsed the body into a Buffer
  const buffer = req.body;

  if (!buffer || buffer.length === 0) {
    console.warn(`⚠️  [ESP32] Empty body from ${clientIp}`);
    return res.status(400).json({ success: false, message: 'Empty body — no image data received' });
  }

  // Validate JPEG magic bytes: FF D8 FF
  if (buffer[0] !== 0xff || buffer[1] !== 0xd8 || buffer[2] !== 0xff) {
    console.warn(`⚠️  [ESP32] Invalid JPEG magic bytes from ${clientIp}`);
    return res.status(400).json({ success: false, message: 'Invalid JPEG data' });
  }

  console.log(`   Size        : ${(buffer.length / 1024).toFixed(1)} KB`);

  const filename = `image_${Date.now()}.jpg`;
  const filepath = path.join(UPLOADS_DIR, filename);

  fs.writeFile(filepath, buffer, (err) => {
    if (err) {
      console.error(`❌ [ESP32] Failed to save image: ${err.message}`);
      return res.status(500).json({ success: false, message: 'Failed to save image' });
    }

    console.log(`✅ [ESP32] Image saved: ${filename}`);
    console.log(`   Saved to    : uploads/esp32/${filename}`);
    console.log('─────────────────────────────────────────');

    setImmediate(() => processImageWithAI(filepath));

    return res.status(200).json({ success: true, filename, timestamp, size: buffer.length });
  });
};
