const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const markdownIt = require('markdown-it');
const playwright = require('playwright');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3003;

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

app.use(express.json());

async function generatePdf(markdownContent) {
    const md = new markdownIt();
    const headerHtml = `<p align="center">
        <img src="https://tkhqppfqsitovjvsstfl.supabase.co/storage/v1/object/public/assets/netskillLogo.png" alt="Header Image" width="300" height="50"/>
        <hr style="border: none; height: .5px; background-color: #ccc;" />
    </p>`;

    const fullHtml = `
        <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    img { margin-bottom: 20px; }
                </style>
            </head>
            <body>
                ${headerHtml}
                ${md.render(markdownContent)}
            </body>
        </html>
    `;

    const browser = await playwright.chromium.launch();
    const page = await browser.newPage();
    await page.setContent(fullHtml, { waitUntil: 'domcontentloaded' });

    const pdfBuffer = await page.pdf({ format: 'A4' });
    await browser.close();

    return pdfBuffer;
}

app.post(['/generatePdf', '/convert'], async (req, res) => {
    const { markdown } = req.body;

    if (!markdown) {
        return res.status(400).json({ error: 'MD content is required' });
    }

    try {
        const pdfBuffer = await generatePdf(markdown);
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
