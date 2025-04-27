const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
const markdownIt = require('markdown-it');
// const puppeteer = require('puppeteer');
const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium')
const axios = require('axios');
const PDFMerger = require('pdf-merger-js');

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
    const { markdown, logo = '' } = req.body;
    if (!markdown) {
        return res.status(400).json({ error: 'Markdown content is required' });
    }

    // Markdown to HTML
    const md = new markdownIt({ html: true, linkify: true, typographer: true });
    const htmlContent = md.render(markdown);

    // HTML Template with styling
    const headerHTML = `
        <div style="text-align: center; margin-bottom: 20px;">
            <img src=${logo} alt="Header Image" width="300" height="60" />
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
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans&family=Noto+Color+Emoji&display=swap');

        body {
            font-family: 'Noto Sans', 'Noto Color Emoji', sans-serif;
            margin: 40px;
            line-height: 1.6;
            color: #333;
        }

        h1, h2, h3 {
            color: #111;
        }

        img {
            max-width: 100%;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }

        table, th, td {
            border: 1px solid #ccc;
        }

        th, td {
            padding: 8px 12px;
            text-align: left;
        }

        p, li {
            font-size: 14px;
        }

        hr {
            margin: 20px 0;
            border: none;
            border-top: 1px solid #eee;
        }

        /* Ensure consistent margins across pages */
        @page {
            margin: 40px;
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
        // const browser = await puppeteer.launch({
        //     args: [
        //         ...chromium.args,
        //         '--font-render-hinting=medium',
        //         '--disable-skia-runtime-opts',
        //         '--disable-font-subpixel-positioning',
        //     ],
        //     defaultViewport: chromium.defaultViewport,
        //     executablePath: await chromium.executablePath(),
        //     headless: chromium.headless,
        //     ignoreHTTPSErrors: true,
        // });
        const browser = await puppeteer.launch({
            headless: true,
            landscape: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--font-render-hinting=medium',
                '--disable-skia-runtime-opts',
                '--disable-font-subpixel-positioning',
            ],
            ignoreHTTPSErrors: true,
        });

        const page = await browser.newPage();
        const newHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Requirements Summary</title>
  <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;800&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body {
      font-family: 'Manrope', sans-serif;
      background-image: url('https://tkhqppfqsitovjvsstfl.supabase.co/storage/v1/object/public/avatars//bg_image_1.png'), linear-gradient(to bottom right, #0F0C29, #302B63, #24243E);
      background-size: cover;
      background-position: center;
      background-attachment: fixed;
      background-repeat: no-repeat;
    }
    .card {
  position: relative;
  overflow: hidden;
  border-radius: 48px;
  border: 8px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
  transition: transform 0.2s, background 0.2s;
  width: 100%;
  max-width: 450px;
  text-align: center;
  background: rgba(255, 255, 255, 0.15); /* Soft semi-transparent */
}

.card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('https://tkhqppfqsitovjvsstfl.supabase.co/storage/v1/object/public/avatars//bg_image_1.png'),
              linear-gradient(to bottom right, #0F0C29, #302B63, #24243E);
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  filter: blur(20px);
  z-index: -1;
}
    .card:hover {
      transform: scale(1.05);
      background: rgba(255, 255, 255, 0.15);
    }
    .card img {
      height: 150px;
      width: auto;
      object-fit: contain;
      margin-bottom: 8px;
    }
    .card h2 {
      font-size: 2.5rem;
      margin-top: 16px;
      margin-bottom: 24px;
    }
  </style>
</head>
<body class="text-white min-h-screen flex flex-col items-center justify-center p-20 relative">
  <!-- Top-right logo -->
  <div class="absolute top-6 right-6 z-50">
    <img src="https://tkhqppfqsitovjvsstfl.supabase.co/storage/v1/object/public/avatars//sansovi_logo.png" alt="Sansovi Logo" class="h-[70px] object-contain">
</div>
  <h1 class="text-6xl font-extrabold mt-6 mb-20 text-center  leading-tight">
    Here's what we understood about your requirements:
  </h1>
  <div class="flex flex-col items-center w-full space-y-16">
    <!-- First Row: 4 cards -->
    <div class="flex justify-center flex-wrap gap-x-16 gap-y-8 w-full">
     <div class="card p-12 flex flex-col items-center gap-6">
        <img src="https://tkhqppfqsitovjvsstfl.supabase.co/storage/v1/object/public/avatars//location.png" alt="Location Icon"/>
        <h2 class="text-5xl font-bold mt-10">Hyderabad</h2>
        <p class="text-3xl text-gray-300">Preferred Location</p>
      </div>
        <div class="card p-12 flex flex-col items-center gap-6">
        <img src="https://tkhqppfqsitovjvsstfl.supabase.co/storage/v1/object/public/avatars//headcount.png" alt="Headcount Icon"/>
        <h2 class="text-5xl font-bold mt-10">100 FTEs</h2>
        <p class="text-3xl text-gray-300">Total Headcount</p>
      </div>
       <div class="card p-12 flex flex-col items-center gap-6">
        <img src="https://tkhqppfqsitovjvsstfl.supabase.co/storage/v1/object/public/avatars//workspace.png" alt="Workspace Icon"/>
        <h2 class="text-5xl font-bold mt-10">Standard</h2>
        <p class="text-3xl text-gray-300">Workspace Preference</p>
      </div>
       <div class="card p-12 flex flex-col items-center gap-6">
        <img src="https://tkhqppfqsitovjvsstfl.supabase.co/storage/v1/object/public/avatars//gcc_model.png" alt="GCC Model Icon"/>
        <h2 class="text-5xl font-bold mt-10">EOR</h2>
        <p class="text-3xl text-gray-300">GCC Model</p>
      </div>
    </div>
    <!-- Second Row: 3 cards -->
    <div class="flex justify-center flex-wrap gap-x-16 gap-y-8 w-full">
      <div class="card p-12 flex flex-col items-center gap-6">
        <img src="https://tkhqppfqsitovjvsstfl.supabase.co/storage/v1/object/public/avatars//talen_mix.png" alt="Talent Mix Icon"/>
        <h2 class="text-5xl font-bold mt-10">Mixed</h2>
        <p class="text-3xl text-gray-300">Talent Mix</p>
      </div>
       <div class="card p-12 flex flex-col items-center gap-6">
        <img src="https://tkhqppfqsitovjvsstfl.supabase.co/storage/v1/object/public/avatars//facilities.png" alt="Facilities Icon"/>
        <h2 class="text-5xl font-bold mt-10">F&amp;B &amp; Internet</h2>
        <p class="text-3xl text-gray-300">Facilities Needed</p>
      </div>
       <div class="card p-12 flex flex-col items-center gap-6">
        <img src="https://tkhqppfqsitovjvsstfl.supabase.co/storage/v1/object/public/avatars//shift.png" alt="Work Shift Icon"/>
        <h2 class="text-5xl font-bold mt-10">Double</h2>
        <p class="text-3xl text-gray-300">Work Shift</p>
      </div>
    </div>
  </div>
  <p class="text-gray-300 text-4xl mt-20 text-center max-w-[85rem]">
    These inputs helped us run thousands of simulations using benchmark data, real estate costs, salary averages, and Sansovi's operating models.
  </p>
</body>
</html>`

        await page.setContent(newHtml, { waitUntil: 'networkidle0' });
        await page.setViewport({
            width: 1920,
            height: 1080
        });
        const pdfBuffer = await page.pdf({
            landscape: true,     // Landscape mode
            printBackground: true, // Include background colors
            height: '26.67in',
            width: '15in',
            margin: { top: '0cm', right: '0cm', bottom: '0cm', left: '0cm' }
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

app.post('/generatePdfFromHtml', async (req, res) => {
    const { html } = req.body;
    if (!html) {
        return res.status(400).json({ error: 'Html content is required' });
    }

    try {
        // Launch puppeteer using chrome-aws-lambda
        const browser = await puppeteer.launch({
            args: [
                ...chromium.args,
                '--font-render-hinting=medium',
                '--disable-skia-runtime-opts',
                '--disable-font-subpixel-positioning',
            ],
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(),
            headless: chromium.headless,
            ignoreHTTPSErrors: true,
        });

        // const browser = await puppeteer.launch({
        //     headless: true,
        //     landscape: true,
        //     args: [
        //         '--no-sandbox',
        //         '--disable-setuid-sandbox',
        //         '--font-render-hinting=medium',
        //         '--disable-skia-runtime-opts',
        //         '--disable-font-subpixel-positioning',
        //     ],
        //     ignoreHTTPSErrors: true,
        // });

        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });
        await page.setViewport({
            width: 1920,
            height: 1080
        });
        const pdfBuffer = await page.pdf({
            landscape: true,     // Landscape mode
            printBackground: true, // Include background colors
            height: '26.67in',
            width: '15in',
            margin: { top: '0cm', right: '0cm', bottom: '0cm', left: '0cm' }
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

async function fetchPdfBytes(url) {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    return response.data;
}

app.post('/generateAndMergePdfParts', async (req, res) => {
    const { pdfParts } = req.body;
    if (!pdfParts) {
        return res.status(400).json({ error: 'pdfParts is required' });
    }

    try {
        const browser = await puppeteer.launch({
            headless: true,
            landscape: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--font-render-hinting=medium',
                '--disable-skia-runtime-opts',
                '--disable-font-subpixel-positioning',
            ],
            ignoreHTTPSErrors: true,
        });

        const merger = new PDFMerger();

        for (const [index, part] of pdfParts.entries()) {
            console.log(`Staring part ${index}`);
            let buffer;
            if (part.url) {
                buffer = await fetchPdfBytes(part.url);
                console.log(`is Object type ${buffer instanceof Uint8Array}`);
            } else {
                const page = await browser.newPage();
                await page.setContent(part.template, { waitUntil: 'networkidle0', timeout: 60000 });
                await page.setViewport({
                    width: 1920,
                    height: 1080
                });
                const pdfBuffer = await page.pdf({
                    landscape: true,     // Landscape mode
                    printBackground: true, // Include background colors
                    height: '26.67in',
                    width: '15in',
                    margin: { top: '0cm', right: '0cm', bottom: '0cm', left: '0cm' }
                });
                await page.close();
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

                console.log(`Uploaded Url ${publicUrlData.publicUrl}`);
                buffer = await fetchPdfBytes(publicUrlData.publicUrl);
                await merger.add(buffer);
            }
            await merger.add(buffer);
        }

        const mergedPdfBytes = await merger.saveAsBuffer();

        // Upload to Supabase
        const bucketName = 'avatars';
        const fileName = `output-${Date.now()}.pdf`;

        const { data, error } = await supabase.storage
            .from(bucketName)
            .upload(fileName, mergedPdfBytes, {
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
