const express = require('express');
const Car = require('../models/Car');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const router = express.Router();

// Middleware to check JWT token
const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(403).json({ error: 'Invalid token' });
        req.userId = decoded.userId;
        next();
    });
};

// Multer setup for image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

// Create a new car
router.post('/', authMiddleware, upload.array('images', 10), async (req, res) => {
    const { title, description, tags } = req.body;
    const images = req.files.map(file => file.path);

    const newCar = new Car({
        userId: req.userId,
        title,
        description,
        tags: tags.split(','),
        images
    });

    try {
        await newCar.save();
        res.status(201).json({ message: 'Car created successfully' });
    } catch (err) {
        res.status(400).json({ error: 'Error creating car' });
    }
});

// List all cars for the logged-in user
router.get('/', authMiddleware, async (req, res) => {
    try {
        const cars = await Car.find({ userId: req.userId });
        res.json(cars);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get car details
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const car = await Car.findOne({ _id: req.params.id, userId: req.userId });
        if (!car) return res.status(404).json({ error: 'Car not found' });
        res.json(car);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Update car details
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const car = await Car.findOne({ _id: req.params.id, userId: req.userId });
        if (!car) return res.status(404).json({ error: 'Car not found' });

        car.title = req.body.title || car.title;
        car.description = req.body.description || car.description;
        car.tags = req.body.tags || car.tags;
        // Handle image update if necessary

        await car.save();
        res.json({ message: 'Car updated successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete car
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const car = await Car.findOneAndDelete({ _id: req.params.id, userId: req.userId });
        if (!car) return res.status(404).json({ error: 'Car not found' });
        res.json({ message: 'Car deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
