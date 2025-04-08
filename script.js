document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const taskForm = document.getElementById('task-form');
    const tasksList = document.getElementById('tasks-list');
    const searchInput = document.getElementById('search-input');
    const filterPriority = document.getElementById('filter-priority');
    const sortBy = document.getElementById('sort-by');
    const modal = document.getElementById('task-modal');
    const closeModal = document.querySelector('.close-modal');
    const editTaskForm = document.getElementById('edit-task-form');

    // State
    let tasks = [];
    let currentFilters = {
        search: '',
        priority: 'all',
        sortBy: 'created'
    };

    // Event Listeners
    taskForm.addEventListener('submit', addTask);
    editTaskForm.addEventListener('submit', updateTask);
    searchInput.addEventListener('input', handleSearch);
    filterPriority.addEventListener('change', handleFilterChange);
    sortBy.addEventListener('change', handleSortChange);
    closeModal.addEventListener('click', () => modal.style.display = 'none');
    window.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
    });

    // Load tasks on page load
    fetchTasks();

    // Functions
    async function fetchTasks() {
        try {
            const response = await fetch('/api/tasks');
            if (!response.ok) {
                throw new Error('Failed to fetch tasks');
            }
            tasks = await response.json();
            renderTasks();
        } catch (error) {
            console.error('Error fetching tasks:', error);
            showNotification('Failed to load tasks', 'error');
        }
    }

    async function addTask(e) {
        e.preventDefault();
        
        const taskData = {
            title: document.getElementById('task-title').value,
            description: document.getElementById('task-description').value,
            priority: document.getElementById('task-priority').value,
            dueDate: document.getElementById('task-due-date').value || null,
            status: 'pending'
        };

        try {
            const response = await fetch('/api/tasks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(taskData)
            });

            if (!response.ok) {
                throw new Error('Failed to add task');
            }

            const newTask = await response.json();
            tasks.push(newTask);
            renderTasks();
            taskForm.reset();
            showNotification('Task added successfully', 'success');
        } catch (error) {
            console.error('Error adding task:', error);
            showNotification('Failed to add task', 'error');
        }
    }

    async function deleteTask(taskId) {
        try {
            const response = await fetch(`/api/tasks/${taskId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Failed to delete task');
            }

            tasks = tasks.filter(task => task.id !== taskId);
            renderTasks();
            showNotification('Task deleted successfully', 'success');
        } catch (error) {
            console.error('Error deleting task:', error);
            showNotification('Failed to delete task', 'error');
        }
    }

    function openEditModal(taskId) {
        const task = tasks.find(task => task.id === taskId);
        if (!task) return;

        document.getElementById('edit-task-id').value = task.id;
        document.getElementById('edit-task-title').value = task.title;
        document.getElementById('edit-task-description').value = task.description;
        document.getElementById('edit-task-priority').value = task.priority;
        document.getElementById('edit-task-status').value = task.status;
        
        if (task.dueDate) {
            document.getElementById('edit-task-due-date').value = new Date(task.dueDate).toISOString().split('T')[0];
        } else {
            document.getElementById('edit-task-due-date').value = '';
        }

        modal.style.display = 'block';
    }

    async function updateTask(e) {
        e.preventDefault();
        
        const taskId = document.getElementById('edit-task-id').value;
        const updatedTaskData = {
            title: document.getElementById('edit-task-title').value,
            description: document.getElementById('edit-task-description').value,
            priority: document.getElementById('edit-task-priority').value,
            dueDate: document.getElementById('edit-task-due-date').value || null,
            status: document.getElementById('edit-task-status').value
        };

        try {
            const response = await fetch(`/api/tasks/${taskId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedTaskData)
            });

            if (!response.ok) {
                throw new Error('Failed to update task');
            }

            const updatedTask = await response.json();
            tasks = tasks.map(task => task.id === taskId ? updatedTask : task);
            renderTasks();
            modal.style.display = 'none';
            showNotification('Task updated successfully', 'success');
        } catch (error) {
            console.error('Error updating task:', error);
            showNotification('Failed to update task', 'error');
        }
    }

    async function toggleTaskCompletion(taskId) {
        const task = tasks.find(task => task.id === taskId);
        if (!task) return;

        const newStatus = task.status === 'completed' ? 'pending' : 'completed';
        
        try {
            const response = await fetch(`/api/tasks/${taskId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ ...task, status: newStatus })
            });

            if (!response.ok) {
                throw new Error('Failed to update task status');
            }

            const updatedTask = await response.json();
            tasks = tasks.map(task => task.id === taskId ? updatedTask : task);
            renderTasks();
            showNotification(`Task marked as ${newStatus}`, 'success');
        } catch (error) {
            console.error('Error updating task status:', error);
            showNotification('Failed to update task status', 'error');
        }
    }

    function handleSearch(e) {
        currentFilters.search = e.target.value.toLowerCase();
        renderTasks();
    }

    function handleFilterChange(e) {
        currentFilters.priority = e.target.value;
        renderTasks();
    }

    function handleSortChange(e) {
        currentFilters.sortBy = e.target.value;
        renderTasks();
    }

    function renderTasks() {
        // Filter tasks
        let filteredTasks = tasks.filter(task => {
            // Search filter
            const matchesSearch = task.title.toLowerCase().includes(currentFilters.search) || 
                                task.description.toLowerCase().includes(currentFilters.search);
            
            // Priority filter
            const matchesPriority = currentFilters.priority === 'all' || task.priority === currentFilters.priority;
            
            return matchesSearch && matchesPriority;
        });

        // Sort tasks
        filteredTasks.sort((a, b) => {
            switch (currentFilters.sortBy) {
                case 'due':
                    if (!a.dueDate) return 1;
                    if (!b.dueDate) return -1;
                    return new Date(a.dueDate) - new Date(b.dueDate);
                case 'priority':
                    const priorityOrder = { 'high': 1, 'medium': 2, 'low': 3 };
                    return priorityOrder[a.priority] - priorityOrder[b.priority];
                default: // created
                    return new Date(b.createdAt) - new Date(a.createdAt);
            }
        });

        // Render to DOM
        tasksList.innerHTML = '';
        
        if (filteredTasks.length === 0) {
            tasksList.innerHTML = '<p class="no-tasks">No tasks found. Add a new task or change filters.</p>';
            return;
        }

        filteredTasks.forEach(task => {
            const taskElement = document.createElement('div');
            taskElement.className = `task-item ${task.priority}-priority ${task.status === 'completed' ? 'completed' : ''}`;
            
            const formattedDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date';
            const createdDate = new Date(task.createdAt).toLocaleDateString();

            taskElement.innerHTML = `
                <div class="task-header">
                    <h3 class="task-title">${task.title}</h3>
                    <div class="task-actions">
                        <button class="complete-btn" data-id="${task.id}">
                            ${task.status === 'completed' ? 'Undo' : 'Complete'}
                        </button>
                        <button class="edit-btn" data-id="${task.id}">Edit</button>
                        <button class="delete-btn" data-id="${task.id}">Delete</button>
                    </div>
                </div>
                <p class="task-description">${task.description}</p>
                <div class="task-meta">
                    <span>Due: ${formattedDate}</span>
                    <span class="task-status status-${task.status}">${capitalizeFirstLetter(task.status)}</span>
                    <span>Created: ${createdDate}</span>
                </div>
            `;

            tasksList.appendChild(taskElement);

            // Add event listeners to buttons
            taskElement.querySelector('.delete-btn').addEventListener('click', () => deleteTask(task.id));
            taskElement.querySelector('.edit-btn').addEventListener('click', () => openEditModal(task.id));
            taskElement.querySelector('.complete-btn').addEventListener('click', () => toggleTaskCompletion(task.id));
        });
    }

    function showNotification(message, type = 'info') {
        // Simple alert for now, could be replaced with a custom notification component
        alert(message);
    }

    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
});
