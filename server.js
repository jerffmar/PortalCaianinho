const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const membersFile = path.join(__dirname, 'members.json');

// Middleware to parse JSON requests
app.use(express.json());

// Endpoint to save member information
app.post('/save-member', (req, res) => {
    const newMember = req.body;

    // Validate incoming member data
    const { nome, data_nascimento, telefone, genero, escala, grau } = newMember;
    if (!nome || !data_nascimento || !telefone || !genero || !escala || !grau) {
        return res.status(400).send('All fields are required');
    }

    fs.readFile(membersFile, 'utf8', (err, data) => {
        if (err && err.code !== 'ENOENT') {
            console.error('Error reading file:', err);
            return res.status(500).send('Server error.');
        }

        const members = data ? JSON.parse(data) : [];
        members.push(newMember);

        fs.writeFile(membersFile, JSON.stringify(members, null, 2), (err) => {
            if (err) {
                console.error('Error saving file:', err);
                return res.status(500).send('Server error.');
            }

            res.status(201).send('User registered successfully.');
        });
    });
});

// Serve static files
app.use(express.static(__dirname));

// Start the server
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
