// Client-side JavaScript for Todo App
document.addEventListener('DOMContentLoaded', function() {
    const addTaskBtn = document.getElementById('add-task-btn');
    const taskInput = document.getElementById('taskInput');
    
    // Event listeners
    addTaskBtn.addEventListener('click', addTodo);
    taskInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addTodo();
        }
    });
    
    let todos = [];
    
    async function loadTodos() {
        try {
            const response = await fetch('/api/todos');
            todos = await response.json();
            renderTodos();
        } catch (error) {
            console.error('Error loading todos:', error);
        }
    }
    
    async function addTodo() {
        const task = taskInput.value.trim();
        if (!task) return;
        
        try {
            const response = await fetch('/api/todos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ task })
            });
            
            if (response.ok) {
                taskInput.value = '';
                loadTodos();
            }
        } catch (error) {
            console.error('Error adding todo:', error);
        }
    }
    
    async function deleteTodo(id) {
        try {
            const response = await fetch(`/api/todos/${id}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                loadTodos();
            }
        } catch (error) {
            console.error('Error deleting todo:', error);
        }
    }
    
    function renderTodos() {
        const todoList = document.getElementById('todoList');
        todoList.innerHTML = todos.map(todo => `
            <div class="todo-item">
                <span>${escapeHtml(todo.task)}</span>
                <button class="delete-btn" data-id="${todo.id}">Delete</button>
            </div>
        `).join('');
        
        // Add event listeners to delete buttons
        todoList.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = parseInt(this.dataset.id);
                deleteTodo(id);
            });
        });
    }
    
    // XSS protection - escape HTML
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Load todos on page load
    loadTodos();
});