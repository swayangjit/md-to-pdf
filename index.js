const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const chromium = require('chrome-aws-lambda'); // ✅ serverless chromium
const cors = require('cors');
const markdownIt = require('markdown-it');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3003;

// Supabase init
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(cors());

// Health Check
app.get('/', (req, res) => {
    res.send('✅ Markdown to PDF Converter API is running.');
});

// Main Route
app.post('/generatePdf', async (req, res) => {
    const { markdown } = req.body;

    if (!markdown) {
        return res.status(400).json({ error: 'Markdown content is required' });
    }

    // Markdown to HTML
    const md = new markdownIt({ html: true, linkify: true, typographer: true });
    const htmlContent = md.render(markdown);

    // HTML Template with styling
    const headerHTML = `
        <div style="text-align: center; margin-bottom: 20px;">
            <img src="https://tkhqppfqsitovjvsstfl.supabase.co/storage/v1/object/public/assets/netskillLogo.png" alt="Header Image" width="300" height="50" />
        </div>
        <hr/>
    `;

    const fullHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="utf-8">
        <title>Markdown PDF</title>
        <style>
            body {
                font-family: 'Arial', sans-serif;
                padding: 40px;
                color: #333;
                line-height: 1.6;
                max-width: 800px;
                margin: auto;
            }
            h1, h2, h3, h4 {
                color: #222;
            }
            img {
                max-width: 100%;
            }
            ul {
                padding-left: 20px;
            }
            li {
                margin-bottom: 5px;
            }
            hr {
                border: none;
                border-top: 2px solid #eee;
                margin: 20px 0;
            }
            a {
                color: #1a73e8;
                text-decoration: none;
            }
            a:hover {
                text-decoration: underline;
            }
        </style>
    </head>
    <body>
        ${headerHTML}
        ${htmlContent}
    </body>
    </html>
    `;

    try {
        // Launch puppeteer using chrome-aws-lambda
        const browser = await chromium.puppeteer.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath,
            headless: chromium.headless,
        });

        const page = await browser.newPage();

        await page.setContent(fullHtml, { waitUntil: 'networkidle0' });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '40px',
                bottom: '40px',
            },
        });

        await browser.close();

        // Upload to Supabase
        const bucketName = 'avatars';
        const fileName = `output-${Date.now()}.pdf`;

        const { data, error } = await supabase.storage
            .from(bucketName)
            .upload(fileName, pdfBuffer, {
                cacheControl: '3600',
                upsert: false,
                contentType: 'application/pdf',
            });

        if (error) throw error;

        const { data: publicUrlData } = supabase.storage
            .from(bucketName)
            .getPublicUrl(fileName);

        res.status(200).json({
            message: '✅ PDF uploaded successfully',
            url: publicUrlData.publicUrl,
        });
    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).json({ error: error.message || 'Failed to generate PDF' });
    }
});

// Start server
app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
});
