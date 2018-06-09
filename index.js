const express = require("express");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const http = require("http");
const passport = require("passport");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const nconf = require("nconf");

const app = express();
const httpServer = http.createServer(app);

nconf.file({ file: 'config.json' }).env();
const config = {
    isProd: !!nconf.get("isProd"),
    port: nconf.get("PORT"),
    sessionSecret: nconf.get("sessionSecret"),
    clientId: nconf.get("clientId"),
    clientSecret: nconf.get("clientSecret"),
    repoUrl: nconf.get("repoUrl"),
    repoUser: nconf.get("repoUser"),
    repoPassword: nconf.get("repoPassword")
};

const authRedirectUri = "/auth/google/callback";

app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: config.sessionSecret,
    name: 'sketchbook-auth',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: config.isProd,
        httpOnly: true
    }
}));
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

passport.use(new GoogleStrategy(
    {
        clientID: config.clientId,
        clientSecret: config.clientSecret,
        callbackURL: authRedirectUri,
        proxy: true // necessary for https redirect on Azure
    },
    (accessToken, refreshToken, profile, cb) => cb(undefined, profile)
));

// force https in production
app.use((req, res, next) => {
    if (config.isProd && req.protocol === 'http') {
        return res.redirect('https://' + req.headers.host + req.url);
    }
    next();
});

/* Azure and secure cookies: see http://scottksmith.com/blog/2014/08/22/using-secure-cookies-in-node-on-azure/ */
/*---------------------------------------------------------_*/
// Tell express that we're running behind a reverse proxy that supplies https for you
app.set('trust proxy', 1);

//Add middleware that will trick express into thinking the request is secure
app.use((req, res, next) => {
    if (req.headers['x-arr-ssl'] && !req.headers['x-forwarded-proto']) {
        req.headers['x-forwarded-proto'] = 'https';
    }
    return next();
});
/*---------------------------------------------------------_*/

// not senseful for sketchbook cuase there is no login page and no anonymous content available
// app.get('/logout', function (req, res) {
//     req.logout();
//     res.redirect('/');
// });

app.get('/login', passport.authenticate('google', {
    scope: ["profile"]
}));

app.get(authRedirectUri,
    passport.authenticate('google', {
        successRedirect: '/',
        failureRedirect: '/login'
    }));

app.get("/*", ensureAuthenticated, (req, res) => {
    res.send(`<img src='${req.user.photos[0].value}' />`);
});


function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login');
}

httpServer.listen(config.port, () => {
    console.log(`listening on *:${config.port}`);
});

