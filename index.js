const express = require('express');
const axios = require('axios'); // Use axios for external requests if necessary
const ytdl = require('ytdl-core');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Route to handle URL input and fetch quality options
const youtubedl = require('youtube-dl-exec');

app.post('/download', async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    try {
        const result = await youtubedl(url, {
            dumpSingleJson: true,
            noWarnings: true,
            format: "bestvideo+bestaudio/best"
        });

        console.log("Raw result:", JSON.stringify(result, null, 2));

        // Inspect formats
        console.log("Raw formats:", result.formats);

        // Filter formats based on available video/audio and URL
        const formats = result.formats.filter(format => format.url && format.vcodec !== "none" && format.acodec !== "none");
        console.log("Filtered formats:", formats);
        const uniqueFormats = [];
        const seenQualities = new Set();

        formats.forEach(format => {
            const qualityKey = `${format.height || "unknown"}-${format.acodec}-${format.vcodec}`; // Use a combination of fields
            if (!seenQualities.has(qualityKey)) {
                seenQualities.add(qualityKey);
                uniqueFormats.push(format);
            }
        });
        // Map to download options
        const downloadOptions = formats.map(format => ({
            quality: format.format_note || format.height || "unknown",
            format: format.format_id,
            url: format.url
        }));

        console.log("Download options:", downloadOptions);

        return res.json(downloadOptions);
    } catch (error) {
        console.error('Error fetching video info:', error);
        return res.status(500).json({ error: 'Something went wrong while processing the URL.' });
    }
});




// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
