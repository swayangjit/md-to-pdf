// index.js
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const puppeteer = require('puppeteer-core');
const marked = require('marked');
const chromium = require('@sparticuz/chromium')
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3003;

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);


// Middleware to parse JSON
app.use(express.json());

app.post('/generatePdf', async (req, res) => {
    const { markdown } = req.body;
    const htmlContent = marked.parse(markdown);
    const html1 = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>PDF Template</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter&display=swap" rel="stylesheet">
    <style>
    @page {
            size: A4;
            margin-top: 10mm;
            margin-bottom: 20mm;
            margin-left: 10mm;
            margin-right: 10mm;
        }
    body  {
        margin: 0;
        padding: 2rem;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        line-height: 1.7;
        background-color: #ffffff;
        color: #333;
        font-size: 16px;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
    }
         h1, h2, h3, h4, h5, h6 {
      font-weight: 600;
      margin-top: 1.5em;
      margin-bottom: 0.5em;
    }

    /* Paragraphs */
    p {
      margin: 1em 0;
    }
        .header {
            text-align: center;
            padding: 10px 0;
            border-bottom: 1px solid #000;
        }
        .header img {
            max-width: 150px;
        }
        .content {
            margin-top: 20px;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="header">
        <img src="https://tkhqppfqsitovjvsstfl.supabase.co/storage/v1/object/public/assets/netskillLogo.png" alt="Company Logo">
    </div>
    <div class="content">
        ${htmlContent}
</body>
</html>
`
    console.log('Formatted HTML', html1);
    if (!markdown) {
        return res.status(400).json({ error: 'MD content is required' });
    }

    try {
        // const browser = await puppeteer.launch();
        browser = await puppeteer.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(),
            headless: chromium.headless,
            ignoreHTTPSErrors: true,
        });
        const page = await browser.newPage();
        await page.setContent(html1, { waitUntil: 'load' });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '10mm', bottom: '20mm', left: '1mm', right: '1mm' }
        });

        await browser.close();

        // Upload to Supabase
        const bucketName = 'avatars';
        const fileName = `output-${Date.now()}.pdf`;

        const { data, error } = await supabase.storage
            .from(bucketName)
            .upload(`${fileName}`, pdfBuffer, {
                cacheControl: '3600',
                upsert: false,
                contentType: 'application/pdf',
            });

        if (error) throw error;

        // Get the public URL
        const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(fileName);
        res.status(200).json({
            message: 'PDF uploaded successfully',
            url: publicUrlData.publicUrl,
        });
    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).json({ error: 'Failed to generate PDF' });
    }
});

app.get('/', (req, res) => {
    res.send('Markdown to PDF Converter API');
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

// vercel.json
// {
//   "builds": [
//     { "src": "index.js", "use": "@vercel/node" }
//   ]
// }
