const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const methodOverride = require("method-override");

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true });
mongoose.connection.on("connected", () =>
  console.log("MongoDB connected successfully.")
);
mongoose.connection.on("error", (err) =>
  console.error("MongoDB connection error:", err)
);

if (mongoose.models.User) {
  delete mongoose.models.User;
}

// Define models
const User = mongoose.model(
  "User",
  new mongoose.Schema({
    firstName: {
      type: String,
      required: [true, "First name is required"],
      validate: {
        validator: (value) => /^[a-zA-Z\s]+$/.test(value),
        message: "First name cannot contain numbers or special characters",
      },
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      validate: {
        validator: (value) => /^[a-zA-Z\s]+$/.test(value),
        message: "Last name cannot contain numbers or special characters",
      },
    },
    age: {
      type: Number,
      required: [true, "Age is required"],
      min: [1, "Age must be a positive number"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      validate: {
        validator: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
        message: "Invalid email format",
      },
    },
    is_admin: { type: Boolean, default: false },
  })
);

const Post = mongoose.model(
  "Post",
  new mongoose.Schema({
    title: {
      type: String,
      required: [true, "Title is required"],
    },
    content: {
      type: String,
      required: [true, "Content is required"],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },
  })
);

// App setup
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(methodOverride("_method"));

// Root route - Display CRUD forms and data
app.get("/", async (req, res) => {
  const users = await User.find();
  const posts = await Post.find().populate("user", "firstName lastName");
  res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <title>Sports Community</title>
        </head>
        <body>
            <h1>Sports Community</h1>

            <h2>API Endpoints</h2>
            <ul>
                <li><a href="/api/users">GET /api/users</a> - List all users</li>
                <li><a href="/api/posts">GET /api/posts</a> - List all posts</li>
                <li><a href="/api/users/:id">GET /api/users/:id</a> - Get user details</li>
                <li><a href="/api/posts/:id">GET /api/posts/:id</a> - Get post details</li>
                <li>POST /api/users - Add a new user</li>
                <li>POST /api/posts - Add a new post</li>
                <li>PATCH /api/users/:id - Update user details</li>
                <li>PATCH /api/posts/:id - Update post details</li>
                <li>DELETE /api/users/:id - Delete a user</li>
                <li>DELETE /api/posts/:id - Delete a post</li>
            </ul>

            <h2>Users</h2>
            <form method="POST" action="/users">
                <input type="text" name="firstName" placeholder="First Name" required />
                <input type="text" name="lastName" placeholder="Last Name" required />
                <input type="number" name="age" placeholder="Age" required />
                <input type="email" name="email" placeholder="Email" required />
                <input type="checkbox" name="is_admin" /> Admin
                <button type="submit">Create User</button>
            </form>
            <ul>
                ${users
                  .map(
                    (user) => `
                    <li>
                        ID: ${user.id} ${user.firstName} ${user.lastName} (${user.email}) - Age: ${user.age} Admin? ${user.is_admin}
                        <form method="POST" action="/users/${user._id}?_method=DELETE" style="display:inline;">
                            <button type="submit">Delete</button>
                        </form>
                        <form method="GET" action="/users/${user._id}/edit" style="display:inline;">
                            <button type="submit">Edit</button>
                        </form>
                    </li>`
                  )
                  .join("")}
            </ul>

            <h2>Posts</h2>
            <form method="POST" action="/posts">
                <input type="text" name="title" placeholder="Title" required />
                <textarea name="content" placeholder="Content" required></textarea>
                <select name="user" required>
                    <option value="">Select User</option>
                    ${users
                      .map(
                        (user) =>
                          `<option value="${user._id}">${user.firstName} ${user.lastName}</option>`
                      )
                      .join("")}
                </select>
                <button type="submit">Create Post</button>
            </form>
            <ul>
                ${posts
                  .map(
                    (post) => `
                    <li>
                        <strong>${post.title}</strong>: ${post.content} by ${
                      post.user?.firstName || "Unknown"
                    }
                        <form method="POST" action="/posts/${
                          post._id
                        }?_method=DELETE" style="display:inline;">
                            <button type="submit">Delete</button>
                        </form>
                        <form method="GET" action="/posts/${
                          post._id
                        }/edit" style="display:inline;">
                            <button type="submit">Edit</button>
                        </form>
                    </li>`
                  )
                  .join("")}
            </ul>
        </body>
        </html>
    `);
});

// API Routes for Users
app.get("/api/users", async (req, res) => {
  const users = await User.find();
  res.json(users);
});

app.get("/api/users/:id", async (req, res) => {
  const user = await User.findById(req.params.id);
  res.json(user);
});

// API Routes for Posts
app.get("/api/posts", async (req, res) => {
  const posts = await Post.find().populate("user", "firstName lastName");
  res.json(posts);
});

app.get("/api/posts/:id", async (req, res) => {
  const post = await Post.findById(req.params.id).populate(
    "user",
    "firstName lastName"
  );
  res.json(post);
});

// CRUD for Users
app.post("/users", async (req, res) => {
  req.body.is_admin = req.body.is_admin === "on";
  try {
    await User.create(req.body);
    res.redirect("/");
  } catch (err) {
    res.status(400).send(`<p>Error: ${err.message}</p><a href="/">Back</a>`);
  }
});

app.get("/users/:id/edit", async (req, res) => {
  const user = await User.findById(req.params.id);
  res.send(`
      <form method="POST" action="/users/${user._id}?_method=PATCH">
        <input type="text" name="firstName" value="${user.firstName}" required />
        <input type="text" name="lastName" value="${user.lastName}" required />
        <input type="number" name="age" value="${user.age}" required />
        <input type="email" name="email" value="${user.email}" required />
        <button type="submit">Update User</button>
      </form>
    `);
});

app.patch("/users/:id", async (req, res) => {
  req.body.is_admin = req.body.is_admin === "on"; // Handle admin checkbox
  try {
    await User.findByIdAndUpdate(req.params.id, req.body);
    res.redirect("/");
  } catch (err) {
    res.status(400).send(`<p>Error: ${err.message}</p><a href="/">Back</a>`);
  }
});

app.delete("/users/:id", async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.redirect("/");
  } catch (err) {
    res.status(500).send(`<p>Error: ${err.message}</p><a href="/">Back</a>`);
  }
});

// CRUD Routes for Posts
app.post("/posts", async (req, res) => {
  try {
    await Post.create(req.body);
    res.redirect("/");
  } catch (error) {
    const validationErrors = Object.values(error.errors || {}).map(
      (err) => err.message
    );
    res.send(`
          <div>
            <h1>Validation Error</h1>
            <ul>${validationErrors
              .map((err) => `<li>${err}</li>`)
              .join("")}</ul>
            <a href="/">Go Back</a>
          </div>
        `);
  }
});

app.get("/posts/:id/edit", async (req, res) => {
  const post = await Post.findById(req.params.id).populate(
    "user",
    "firstName lastName"
  );
  const users = await User.find();
  res.send(`
      <form method="POST" action="/posts/${post._id}?_method=PATCH">
        <input type="text" name="title" value="${post.title}" required />
        <textarea name="content" required>${post.content}</textarea>
        <select name="user" required>
          ${users
            .map(
              (user) =>
                `<option value="${user._id}" ${
                  user._id.toString() === post.user._id.toString()
                    ? "selected"
                    : ""
                }>${user.firstName} ${user.lastName}</option>`
            )
            .join("")}
        </select>
        <button type="submit">Update Post</button>
      </form>
    `);
});

app.patch("/posts/:id", async (req, res) => {
  try {
    await Post.findByIdAndUpdate(req.params.id, req.body);
    res.redirect("/");
  } catch (err) {
    res.status(400).send(`<p>Error: ${err.message}</p><a href="/">Back</a>`);
  }
});

app.delete("/posts/:id", async (req, res) => {
  try {
    await Post.findByIdAndDelete(req.params.id);
    res.redirect("/");
  } catch (err) {
    res.status(500).send(`<p>Error: ${err.message}</p><a href="/">Back</a>`);
  }
});
const PORT = process.env.PORT || 3000;
// Start the server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
