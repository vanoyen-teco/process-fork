#!/usr/bin/env node
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
const argv = yargs(hideBin(process.argv)).argv

require('dotenv/config');
const express = require('express');
const session =  require('express-session');
const path = require('path');
const MongoStore = require('connect-mongo');

const passport = require('passport');
const { initializePassport } = require('./models/Passport');

const handlebars = require('express-handlebars');
const {engine} = handlebars;

const app = express();

/*Api temporal*/
const apiRouter = require("./routes/apiRouter");
/* End api temporal */

const PORT = (argv.port !== undefined)?argv.port:8080;
app.listen(PORT, () => console.log("Server Up"));

app.engine(
    "hbs",
    engine({
        extname: ".hbs",
        defaultLayout: "layout.hbs",
    })
);

app.set("views", "./views");
app.set("view engine", "hbs");

app.use(express.static(path.join(__dirname ,'public')));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
    store: MongoStore.create({
        mongoUrl: process.env.DB_CNX,
        mongoOptions: {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        }
    }),
    secret: 'coder',
    resave: true,
    saveUninitialized: true,
    cookie: {maxAge: 600000} //10 minutos
}));

initializePassport();
app.use(passport.initialize());
app.use(passport.session());

app.use("/api", apiRouter);

app.get('/', passport.authenticate('login', { failureRedirect: '/login'}), (req, res) => {
    res.redirect("/dashboard");
})

app.route('/login').get((req, res) => {
    res.render("login", {
        pageTitle: "LogIn",
        signUp: true
    });
}).post(passport.authenticate('login', { failureRedirect: '/login/fail'}), (req, res)=>{
    res.redirect('/dashboard');
});

app.route('/login/fail').get((req, res) => {
    res.render("login", {
        pageTitle: "LogIn",
        signUp: true,
        error: true
    });
})

app.route('/signup').get((req, res) => {
    res.render("signup", {
        pageTitle: "Sign Up",
        signUp: true
    });
}).post(passport.authenticate('register', { failureRedirect: '/signup/fail'}),(req, res)=>{
    res.redirect('/dashboard');
})

app.route('/signup/fail').get((req, res) => {
    res.render("signup", {
        pageTitle: "Sign Up",
        signUp: false,
        fail: true
    });
});

app.route('/dashboard').get((req, res) => {
    if(req.user){
        res.render("dashboard", {
            pageTitle: "Dashboard",
            userName: req.user.username,
            userEmail: req.user.email,
            loggedIn: true,
            signUp: false
        });
    }else{
        res.redirect('/login');
    }
});

app.route('/logout').get((req, res) => {
    req.logout((err) => {
        if (err) { res.redirect('/login') }
        else 
        res.render("logout", {
            pageTitle: "Logout",
            signUp: false 
        });
    })    
})

app.route('/info').get((req, res) => {
    let loggedIn = (req.user)?false:true;
    let signUp = (req.user)?true:false;
    const argumentos = (process.argv)?process.argv.slice(2):false;
    res.render("info", {
        pageTitle: "Server Info",
        loggedIn: loggedIn,
        signUp: signUp,
        server: { 
            "processId": process.pid,
            "directorio" : __dirname,
            "path": process.cwd(),
            "nodeVersion": process.version,
            "proceso": process.title,
            "os": process.platform,
            "memory": process.memoryUsage().rss,
            "argumentos": argumentos
        }
    });
});