const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// Middleware to parse JSON in requests
app.use(express.json());

// Serve static files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname)));

// In-memory task storage
let tasks = [];

// API to get all tasks
app.get('/api/tasks', (req, res) => {
    res.json(tasks);
});

// API to add a task
app.post('/api/tasks', (req, res) => {
    const newTask = {
        id: Date.now().toString(),
        ...req.body,
        createdAt: new Date()
    };
    tasks.push(newTask);
    res.status(201).json(newTask);
});

// Start the server
app.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
});
