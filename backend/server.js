const express = require('express');
const multer = require('multer');
const cors = require('cors');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const axios = require('axios');
const { exec } = require('child_process');
const sharp = require('sharp');

const app = express();
const PORT = 5000;
const HOST = '127.0.0.1';

app.use(cors());
app.use(express.json());
app.use('/media', express.static(path.join(__dirname, 'media')));

app.listen(PORT, HOST, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

const GLOBAL_JSON_PATH = path.join(__dirname, 'data.json');
const MEDIA_DIR = path.join(__dirname, 'media');

if (!fs.existsSync(MEDIA_DIR)) {
    fs.mkdirSync(MEDIA_DIR, { recursive: true });
}

const isVideoFile = (filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    return ['.mp4', '.mkv', '.mov', '.webm'].includes(ext);
};

async function generateImageThumbnail(inputPath, outputPath) {
    try {
        await sharp(inputPath)
            .resize({ width: 300, withoutEnlargement: true })
            .jpeg({ quality: 75 })
            .toFile(outputPath);
    } catch (err) {
        console.error(err.message);
    }
}

function generateVideoThumbnail(inputPath, outputPath) {
    return new Promise((resolve) => {
        const cmd = `ffmpeg -y -ss 00:00:01 -i "${inputPath}" -vframes 1 -vf "scale=300:-1" -q:v 5 "${outputPath}"`;
        exec(cmd, () => resolve());
    });
}

function checkAudioStream(videoPath) {
    return new Promise((resolve) => {
        const cmd = `ffprobe -v error -select_streams a -show_entries stream=codec_name -of default=noprint_wrappers=1:nokey=1 "${videoPath}"`;
        exec(cmd, (error, stdout) => {
            if (error || !stdout.trim()) {
                resolve(false);
            } else {
                resolve(true);
            }
        });
    });
}

const generatePostId = () => {
    const now = new Date();
    const pad = (num) => String(num).padStart(2, '0');
    const yy = String(now.getFullYear()).slice(-2);
    const mm = pad(now.getMonth() + 1);
    const dd = pad(now.getDate());
    const hh = pad(now.getHours());
    const min = pad(now.getMinutes());
    const ss = pad(now.getSeconds());
    return `post_${yy}${mm}${dd}_${hh}${min}${ss}`;
};

function appendToGlobalJson(newEntry) {
    let globalData = [];
    if (fs.existsSync(GLOBAL_JSON_PATH)) {
        try {
            globalData = JSON.parse(fs.readFileSync(GLOBAL_JSON_PATH, 'utf-8') || '[]');
        } catch (e) {
            globalData = [];
        }
    }
    globalData.push(newEntry);
    fs.writeFileSync(GLOBAL_JSON_PATH, JSON.stringify(globalData, null, 2));
}

const getChromiumPath = () => {
    if (process.env.PUPPETEER_EXECUTABLE_PATH) return process.env.PUPPETEER_EXECUTABLE_PATH;
    const termuxPaths = [
        '/data/data/com.termux/files/usr/bin/chromium',
        '/data/data/com.termux/files/usr/bin/chromium-browser'
    ];
    for (const p of termuxPaths) {
        if (fs.existsSync(p)) return p;
    }
    return undefined;
};

// 1. Download Post directly from URL (Videos & Image Carousels)
app.post('/api/posts/from-url', async (req, res) => {
    try {
        const { media_url, title, caption, tags, categories } = req.body;

        if (!media_url) {
            return res.status(400).json({ error: 'A valid post URL is required.' });
        }

        const postId = generatePostId();
        const postDir = path.join(MEDIA_DIR, postId);
        if (!fs.existsSync(postDir)) {
            fs.mkdirSync(postDir, { recursive: true });
        }

        const outputTemplate = path.join(postDir, 'temp_%(autonumber)s.%(ext)s');
        const ytDlpPath = 'yt-dlp';
        
        const command = `"${ytDlpPath}" --user-agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" --no-warnings -o "${outputTemplate}" "${media_url}"`;
      
        try {
            await new Promise((resolve, reject) => {
                exec(command, (error, stdout, stderr) => {
                    const files = fs.readdirSync(postDir);
                    if (error && files.length === 0) {
                        return reject(new Error(stderr || stdout || error.message));
                    }
                    resolve();
                });
            });
        } catch (ytDlpError) {
            if (fs.existsSync(postDir)) fs.rmSync(postDir, { recursive: true, force: true });
            return res.status(422).json({ error: `yt-dlp failed to download: ${ytDlpError.message}` });
        }

        const allowedExtensions = ['.mp4', '.mkv', '.mov', '.webm', '.jpg', '.jpeg', '.png', '.webp', '.gif'];
        const filesInDir = fs.readdirSync(postDir);

        const downloadedFiles = filesInDir
            .filter(file => {
                const ext = path.extname(file).toLowerCase();
                const isMediaFile = file !== 'metadata.json' && !file.startsWith('.') && allowedExtensions.includes(ext);
                if (!isMediaFile && file !== 'metadata.json' && !file.startsWith('.')) {
                    try { fs.unlinkSync(path.join(postDir, file)); } catch (e) {}
                }
                return isMediaFile;
            })
            .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

        if (downloadedFiles.length === 0) {
            if (fs.existsSync(postDir)) fs.rmSync(postDir, { recursive: true, force: true });
            return res.status(422).json({ error: 'No valid media files or carousel images could be extracted from this URL.' });
        }

        const relativePaths = [];
        for (let index = 0; index < downloadedFiles.length; index++) {
            const file = downloadedFiles[index];
            const ext = path.extname(file);
            const standardName = `media_${index}${ext}`;
            const oldPath = path.join(postDir, file);
            const newPath = path.join(postDir, standardName);

            fs.renameSync(oldPath, newPath);
            relativePaths.push(`media/${postId}/${standardName}`);

            const thumbName = `media_${index}_thumb.jpg`;
            const thumbPath = path.join(postDir, thumbName);

            if (isVideoFile(newPath)) {
                await generateVideoThumbnail(newPath, thumbPath);
            } else {
                await generateImageThumbnail(newPath, thumbPath);
            }
        }

        const parsedTags = tags ? JSON.parse(tags) : [];
        const parsedCategories = categories ? JSON.parse(categories) : [];
        const createdAt = new Date().toISOString();

        const metadata = {
            id: postId,
            title: title || "",
            source_url: media_url,
            caption: caption || "",
            categories: parsedCategories,
            created_at: createdAt
        };
        fs.writeFileSync(path.join(postDir, 'metadata.json'), JSON.stringify(metadata, null, 2));

        const newGlobalEntry = {
            id: postId,
            title: title || "",
            source_url: media_url,
            caption: caption || "",
            paths: relativePaths,
            tags: parsedTags,
            categories: parsedCategories,
            created_at: createdAt
        };
        appendToGlobalJson(newGlobalEntry);

        res.status(201).json({ success: true, post: newGlobalEntry });
    } catch (error) {
        res.status(500).json({ error: `Internal execution error: ${error.message}` });
    }
});

// 2. Scrape Carousel Image URLs strictly from post target
app.post('/api/scrape', async (req, res) => {
    let { url } = req.body;
    if (!url) return res.status(400).json({ error: 'Please provide a valid URL' });

    // Method 1: yt-dlp JSON inspection
    try {
        const ytDlpCmd = `yt-dlp -J --no-warnings "${url}"`;
        const stdout = await new Promise((resolve, reject) => {
            exec(ytDlpCmd, { maxBuffer: 1024 * 1024 * 20 }, (err, stdout) => {
                if (err) return reject(err);
                resolve(stdout);
            });
        });

        const info = JSON.parse(stdout);
        const extracted = [];

        if (info.entries && Array.isArray(info.entries)) {
            info.entries.forEach(entry => {
                const imgUrl = entry.url || entry.display_url || (entry.thumbnails && entry.thumbnails.length ? entry.thumbnails[entry.thumbnails.length - 1].url : null);
                if (imgUrl) extracted.push(imgUrl);
            });
        } else if (info.url || info.display_url) {
            extracted.push(info.url || info.display_url);
        }

        if (extracted.length > 0) {
            return res.json({ images: extracted });
        }
    } catch (ytDlpErr) {
        console.log('Fallback to Puppeteer:', ytDlpErr.message);
    }

    // Method 2: Termux Puppeteer Fallback scoped strictly to <article>
    let browser;
    try {
        const chromiumPath = getChromiumPath();
        browser = await puppeteer.launch({
            headless: 'new',
            executablePath: chromiumPath,
            args: [
                '--no-sandbox', 
                '--disable-setuid-sandbox', 
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--single-process',
                '--no-zygote'
            ]
        });

        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15');
        await page.setViewport({ width: 430, height: 932, isMobile: true, hasTouch: true });
        
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await new Promise(resolve => setTimeout(resolve, 2500));

        const extractedImages = await page.evaluate(() => {
            const urls = new Set();
            const article = document.querySelector('article') || document;
            
            const imgs = article.querySelectorAll('img');
            imgs.forEach(img => {
                const src = img.getAttribute('src') || img.getAttribute('data-src');
                if (!src || !src.startsWith('https://')) return;

                const isInsideHeader = img.closest('header') !== null;
                const width = img.naturalWidth || img.width || 0;
                const height = img.naturalHeight || img.height || 0;

                if (!isInsideHeader && (width === 0 || width >= 300) && (height === 0 || height >= 300)) {
                    urls.add(src);
                }
            });
            return Array.from(urls);
        });

        await browser.close();

        if (extractedImages.length === 0) {
            return res.status(404).json({ error: 'No carousel image links found on the provided page.' });
        }

        res.json({ images: extractedImages });
    } catch (error) {
        if (browser) await browser.close();
        res.status(500).json({ error: `Scraper failure: ${error.message}` });
    }
});

// 3. Save selected carousel image URLs
app.post('/api/posts/from-image-urls', async (req, res) => {
    try {
        const { image_urls, title, caption, tags, categories } = req.body;
        const urlsArray = typeof image_urls === 'string' ? JSON.parse(image_urls) : image_urls;

        if (!urlsArray || !Array.isArray(urlsArray) || urlsArray.length === 0) {
            return res.status(400).json({ error: 'At least one valid image URL is required.' });
        }

        const postId = generatePostId();
        const postDir = path.join(MEDIA_DIR, postId);
        if (!fs.existsSync(postDir)) fs.mkdirSync(postDir, { recursive: true });

        const relativePaths = [];

        for (let i = 0; i < urlsArray.length; i++) {
            const url = urlsArray[i];
            try {
                const response = await axios({
                    method: 'get',
                    url: url,
                    responseType: 'arraybuffer',
                    timeout: 10000,
                    headers: { 'User-Agent': 'Mozilla/5.0' }
                });

                let ext = path.extname(new URL(url).pathname).toLowerCase();
                if (!['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)) {
                    const contentType = response.headers['content-type'] || '';
                    if (contentType.includes('image/png')) ext = '.png';
                    else if (contentType.includes('image/webp')) ext = '.webp';
                    else if (contentType.includes('image/gif')) ext = '.gif';
                    else ext = '.jpg';
                }

                const filename = `media_${i}${ext}`;
                const savePath = path.join(postDir, filename);

                fs.writeFileSync(savePath, response.data);
                relativePaths.push(`media/${postId}/${filename}`);

                const thumbName = `media_${i}_thumb.jpg`;
                await generateImageThumbnail(savePath, path.join(postDir, thumbName));

            } catch (downloadError) {
                console.error(downloadError.message);
            }
        }

        if (relativePaths.length === 0) {
            if (fs.existsSync(postDir)) fs.rmSync(postDir, { recursive: true, force: true });
            return res.status(422).json({ error: 'Failed to download any image from the provided URLs.' });
        }

        const parsedTags = tags ? JSON.parse(tags) : [];
        const parsedCategories = categories ? JSON.parse(categories) : [];
        const createdAt = new Date().toISOString();
        const sourceUrl = urlsArray[0] || '';

        const metadata = {
            id: postId,
            title: title || "",
            source_url: sourceUrl,
            caption: caption || "",
            categories: parsedCategories,
            created_at: createdAt
        };
        fs.writeFileSync(path.join(postDir, 'metadata.json'), JSON.stringify(metadata, null, 2));

        const newGlobalEntry = {
            id: postId,
            title: title || "",
            source_url: sourceUrl,
            caption: caption || "",
            paths: relativePaths,
            tags: parsedTags,
            categories: parsedCategories,
            created_at: createdAt
        };
        appendToGlobalJson(newGlobalEntry);

        res.status(201).json({ success: true, post: newGlobalEntry });
    } catch (error) {
        res.status(500).json({ error: `Internal execution error: ${error.message}` });
    }
});

// 4. File Upload Handler
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (!req.postId) req.postId = generatePostId();
        const postDir = path.join(MEDIA_DIR, req.postId);
        if (!fs.existsSync(postDir)) fs.mkdirSync(postDir, { recursive: true });
        cb(null, postDir);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage });

