const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const app = express();
const port = 3123;

app.use(bodyParser.json());

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    // Placeholder for user authentication logic
    if (username === 'test' && password === 'password') {
        res.status(200).send('Login successful');
    } else {
        res.status(401).send('Invalid credentials');
    }
});

app.post('/register', (req, res) => {
    const { nome, data_nascimento, telefone, genero, escala, grau } = req.body;
    // Placeholder for user registration logic
    if (nome && data_nascimento && telefone && genero && escala && grau) {
        // Logic to save user data
        res.status(201).send('User registered successfully');
    } else {
        res.status(400).send('All fields are required');
    }
});

app.get('/lanches', (req, res) => {
    fs.readFile('lanches.json', (err, data) => {
        if (err) {
            return res.status(500).send('Error reading file');
        }
        res.json(JSON.parse(data));
    });
});

app.post('/lanches', (req, res) => {
    const newLanche = req.body;
    fs.readFile('lanches.json', (err, data) => {
        if (err) {
            return res.status(500).send('Error reading file');
        }
        const lanches = data ? JSON.parse(data) : [];
        lanches.push(newLanche);
        fs.writeFile('lanches.json', JSON.stringify(lanches, null, 2), (err) => {
            if (err) {
                return res.status(500).send('Error saving file');
            }
            res.status(200).send('Lanche added successfully');
        });
    });
});

app.listen(port, () => {
    console.log(`Backend listening at http://localhost:${port}`);
    console.log('API is ready to handle requests.');
});
