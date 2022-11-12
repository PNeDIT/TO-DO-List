const dotenv = require('dotenv');
dotenv.config();

const express = require('express')
const session = require('express-session');
const app = express()
const mongoose = require("mongoose");
const Task = require("./models/Task");
const User = require("./models/User");

//app settings
app.set("view engine", "ejs");
app.use('/static', express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));



app.get("/", (req, res) => {
    if (!req.session.loggedin) {
        res.render('login.ejs');
    } else {
        Task.find({}, (err, tasks) => {
            res.render("index.ejs", { tasks: tasks.filter(task => !task.superTask) });
        });
    }
});

app.post('/', async (req, res) => {
    const newTask = new Task({
        name: req.body.name,
        description: req.body.description,
        endDate: req.body.endDate,
        priority: req.body.priority,
        comment: req.body.comment,
        hashtag: req.body.hashtag,
    });
    try {
        await newTask.save();
        console.log("saved");
        res.redirect("/");
    } catch (err) {
        console.log(err);
        res.redirect("/");
    }
});

app.get('/view/:id', async(req, res) => {
    if (!req.session.loggedin) {
        res.render('login.ejs');
    } else {
        console.log(mongoose.Types.ObjectId(req.params.id));
        Task.find({}, (err, tasks) => {
            tasks = tasks.filter(task => task.superTask);
            res.render("subTaskView.ejs", { tasks: tasks.filter(task => task.superTask.toString() === req.params.id) });
        })
    }
})

app.post('/sub/:id', async (req, res) => {
    const id = req.params.id;
    console.log(id);
    const newTask = new Task({
        name: req.body.name,
        description: req.body.description,
        endDate: req.body.endDate,
        priority: req.body.priority,
        comment: req.body.comment,
        hashtag: req.body.hashtag,
        superTask: new mongoose.Types.ObjectId(id)
    });
    try {
        await newTask.save();
        console.log("saved");
        res.redirect("/");
    } catch (err) {
        console.log(err);
        res.redirect("/");
    }
});

app.get('/add', async (req, res) => {
    if (!req.session.loggedin) {
        console.log("logged out");
        res.render('login.ejs');
    } else {
        console.log("logged in");
        res.render('add.ejs');
    }
});

app.get('/add/:id', async(req, res) => {
    if (!req.session.loggedin) {
        console.log("logged out");
        res.render('login.ejs');
    } else {
        console.log("logged in");
        res.render('add.ejs', {id:req.params.id});
    }
})

app.get('/edit/:id', (req, res) => {
    const id = req.params.id;
    var found = false;
    Task.find({}, (err, tasks) => {
        for(currTask of tasks){
            if(currTask._id == id){
                res.render("edit.ejs", { task: currTask });
                found = true;
            }
        }
        if(!found){
            res.redirect('/');
        }
    })
})

app.post('/edit/:id', (req, res) => {
    const id = req.params.id;
    Task.findByIdAndUpdate(id, {
        name: req.body.name,
        description: req.body.description,
        endDate: req.body.endDate,
        priority: req.body.priority,
        comment: req.body.comment,
        hashtag: req.body.hashtag,
    }, err => {
        if (err) return res.send(500, err);
        res.redirect("/");
    });
});

app.get('/remove/:id', (req, res) => {
    const id = req.params.id;
    Task.findByIdAndRemove(id, err => {
        if (err) return res.send(500, err);
    });
    Task.find({}, (err, tasks) => {
        tasks = tasks.filter(task => task.superTask);
        tasks = tasks.filter(task => task.superTask.toString() === req.params.id);
        tasks.forEach(task => {
            Task.findByIdAndRemove(task._id, err => {
                if (err) {
                    res.status(500);
            res.render('error', { error: "remove" })
                }
            })
        });
    })
    res.redirect("/");
});

app.post('/validate', async (req, res) => {
    email = req.body.email;
    pass = req.body.password;
    loggedIn = false;
    emailPresent = false;
    User.find({}, async (err, users) => {
        for (user of users) {
            if (user.email === email && user.password === pass) {
                console.log("existing user")
                req.session.loggedin = true;
                loggedIn = true;
                res.redirect("/");
            }
            if (user.email === email){
                emailPresent = true;
            }
        }
        if (!loggedIn && !emailPresent) {
            const newUser = new User({
                email: email,
                password: pass
            });
            try {
                await newUser.save();
                console.log("new user");
                req.session.loggedin = true;
            } catch (err) {
                console.log(err);
            }
            res.redirect("/");
        }else{
            res.status(500);
            res.render('error', { error: "email" })
        }
    });
});

//Connect to DB
mongoose.connect(process.env.DB_CONNECT, { useNewUrlParser: true }, () => {
    console.log("DB connection");
    app.listen(process.env.PORT, () => console.log("Server started"));
});