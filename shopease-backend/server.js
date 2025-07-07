const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 5000;

// File paths
const USERS_FILE = path.join(__dirname, 'users.json');
const ORDERS_FILE = path.join(__dirname, 'orders.json');
const PRODUCTS_FILE = path.join(__dirname, 'products.json');

app.use(cors());
app.use(express.json());

// Utility functions
function loadJSON(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const data = fs.readFileSync(filePath);
  try {
    return JSON.parse(data);
  } catch (err) {
    console.error(`❌ Failed to parse ${filePath}:`, err.message);
    return [];
  }
}

function saveJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// Load & Save Users
const loadUsers = () => loadJSON(USERS_FILE);
const saveUsers = (data) => saveJSON(USERS_FILE, data);

// Load & Save Orders
const loadOrders = () => loadJSON(ORDERS_FILE);
const saveOrders = (data) => saveJSON(ORDERS_FILE, data);

// Load Products
const loadProducts = () => loadJSON(PRODUCTS_FILE);

// ------------------------ ROUTES ----------------------------

// Register
app.post('/api/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const users = loadUsers();
  if (users.find(u => u.email === email)) {
    return res.status(400).json({ error: 'User already exists' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = { id: Date.now(), name, email, password: hashedPassword };
  users.push(newUser);
  saveUsers(users);

  res.status(201).json({ message: 'User registered successfully' });
});

// Login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const users = loadUsers();
  const user = users.find(u => u.email === email);

  if (!user) return res.status(400).json({ error: 'User not found' });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(401).json({ error: 'Invalid password' });

  res.json({ message: 'Login successful', user: { id: user.id, name: user.name, email: user.email } });
});

// Get Products
app.get('/api/products', (req, res) => {
  const products = loadProducts();
  res.json(products);
});

// Receive Cart from Frontend
app.post('/api/cart', (req, res) => {
  const cartItems = req.body;

  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    return res.status(400).json({ error: 'Cart is empty or invalid' });
  }

  console.log('🛒 Cart received:', cartItems);
  res.status(200).json({ message: 'Cart received successfully' });
});

// Save Orders
app.post('/api/orders', (req, res) => {
  const { name, email, items, total } = req.body;
  if (!name || !email || !items || !total) {
    return res.status(400).json({ error: 'Invalid order data' });
  }

  const orders = loadOrders();
  const newOrder = { id: Date.now(), name, email, items, total };
  orders.push(newOrder);
  saveOrders(orders);

  res.status(201).json({ message: 'Order saved successfully', order: newOrder });
});

// View All Orders (optional admin route)
app.get('/api/orders', (req, res) => {
  const orders = loadOrders();
  res.json(orders);
});

app.use(express.json());

app.post('/api/contact', (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  // You can save it to a database or send an email
  console.log("Message received:", { name, email, message });

  res.json({ success: true, message: 'Message received successfully.' });
});

// ------------------------ START SERVER ---------------------
app.listen(PORT, () => {
  console.log(`✅ ShopEase backend running at http://localhost:${PORT}`);
});