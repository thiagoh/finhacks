/**
 * Module dependencies.
 */
const express = require('express');
const exphbs = require('express-handlebars');
const compression = require('compression');
const session = require('express-session');
const bodyParser = require('body-parser');
const logger = require('morgan');
const chalk = require('chalk');
const errorHandler = require('errorhandler');
const lusca = require('lusca');
const dotenv = require('dotenv');
const MongoStore = require('connect-mongo')(session);
const flash = require('express-flash');
const path = require('path');
const mongoose = require('mongoose');
const passport = require('passport');
const expressValidator = require('express-validator');
const expressStatusMonitor = require('express-status-monitor');
const sass = require('node-sass-middleware');
const multer = require('multer');

const upload = multer({
  dest: path.join(__dirname, 'uploads')
});

/**
 * Load environment variables from .env file, where API keys and passwords are configured.
 */
dotenv.load({
  path: '.env.finhack'
});

/**
 * Controllers (route handlers).
 */
const homeController = require('./controllers/home');
const transactionsController = require('./controllers/transactions');
const userController = require('./controllers/user');
const dataController = require('./controllers/data');
const contactController = require('./controllers/contact');

/**
 * API keys and Passport configuration.
 */
const passportConfig = require('./config/passport');

/**
 * Create Express server.
 */
const app = express();

/**
 * Connect to MongoDB.
 */
mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGODB_URI || process.env.MONGOLAB_URI);
mongoose.connection.on('error', () => {
  console.log('%s MongoDB connection error. Please make sure MongoDB is running.', chalk.red('✗'));
  process.exit();
});

/**
 * Express configuration.
 */
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));

// app.set('view engine', 'pug');

// app.engine('handlebars', exphbs({defaultLayout: 'views'}));
// app.set('view engine', 'handlebars');

var HandlebarsDefaultOptions = {
    extname: '.hbs',
    defaultLayout: 'layout',
    partialsDir: [
      'views/partials/'
    ],
    helpers: {
      isActivePage: function(page1, page2, block) {
        return page1 === page2 ? block.fn(this) : '';
      }
    }
  },
  ExpressHandlebars = exphbs.create(HandlebarsDefaultOptions),
  hbs = ExpressHandlebars.engine;

HandlebarsDefaultOptions.partials = Promise.resolve({
  jsIncludes: ExpressHandlebars.handlebars.compile('')
});

// console.log(exphbs.handlebars.compile);
// console.log(handlebars.compile);
// console.log(hbs.handlebars);
// console.log(hbs.handlebars.compile);

app.engine('.hbs', hbs);
app.set('view engine', '.hbs');
app.disable('view cache');

app.use(expressStatusMonitor());
app.use(compression());
app.use(sass({
  src: path.join(__dirname, 'public'),
  dest: path.join(__dirname, 'public')
}));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(expressValidator());
app.use(session({
  resave: true,
  saveUninitialized: true,
  secret: process.env.SESSION_SECRET,
  store: new MongoStore({
    url: process.env.MONGODB_URI || process.env.MONGOLAB_URI,
    autoReconnect: true
  })
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

app.use((req, res, next) => {
  if (req.path === '/api/upload') {
    next();
  } else {
    lusca.csrf({
      angular: true
    })(req, res, next);
  }
});
app.use(lusca.xframe('SAMEORIGIN'));
app.use(lusca.xssProtection(true));
app.use(lusca.p3p('ABCDEF'));
app.use(lusca.hsts({
  maxAge: 31536000
}));
app.use(lusca.nosniff());

app.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});
app.use((req, res, next) => {
  // After successful login, redirect back to the intended page
  if (!req.user &&
    req.path !== '/login' &&
    req.path !== '/signup' &&
    !req.path.match(/^\/auth/) &&
    !req.path.match(/\./)) {
    req.session.returnTo = req.path;
  } else if (req.user &&
    req.path == '/account') {
    req.session.returnTo = req.path;
  }
  next();
});
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: 31557600000
}));

/**
 * Primary app routes.
 */
app.get('/', homeController.index(app, ExpressHandlebars));
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
app.get('/account', passportConfig.isAuthenticated, userController.getAccount);
app.post('/account/profile', passportConfig.isAuthenticated, userController.postUpdateProfile);
app.post('/account/password', passportConfig.isAuthenticated, userController.postUpdatePassword);
app.post('/account/delete', passportConfig.isAuthenticated, userController.postDeleteAccount);
app.get('/account/unlink/:provider', passportConfig.isAuthenticated, userController.getOauthUnlink);
app.get('/populate', dataController.getGenerateDatabase);
app.get('/api/cash-flow', dataController.getCurrentCashFlow);
app.get('/api/projected-networth', dataController.getProjectedNetWorth);
app.get('/transactions', transactionsController.getTransaction(app, ExpressHandlebars));
app.get('/api/transactions', transactionsController.getTransactionApi);
app.post('/api/transactions/save', transactionsController.saveTransactionApi);
app.post('/api/assets/save', transactionsController.saveAssetApi);

app.get('/auth/facebook', passport.authenticate('facebook', {
  scope: ['email', 'user_location']
}));
app.get('/auth/facebook/callback', passport.authenticate('facebook', {
  failureRedirect: '/login'
}), (req, res) => {
  res.redirect(req.session.returnTo || '/');
});
app.get('/auth/google', passport.authenticate('google', {
  scope: 'profile email'
}));
app.get('/auth/google/callback', passport.authenticate('google', {
  failureRedirect: '/login'
}), (req, res) => {
  res.redirect(req.session.returnTo || '/');
});
app.get('/auth/linkedin', passport.authenticate('linkedin', {
  state: 'SOME STATE'
}));
app.get('/auth/linkedin/callback', passport.authenticate('linkedin', {
  failureRedirect: '/login'
}), (req, res) => {
  res.redirect(req.session.returnTo || '/');
});

/**
 * Error Handler.
 */
app.use(errorHandler());

/**
 * Start Express server.
 */
app.listen(app.get('port'), () => {
  console.log('%s App is running at http://localhost:%d in %s mode', chalk.green('✓'), app.get('port'), app.get('env')); 
  console.log('  Press CTRL-C to stop\n');
});

module.exports = app;