const mongoose = require('mongoose');

const carSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    tags: [String],
    images: [String],
}, { timestamps: true });

module.exports = mongoose.model('Car', carSchema);
