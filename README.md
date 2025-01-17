# Sports Community API

This project is a Node.js and Express API for managing a sports community. The API is database-driven and provides CRUD functionality for users and posts. Additional features include endpoint documentation and basic validation.

---

## Features

- **Users**
  - Create, read, update, and delete users.
  - Validation: First and last names cannot contain numbers, and all fields are required.
  
- **Posts**
  - Create, read, update, and delete posts.
  - Posts are associated with users.

- **Endpoint Documentation**
  - A root route (`/`) returns a simple HTML page listing all available API endpoints, along with simple forms to create, delete or edit users/posts.

- **Validation**
  - Ensures fields are correctly filled out and in the proper format.

---

## Steps to Run the Project

### 1. **Clone the Repository**

```bash
git clone https://github.com/LouisI299/backendweb-api/
cd sports-community-api
```

### 2. **Install dependencies**

```bash
npm install
```

### 3. **Set up environment variables**

Create a .env file in the project, and specify your mongo_uri and desired port.

### 4. **Start the server**

```bash
node app.js
```

The server runs on http://localhost:3000.

## Documentation and references

- https://expressjs.com/
- https://mongoosejs.com/docs/guide.html
- https://nodejs.org/en/learn/getting-started/introduction-to-nodejs
- https://www.mongodb.com/docs/atlas/


