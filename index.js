
const express = require('express');
const shortid = require('shortid');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;
const databaseFilePath = path.join(__dirname, 'shortlinks.json');

app.use(express.json());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

const DOMAIN = 'pnblk.my.id';
app.get('/', (req, res) => {
    res.render('index');
});

const readDataFromFile = () => {
    try {
        const data = fs.readFileSync(databaseFilePath);
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
};


const writeDataToFile = (data) => {
    fs.writeFileSync(databaseFilePath, JSON.stringify(data, null, 2));
};

app.get('/total', (req, res) => {
    const data = readDataFromFile();
    res.json({ totalLinks: data.length });
});

app.post('/shorten', (req, res) => {
    const { url, custom } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'Original URL is required' });
    }

    const data = readDataFromFile();
    const existingLink = data.find(link => link.shortUrl === custom || link.url === url);

    if (existingLink && !custom) {
        return res.json({ shortUrl: `${DOMAIN}/${existingLink.shortUrl}` });
    }

    if (custom && data.find(link => link.shortUrl === custom)) {
        return res.status(400).json({ error: 'Custom alias already exists' });
    }

    const shortUrl = custom || shortid.generate();
    const newLink = { url, shortUrl, createdAt: new Date().toISOString() };

    data.push(newLink);
    writeDataToFile(data);

    res.json({ shortUrl: `${DOMAIN}/${shortUrl}` });
});


app.get('/:shortUrl', (req, res) => {
    const { shortUrl } = req.params;
    const data = readDataFromFile();

    const link = data.find(link => link.shortUrl === shortUrl);

    if (!link) {
        return res.status(404).json({ error: 'Shortlink not found' });
    }
    res.redirect(link.url);
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

module.exports = app;