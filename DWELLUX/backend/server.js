// 1. Import necessary modules
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// 2. Import the Mongoose models
const User = require('./models/User');
const Vendor = require('./models/Vendor');
const Product = require('./models/Product');

// 3. Import middleware
const auth = require('./middleware/auth');

// 4. Initialize the Express app
const app = express();

// 5. Define the port
const PORT = process.env.PORT || 5000;

// 6. Middleware: body-parser
app.use(express.json());

// 7. Connect to MongoDB
const db = 'mongodb://127.0.0.1:27017/dwellux_db';

mongoose
  .connect(db)
  .then(() => console.log('MongoDB connected successfully!'))
  .catch((err) => console.log(err));

// 8. Define all API routes. Place this AFTER all middleware.
// User Authentication Endpoints
app.post('/api/users/register', async (req, res) => {
  const { email, password } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: 'User already exists' });
    user = new User({ email, password });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();
    res.status(201).json({ msg: 'User registered successfully!' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

app.post('/api/users/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    let user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'Invalid credentials' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });
    const payload = { user: { id: user.id } };
    const token = jwt.sign(payload, 'yourSecretKey', { expiresIn: '1h' });
    res.json({ token });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Vendor Authentication Endpoints
app.post('/api/vendors/register', async (req, res) => {
  const { companyName, email, password } = req.body;
  try {
    let vendor = await Vendor.findOne({ email });
    if (vendor) return res.status(400).json({ msg: 'Vendor already exists' });
    vendor = new Vendor({ companyName, email, password });
    const salt = await bcrypt.genSalt(10);
    vendor.password = await bcrypt.hash(password, salt);
    await vendor.save();
    res.status(201).json({ msg: 'Vendor registered successfully. Awaiting approval.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

app.post('/api/vendors/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    let vendor = await Vendor.findOne({ email });
    if (!vendor) return res.status(400).json({ msg: 'Invalid credentials' });
    if (!vendor.isApproved) return res.status(403).json({ msg: 'Your account is pending approval.' });
    const isMatch = await bcrypt.compare(password, vendor.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });
    const payload = { vendor: { id: vendor.id } };
    const token = jwt.sign(payload, 'yourSecretKey', { expiresIn: '1h' });
    res.json({ token });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Product Endpoints
app.post('/api/products', auth, async (req, res) => {
  const { name, description, price, images } = req.body;
  try {
    const newProduct = new Product({
      name,
      description,
      price,
      images,
      vendor: req.vendor.id,
    });
    const product = await newProduct.save();
    res.json(product);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find().populate('vendor', 'companyName');
    res.json(products);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ msg: 'Product not found' });
    res.json(product);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') return res.status(404).json({ msg: 'Product not found' });
    res.status(500).send('Server Error');
  }
});

// 9. Start the server. This should be the last line.
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});