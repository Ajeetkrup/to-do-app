const express = require('express');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware - strict CSP for production
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles
            scriptSrc: ["'self'"], // Only allow scripts from same origin
            objectSrc: ["'none'"],
            upgradeInsecureRequests: [],
        },
    },
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(__dirname, 'views')));

// In-memory todo storage (production mein database use karenge)
let todos = [
    { id: 1, task: 'Learn DevSecOps', completed: false },
    { id: 2, task: 'Setup Jenkins Pipeline', completed: false }
];

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/api/todos', (req, res) => {
    res.json(todos);
});

app.post('/api/todos', (req, res) => {
    const { task } = req.body;
    if (!task || task.trim() === '') {
        return res.status(400).json({ error: 'Task is required' });
    }
    
    const newTodo = {
        id: todos.length + 1,
        task: task.trim(),
        completed: false
    };
    
    todos.push(newTodo);
    res.status(201).json(newTodo);
});

app.delete('/api/todos/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const todoIndex = todos.findIndex(todo => todo.id === id);
    
    if (todoIndex === -1) {
        return res.status(404).json({ error: 'Todo not found' });
    }
    
    todos.splice(todoIndex, 1);
    res.status(204).send();
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = { app, server };