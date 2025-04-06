// index.js
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { mdToPdf } = require('md-to-pdf');
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
   
    const headerHtml = `<p align="center">
  <img src="https://tkhqppfqsitovjvsstfl.supabase.co/storage/v1/object/public/assets/netskillLogo.png" alt="Header Image" width="300" height="50"/>
<hr style="border: none; height: .5px; background-color: #ccc; <br>" />

`;
    if (!markdown) {
        return res.status(400).json({ error: 'MD content is required' });
    }

    try {
        const pdf = await mdToPdf({ content: headerHtml + markdown });

        // Upload to Supabase
        const bucketName = 'avatars';
        const fileName = `output-${Date.now()}.pdf`;

        const { data, error } = await supabase.storage
            .from(bucketName)
            .upload(`${fileName}`, pdf.content, {
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

app.post('/convert', async (req, res) => {
    const { markdown } = req.body;
   
    const headerHtml = `<p align="center">
  <img src="https://tkhqppfqsitovjvsstfl.supabase.co/storage/v1/object/public/assets/netskillLogo.png" alt="Header Image" width="300" height="50"/>
<hr style="border: none; height: .5px; background-color: #ccc; <br>" />

`;
    if (!markdown) {
        return res.status(400).json({ error: 'MD content is required' });
    }

    try {
        const pdf = await mdToPdf({ content: headerHtml + markdown });

        // Upload to Supabase
        const bucketName = 'avatars';
        const fileName = `output-${Date.now()}.pdf`;

        const { data, error } = await supabase.storage
            .from(bucketName)
            .upload(`${fileName}`, pdf.content, {
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
