var mongoose = require('mongoose');

var petSchema = new mongoose.Schema({
  owner:{
    id: {type: String, required: true},
    name: {type: String, required: true},
    email: {type: String, required: true},
  },
  name: {type: String, required: true},
  type: {type: String, required: true},
  age: String,
  dewormed: Boolean,
  castrated: Boolean,
  gender: String,
  location:{
    lat: {type: String, required: true},
    long: {type: String, required: true},
  },
  createdAt: {type: String, required: true},
  updatedAt: { type: String, default: Date.now, required: true },
  images: [{
    data: Buffer, 
    contentType: String 
  }]

}, { timestamps: true });

var Pet = mongoose.model('Pet', petSchema);

module.exports = Pet;
