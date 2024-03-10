const http = require("http");
const { v4: uuidv4 } = require('uuid');
const errorHandler = require('./errorHandle');

let todos = [];

const headers = {
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Content-Length, X-Requested-With',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'PATCH, POST, GET, OPTIONS, DELETE',
    'Content-Type': 'application/json'
};

function getAllTodos(request, response) {
    response.writeHead(200, headers);
    response.write(JSON.stringify({
        "status": "success",
        "data": todos
    }));
    response.end();
}

function addTodo(request, response, body) {
    try {
        const title = JSON.parse(body).title;
        if (title !== undefined && title !== "") {
            const todo = {
                'title': title,
                'id': uuidv4()
            };
            todos.push(todo);
            getAllTodos(request, response);
        } else if (title === "") {
            errorHandler(response, "不能為空值");
        } else {
            errorHandler(response, "資料格式錯誤，或無此todo id");
        }
    } catch (error) {
        errorHandler(response, "資料格式錯誤，或無此todo id");
    }
}

function deleteAllTodos(request, response) {
    todos = [];
    getAllTodos(request, response);
}

function deleteTodoById(request, response) {
    const id = request.url.split('/').pop();
    const index = todos.findIndex(todo => todo.id === id);
    if (index !== -1) {
        todos.splice(index, 1);
        getAllTodos(request, response);
    } else {
        errorHandler(response, "無此todo id");
    }
}

function updateTodoById(request, response, body) {
    try {
        const todoTitle = JSON.parse(body).title;
        const id = request.url.split("/").pop();
        const index = todos.findIndex(todo => todo.id === id);
        if (todoTitle !== undefined && index !== -1) {
            todos[index].title = todoTitle;
            getAllTodos(request, response);
        } else {
            errorHandler(response, '編輯失敗，欄位填寫錯誤，或無此id');
        }
    } catch {
        errorHandler(response, '編輯失敗，資料錯誤');
    }
}

function requestListener(request, response) {
    let body = "";

    request.on('data', chunk => {
        body += chunk;
    });

    switch (request.url) {
        case '/todos':
            switch (request.method) {
                case 'GET':
                    getAllTodos(request, response);
                    break;
                case 'POST':
                    request.on('end', () => addTodo(request, response, body));
                    break;
                case 'DELETE':
                    if (request.url.startsWith('/todos/')) {
                        deleteTodoById(request, response);
                    } else {
                        deleteAllTodos(request, response);
                    }
                    break;
                case 'OPTIONS':
                    response.writeHead(200, headers);
                    response.end();
                    break;
                default:
                    errorHandler(response, '無此網站路由');
            }
            break;
        case (request.url.startsWith('/todos/') && request.method === 'PATCH'):
            request.on('end', () => updateTodoById(request, response, body));
            break;
        case '/':
            response.writeHead(200, headers);
            response.write("Server is running");
            response.end();
            break;
        default:
            errorHandler(response, '無此網站路由');
    }
}

const server = http.createServer(requestListener);
server.listen(process.env.PORT || 3005);