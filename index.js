const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()

//mongoDB setup
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI.toString());

//mongoDB schemas
let userSchema = new mongoose.Schema({
    username: String,
    log: [{
        type: mongoose.Schema.Types.Mixed,
        ref: 'Exercise'
    }]
});

let exerciseSchema = new mongoose.Schema({
    username: String,
    description: String,
    duration: Number,
    date: Date,
});

//mongoDB models
let User = mongoose.model('User', userSchema);
let Exercise = mongoose.model('Exercise', exerciseSchema);

//bodyparser setup
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/views/index.html')
});

// create new user
app.post('/api/users', (req, res) => {
    let inputUsername = req.body['username'];
    let newUser = new User({ username: inputUsername });

    newUser.save()
        .then((result) => {
            console.log(`Successfully created new user: ${result.username}`);
            let userId = User.findOne({ username: result.username });
            let createNewUserJSON = { username: result.username, _id: result._id };
            res.json(createNewUserJSON);
        })
        .catch((err) => { console.log(`Failed to create new user: ${err}`) })

    console.log(`create new user: ${inputUsername}`);
})

//create new exercise log
app.post('/api/users/:_id/exercises', (req, res) => {
    let inputUserId = req.params._id;
    let inputDescription = req.body['description'];
    let inputDuration = req.body['duration'];
    let inputDate = req.body['date']; // date is optional

    let checkDate = new Date(inputDate) == "Invalid Date" ? new Date().toDateString() : new Date(inputDate).toDateString();
    let duration = parseInt(inputDuration)
    let updateUser = { description: inputDescription, duration: duration, date: checkDate };

    User.findByIdAndUpdate(inputUserId, { $push: { log: updateUser } }, { new: true })
        .then((userResult) => {
            let newExercise = new Exercise({ username: userResult.username, description: inputDescription, duration: duration, date: checkDate });

            console.log(`successfully find username by id: ${userResult._id}`)

            newExercise.save()
                .then((exerciseResult) => {
                    console.log(`successfully save new exercise: ${exerciseResult._id}`)
                })
                .catch((err) => { console.log(`failed to save new exercise: ${err}`) });

            let exerciseRes = {};
            exerciseRes['_id'] = userResult._id;
            exerciseRes['username'] = userResult.username;
            exerciseRes['description'] = newExercise.description;
            exerciseRes['duration'] = newExercise.duration;
            exerciseRes['date'] = newExercise.date.toDateString();

            res.json(exerciseRes);
        })
        .catch((err) => { console.log(`failed to find and update username by id: ${err}`) });
});

//get all users
app.get('/api/users', (req, res) => {
    User.find()
        .then((result) => {
            console.log(`find all user ${result}`);
            res.json(result);
        })
        .catch((err) => { console.log(`Failed to find all user with ${result}`) });
});

//get user by id
app.get('/api/users/:_id', (req, res) => {
    let userId = req.params._id;
    User.findById(userId)
        .then((result) => {
            console.log(`find all user with ${userId}: ${result}`);
        })
        .catch((err) => { console.log(`Failed to find all user with ${userId}`) });
});

//get all exercise log
app.get('/api/users/:_id/logs', (req, res) => {
    let from = req.query.from;
    let to = req.query.to;
    let limit = req.query.limit;

    let userId = req.params._id;

    User.findById(userId)
        .then((userResult) => {
            let logResult = [];
            let dateObj = {};

            if (from) dateObj["$gte"] = new Date(from);
            if (to) dateObj["$lte"] = new Date(to);

            let filter = { username: userResult.username };
            if (from || to) filter.date = dateObj;

            const exercises = Exercise.find(filter).limit(+limit ?? 500)
                .then(exerciseResult => {
                    console.log(exerciseResult);
                    const log = exerciseResult.map(e => ({
                        description: e.description,
                        duration: e.duration,
                        date: e.date.toDateString()
                    }));

                    res.json({
                        username: userResult.username,
                        count: exerciseResult.length,
                        _id: userResult._id,
                        log: log
                    });
                })
                .catch(err => { console.log(`failed to show filtered exercise logs: ${err}`); });
        })
        .catch((err) => { console.log(`Failed to get all exercise log ${err}`) });
});

const listener = app.listen(process.env.PORT || 3000, () => {
    console.log('Your app is listening on port ' + listener.address().port)
})