app.post('/api/posts', upload.array('files'), async (req, res) => {
    try {
        const { title, source_url, caption, tags, categories } = req.body;
        const postId = req.postId;
        const files = req.files;

        if (!files || files.length === 0) {
            return res.status(400).json({ error: 'No media files provided.' });
        }

        const relativePaths = [];
        const postDir = path.join(MEDIA_DIR, postId);

        for (let index = 0; index < files.length; index++) {
            const file = files[index];
            const ext = path.extname(file.originalname);
            const newFilename = `media_${index}${ext}`;
            const oldPath = file.path;
            const newPath = path.join(postDir, newFilename);

            fs.renameSync(oldPath, newPath);
            relativePaths.push(`media/${postId}/${newFilename}`);

            const thumbName = `media_${index}_thumb.jpg`;
            const thumbPath = path.join(postDir, thumbName);

            if (isVideoFile(newPath)) {
                await generateVideoThumbnail(newPath, thumbPath);
            } else {
                await generateImageThumbnail(newPath, thumbPath);
            }
        }

        const parsedTags = tags ? JSON.parse(tags) : [];
        const parsedCategories = categories ? JSON.parse(categories) : [];
        const createdAt = new Date().toISOString();
        const finalSourceUrl = source_url || 'https://google.com';

        const metadata = {
            id: postId,
            title: title || "",
            source_url: finalSourceUrl,
            caption: caption || "",
            categories: parsedCategories,
            created_at: createdAt
        };
        fs.writeFileSync(path.join(postDir, 'metadata.json'), JSON.stringify(metadata, null, 2));

        const newGlobalEntry = {
            id: postId,
            title: title || "",
            source_url: finalSourceUrl,
            caption: caption || "",
            paths: relativePaths,
            tags: parsedTags,
            categories: parsedCategories,
            created_at: createdAt
        };
        appendToGlobalJson(newGlobalEntry);

        res.status(201).json({ success: true, post: newGlobalEntry });
    } catch (error) {
        res.status(500).json({ error: 'Failed to save post.' });
    }
});

