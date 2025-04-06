const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { mdToPdf } = require('md-to-pdf');
const puppeteer = require('puppeteer'); // ✅ Replaced chrome-aws-lambda
const cors = require('cors');
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

    const headerMarkdown = `
<p align="center">
<img src="https://tkhqppfqsitovjvsstfl.supabase.co/storage/v1/object/public/assets/netskillLogo.png" alt="Header Image" width="300" height="50"/>
</p>

---

`;

    try {
        const browser = await puppeteer.launch({
            headless: 'new', // ✅ New Puppeteer mode
            args: ['--no-sandbox', '--disable-setuid-sandbox'], // ✅ Required for Vercel
        });

        const pdf = await mdToPdf(
            { content: headerMarkdown + markdown },
            {
                launchOptions: {
                    executablePath: browser.executablePath(),
                    args: ['--no-sandbox', '--disable-setuid-sandbox'],
                    headless: 'new',
                },
            }
        );

        await browser.close();

        if (!pdf || !pdf.content) {
            throw new Error('PDF generation failed');
        }

        // Upload to Supabase
        const bucketName = 'avatars';
        const fileName = `output-${Date.now()}.pdf`;

        const { data, error } = await supabase.storage
            .from(bucketName)
            .upload(fileName, pdf.content, {
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
