var _ = require('lodash');
var Pets = require('../models/Pet');

exports.listPets =  function(req, res) {
    Pets.find(function(err, pets) {

        if (err) {
            res.status(500).send({ error: 'Error gettting pets!' });
            return;
        }
        res.send(pets);
    });
};

exports.listByLocation = (req, res) => {

    //-23.3916595, -46.3503655

    Pets.find(function(err, pets) {

        if (err || !req.query.latLng) {
            res.status(500).send({ error: 'Error gettting pet!' });
            return;
        }

        var query = {
            geometry: { 
                $geoWithin: { 
                    $centerSphere: [JSON.parse(req.query.latLng), (req.query.radius||10)/6371 ]  
                } 
            }
        };

        Pets.find( query, (err, pets) => {

            if (err) {
                res.status(500).send({ error: 'Error gettting pet!' });
                return;
            }
            
            res.send(pets);

        });

    });

};

exports.getPet =  function(req, res) {
    Pets.find(function(err, pets) {

        if (err || !req.params.id) {
            res.status(500).send({ error: 'Error gettting pet!' });
            return;
        }

        Pets.findById(req.params.id, function(err, pet) {
           res.send(pet);
       });       
    });
};

exports.newPet = function(req, res) {    

    if(!req.body){
        res.status(500).send({ error: 'Error trying to create new pet!' });
    }

    var pet = new Pets({
        owner: 
        {
            id: req.body.owner.id,
            name: req.body.owner.name,
            email: req.body.owner.email,
        },
        name: req.body.name,
        type: req.body.type,
        age: req.body.age,
        desctription: req.body.desctription,
        breed: req.body.breed,
        vaccinated: req.body.vaccinated,
        dewormed: req.body.dewormed,
        castrated: req.body.castrated,
        gender: req.body.gender,
        images: req.body.images,
        geometry: { 
            coordinates: req.body.coordinates
        },
        createdAt: req.body.createdAt //"2014-01-16T00:00:00Z"
    });

    pet.save(function(err){
        if(!err){
            res.status(200).send("New pet created with success");
        }else{
            res.status(500).send({ error: err.message });
        }
    })
};

exports.editPet = function(req, res) {

    if(Object.keys(req.body).length === 0 || !req.params.id){
        res.status(500).send({ error: 'Error trying edit pet!' });
    }

    Pets.findById(req.params.id, function(err, pet) {

        if (err) res.send(err);

        var newPet = pet;

        _(req.body).forEach((value,key) => {
            if(typeof value === "object"){
                _(value).forEach((v,k) => {
                    newPet[key][k] = v;
                });

            }else{
                newPet[key] = value;
            }
        });

        pet.save(function(err){
            if(!err){
                res.status(200).send();
            }else{
                res.status(500).send({ error: err.message });
            }
        });
    });
};

exports.deletePet = function (req, res) {

    if(!req.params.id){
        res.status(500).send({ error: 'Error trying deleting pet!' });
    }

    Pets.findById(req.params.id, function(err, pet) {
        pet.remove(function(err){
            if(!err){
                res.status(200).send();
            }else{
                res.status(500).send({ error: err.message });
            }
        });
    });  
};