// 5. Query and Read routes
app.get('/api/posts', (req, res) => {
    if (!fs.existsSync(GLOBAL_JSON_PATH)) return res.json([]);
    try {
        res.json(JSON.parse(fs.readFileSync(GLOBAL_JSON_PATH, 'utf-8') || '[]'));
    } catch (e) {
        res.json([]);
    }
});

app.get('/api/posts/:id', (req, res) => {
    const postId = req.params.id;
    const metadataPath = path.join(MEDIA_DIR, postId, 'metadata.json');

    if (!fs.existsSync(metadataPath)) return res.status(404).json({ error: 'Post not found' });

    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
    const globalContent = JSON.parse(fs.readFileSync(GLOBAL_JSON_PATH, 'utf-8') || '[]');
    const globalEntry = globalContent.find(p => p.id === postId);

    res.json({
        ...metadata,
        paths: globalEntry ? globalEntry.paths : [],
        tags: globalEntry ? globalEntry.tags : [],
        categories: globalEntry ? (globalEntry.categories || []) : []
    });
});

// 6. Delete routes
app.delete('/api/posts/:id', (req, res) => {
    try {
        const postId = req.params.id;
        const postDir = path.join(MEDIA_DIR, postId);

        if (fs.existsSync(postDir)) {
            fs.rmSync(postDir, { recursive: true, force: true });
        }

        if (fs.existsSync(GLOBAL_JSON_PATH)) {
            let globalData = JSON.parse(fs.readFileSync(GLOBAL_JSON_PATH, 'utf-8') || '[]');
            globalData = globalData.filter(p => p.id !== postId);
            fs.writeFileSync(GLOBAL_JSON_PATH, JSON.stringify(globalData, null, 2));
        }

        res.json({ success: true, message: 'Post deleted successfully.' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete post.' });
    }
});

app.delete('/api/posts/batch', (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ error: 'No post IDs provided for deletion.' });
        }

        let globalData = [];
        if (fs.existsSync(GLOBAL_JSON_PATH)) {
            globalData = JSON.parse(fs.readFileSync(GLOBAL_JSON_PATH, 'utf-8') || '[]');
        }

        ids.forEach(id => {
            const postDir = path.join(MEDIA_DIR, id);
            if (fs.existsSync(postDir)) {
                fs.rmSync(postDir, { recursive: true, force: true });
            }
        });

        const updatedGlobalData = globalData.filter(post => !ids.includes(post.id));
        fs.writeFileSync(GLOBAL_JSON_PATH, JSON.stringify(updatedGlobalData, null, 2));

        res.json({ success: true, message: `Successfully deleted ${ids.length} posts.` });
    } catch (error) {
        res.status(500).json({ error: 'Failed to complete batch deletion.' });
    }
});