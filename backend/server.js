const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());  // Enable CORS for all requests
app.use(bodyParser.json()); // Middleware for parsing JSON requests

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/car_management', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB');
}).catch(err => {
    console.log('Error connecting to MongoDB:', err);
});

// User schema and model
const UserSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String
});

const User = mongoose.model('User', UserSchema);

// Car schema and model
const CarSchema = new mongoose.Schema({
    title: String,
    description: String,
    images: [String],
    tags: [String],
    userId: mongoose.Schema.Types.ObjectId // Reference to the User who created the car
});

const Car = mongoose.model('Car', CarSchema);

// User registration route
app.post('/api/signup', async (req, res) => {
    const { name, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword });
    await user.save();
    res.status(201).json({ message: 'User created successfully!' });
});

// User login route
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'User not found' });

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(400).json({ message: 'Invalid password' });

    const token = jwt.sign({ userId: user._id }, 'secretKey');
    res.status(200).json({ token });
});

// Route to create a car
app.post('/api/cars', async (req, res) => {
    const { title, description, images, tags, userId } = req.body;
    const car = new Car({ title, description, images, tags, userId });
    await car.save();
    res.status(201).json({ message: 'Car created successfully!' });
});

// Route to get cars for a specific user
app.get('/api/cars/:userId', async (req, res) => {
    const cars = await Car.find({ userId: req.params.userId });
    res.json(cars);
});

// Route to update a car
app.put('/api/cars/:id', async (req, res) => {
    const { title, description, images, tags } = req.body;
    const updatedCar = await Car.findByIdAndUpdate(req.params.id, { title, description, images, tags }, { new: true });
    res.json(updatedCar);
});

// Route to delete a car
app.delete('/api/cars/:id', async (req, res) => {
    await Car.findByIdAndDelete(req.params.id);
    res.status(204).send();
});

// Start the server
app.listen(5000, () => {
    console.log('Server running on port 5000');
});
