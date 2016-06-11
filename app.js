const express = require('express');
const compress = require('compression');
const session = require('express-session');
const bodyParser = require('body-parser');
const logger = require('morgan');
const errorHandler = require('errorhandler');
const lusca = require('lusca');
const dotenv = require('dotenv');
const MongoStore = require('connect-mongo/es5')(session);
const flash = require('express-flash');
const path = require('path');
const mongoose = require('mongoose');
const passport = require('passport');
const expressValidator = require('express-validator');
const sass = require('node-sass-middleware');
const multer = require('multer');
const upload = multer({ dest: path.join(__dirname, 'uploads') });

//Controllers
const homeController = require('./controllers/home');
const userController = require('./controllers/user');
const apiController = require('./controllers/api');
const contactController = require('./controllers/contact');
const petsController = require('./controllers/pets');
const constants = require('./config/constants');

const publicRoutes = constants.publicRoutes;

dotenv.load({ path: 'var.env' });

const passportConfig = require('./config/passport');

const app = express();

mongoose.connect(process.env.MONGODB || process.env.MONGOLAB_URI);

mongoose.connection.on('error', () => {
  console.log('MongoDB Connection Error. Please make sure that MongoDB is running.');
  process.exit(1);
});

app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(compress());
app.use(sass({
  src: path.join(__dirname, 'public'),
  dest: path.join(__dirname, 'public'),
  sourceMap: true
}));

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(expressValidator());
app.use(session({
  resave: true,
  saveUninitialized: true,
  secret: process.env.SESSION_SECRET,
  store: new MongoStore({
    url: process.env.MONGODB || process.env.MONGOLAB_URI,
    autoReconnect: true
  })
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

app.use(express.static(path.join(__dirname, 'public'), { maxAge: 31557600000 }));

app.use((req, res, next) => {
    if(publicRoutes.indexOf(req.path) > 0 ){
        next();
    }else{
      
      userController.isAuthenticated(req, res, next).then(allowed => {
        if(allowed){
          next();           
        }else{          
          res.send(401);
        }
      });     
    }
});

app.get('/', homeController.index);

app.get('/login', userController.getLogin);
app.post('/login', userController.postLogin);

app.get('/logout', userController.logout);

app.get('/forgot', userController.getForgot);
app.post('/forgot', userController.postForgot);

app.get('/reset/:token', userController.getReset);
app.post('/reset/:token', userController.postReset);

app.get('/signup', userController.getSignup);
app.post('/signup', userController.postSignup);

app.get('/contact', contactController.getContact);
app.post('/contact', contactController.postContact);

app.get('/account',  userController.getAccount);
app.post('/account/profile', userController.postUpdateProfile);
app.post('/account/password', userController.postUpdatePassword);
app.post('/account/delete',  userController.postDeleteAccount);
app.get('/account/unlink/:provider', userController.getOauthUnlink);

app.get('/api', apiController.getApi);
app.get('/api/facebook',  passportConfig.isAuthorized, apiController.getFacebook);
app.get('/api/upload', apiController.getFileUpload);
app.post('/api/upload', upload.single('myFile'), apiController.postFileUpload);

app.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email', 'user_location'] }));
app.get('/auth/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/login' }), (req, res) => {
  res.redirect(req.session.returnTo || '/');
});



app.get('/pet/list', petsController.listPets);
app.get('/pet/listByLocation', petsController.listByLocation);
app.post('/pet', petsController.newPet);
app.get('/pet/:id',  petsController.getPet);
app.put('/pet/:id', petsController.editPet);
app.delete('/pet/:id', petsController.deletePet);

app.use(errorHandler());

app.listen(app.get('port'), () => {
  console.log('Express server listening on port %d in %s mode', app.get('port'), app.get('env'));
});

module.exports = app;
