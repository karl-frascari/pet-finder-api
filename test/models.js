var chai = require('chai');
var should = chai.should();
var User = require('../models/User');
var Pet = require('../models/Pet');

//User
describe('User Model', function() {
  it('should create a new user', function(done) {
    var user = new User({
      email: 'test@gmail.com',
      password: 'password'
    });
    user.save(function(err) {
      if (err) return done(err);
      done();
    });
  });

  it('should not create a user with the unique email', function(done) {
    var user = new User({
      email: 'test@gmail.com',
      password: 'password'
    });
    user.save(function(err) {
      if (err) err.code.should.equal(11000);
      done();
    });
  });

  it('should find user by email', function(done) {
    User.findOne({ email: 'test@gmail.com' }, function(err, user) {
      if (err) return done(err);
      user.email.should.equal('test@gmail.com');
      done();
    });
  });

  it('should delete a user', function(done) {
    User.remove({ email: 'test@gmail.com' }, function(err) {
      if (err) return done(err);
      done();
    });
  });
});


//Pets
var idPet;

describe('User Pets', function() {

  it('should create a new pet', function(done) {    

    var pet = new Pet({
      "owner": 
      {
        "id": "5084984984984",
        "name": "Jose",
        "email": "jose@gmail.com"
      },
      "name": "Xoblau",
      "type": "gato",
      "age": 11,
      "dewormed": true,
      "castrated": false,
      "gender": "Male",
      "location":{
        "lat": "-23.3916595",
        "long": "-46.3503655 "
      },
      "createdAt": "2014-01-16T00:00:00Z"
    });

    pet.save(function(err, x) {
      if (err) return done(err);
      idPet = pet._id;
      done();
    });

  });

  it('should find a pet by id', function(done) {
    Pet.find(function(err, pets) {
      Pet.findById(idPet.toString(), function(err, pet) {
        if (err) return done(err);
        pet._id.toString().should.equal(idPet.toString());
        done();
      });       
    });
  });

  it('should delete a pet', function(done) {
    Pet.remove({ id: idPet }, function(err) {
      if (err) return done(err);
      done();
    });
  });
});
