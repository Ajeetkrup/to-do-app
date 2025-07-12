const request = require('supertest');
const { app, server } = require('../src/app');

describe('Todo App', () => {
    afterAll(() => {
        server.close();
    });

    test('GET / should return HTML page', async () => {
        const response = await request(app).get('/');
        expect(response.status).toBe(200);
        expect(response.type).toBe('text/html');
    });

    test('GET /api/todos should return todos', async () => {
        const response = await request(app).get('/api/todos');
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
    });

    test('POST /api/todos should create new todo', async () => {
        const newTodo = { task: 'Test task' };
        const response = await request(app)
            .post('/api/todos')
            .send(newTodo);
        
        expect(response.status).toBe(201);
        expect(response.body.task).toBe('Test task');
    });

    test('POST /api/todos should reject empty task', async () => {
        const response = await request(app)
            .post('/api/todos')
            .send({ task: '' });
        
        expect(response.status).toBe(400);
    });

    test('GET /health should return health status', async () => {
        const response = await request(app).get('/health');
        expect(response.status).toBe(200);
        expect(response.body.status).toBe('OK');
    });
});
