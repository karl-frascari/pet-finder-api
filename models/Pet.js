var mongoose = require('mongoose');

var petSchema = new mongoose.Schema({
  name: {type: String, required: true},
  type: {type: String, required: true},
  age: String,
  dewormed: Boolean,
  castrated: Boolean,
  vaccinated: String,
  gender: String,
  breed: String,
  description: String,
  owner:{
    id: {type: String, required: true},
    name: {type: String, required: true},
    email: {type: String, required: true},
  },
  createdAt: {type: String, required: true},
  updatedAt: { type: String, default: Date.now, required: true },
  images: [],
  geometry: { 
    type: { type: String, default:'Point' }, 
    coordinates: [Number] 
  },
}, { timestamps: true });

petSchema.index({geometry: '2dsphere'});

var Pet = mongoose.model('Pet', petSchema);

module.exports = Pet;
