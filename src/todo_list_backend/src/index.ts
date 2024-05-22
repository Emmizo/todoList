import { v4 as uuidv4 } from 'uuid';
import { StableBTreeMap, ic, nat64 } from 'azle';
import express from 'express';

// Define the structure of a Todo item
class TodoItem {
    id: string;
    title: string;
    description: string;
    completed: boolean;
    createdAt: Date;
    updatedAt: Date | null;

    constructor(id: string, title: string, description: string, completed: boolean, createdAt: Date, updatedAt: Date | null) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.completed = completed;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}

// Initialize storage for Todo items using a StableBTreeMap
const todoItemsStorage =  StableBTreeMap<string, TodoItem>(0);

// Function to get the current date using Azle's time function
function getCurrentDate(): Date {
    const timestamp = ic.time() as nat64;
    return new Date(Number(timestamp) / 1000000);
}

// Create a new Todo item
export function addTodo(
    title: string,
    description: string
): void {
    const id = uuidv4();
    const newTodo = new TodoItem(
        id,
        title,
        description,
        false,
        getCurrentDate(),
        null
    );
    todoItemsStorage.insert(id, newTodo);
}

// Update an existing Todo item
export function updateTodo(
    id: string,
    title?: string,
    description?: string,
    completed?: boolean
): void {
    const todoOpt = todoItemsStorage.get(id);

    if (todoOpt && 'Some' in todoOpt) {
        const todo = todoOpt.Some;
        if (todo) {
            const updatedTodo = new TodoItem(
                todo.id,
                title ?? todo.title,
                description ?? todo.description,
                completed ?? todo.completed,
                todo.createdAt,
                getCurrentDate()
            );
            todoItemsStorage.insert(id, updatedTodo);
        } else {
            console.error(`Todo item with id=${id} not found.`);
        }
    } else {
        console.error(`Todo item with id=${id} not found.`);
    }
}

// Get a specific Todo item by ID
export function getTodo(
    id: string
): TodoItem | null {
    const todoOpt = todoItemsStorage.get(id);
    if (todoOpt && 'Some' in todoOpt) {
        return todoOpt.Some ? todoOpt.Some : null;
    } else {
        return null;
    }
}

// Get all Todo items
export function getTodos(): TodoItem[] {
    return todoItemsStorage.values();
}

// Delete a Todo item by ID
export function deleteTodo(
    id: string
): void {
    todoItemsStorage.remove(id);
}

// Express app setup
const app = express();
app.use(express.json());

// Express routes for CRUD operations on todo items
app.post("/todos", (req, res) => {
    const { title, description } = req.body;
    addTodo(title, description);
    res.status(201).send("Todo created successfully.");
});

app.get("/todos", (req, res) => {
    res.json(getTodos());
});

app.get("/todos/:id", (req, res) => {
    const { id } = req.params;
    const todo = getTodo(id);
    if (todo) {
        res.json(todo);
    } else {
        res.status(404).send("Todo not found.");
    }
});

app.put("/todos/:id", (req, res) => {
    const { id } = req.params;
    const { title, description, completed } = req.body;
    updateTodo(id, title, description, completed);
    res.send("Todo updated successfully.");
});

app.delete("/todos/:id", (req, res) => {
    const { id } = req.params;
    deleteTodo(id);
    res.send("Todo deleted successfully.");
});

export default app; // Export the Express app for use in server setup
