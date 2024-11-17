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
let Excercise = mongoose.model('Exercise', exerciseSchema);

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
            let newExercise = new Excercise({ username: userResult.username, description: inputDescription, duration: duration, date: checkDate });

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
            //let updateUser = { description: newExercise.description, duration: newExercise.duration, date: newExercise.date };
            //User.findByIdAndUpdate(userResult._id, { $push: { log: updateUser } }, { new: true })
            //    .then((result) => {
            //        console.log(`successfully update user log: ${result}`);

            //        let exerciseRes = {};
            //        exerciseRes['_id'] = result._id;
            //        exerciseRes['username'] = result.username;
            //        exerciseRes['description'] = result.description;
            //        exerciseRes['duration'] = result.duration;
            //        exerciseRes['date'] = result.date;

            //        res.json(exerciseRes);
            //    })
            //    .catch((err) => { console.log(`failed update user log: ${err}`) });
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

function checkIsDateValid(dateString) {
    return new Date(dateString) != "Invalid Date";
}

//get all exercise log
app.get('/api/users/:_id/logs', (req, res) => {
    let from = req.query.from;
    let to = req.query.to;
    let limit = req.query.limit;

    let userId = req.params._id;

    //console.log(`${checkIsDateValid(from)}`);

    //User.find({ _id: userId,log:log.body })
    //    .then((userResult) => {
    //        console.log(`successfully get all exercise log: \n${userResult}`);

    //        let exerciseRes = {};
    //        exerciseRes['_id'] = userResult._id;
    //        exerciseRes['count'] = userResult.log.length;
    //        exerciseRes['log'] = userResult.log;

    //        res.json(exerciseRes);
    //    })
    //    .catch((err) => { console.log(`Failed to get all exercise log ${userId}`) });
    User.findById(userId)
        .then((userResult) => {
            //userResult.log.forEach((log) => {
            //    console.log(`successfully get all exercise log: ${log.date}\n`)
            //    if (log.date > from && log.date < to) filteredLog.push(log);
            //});

            let exerciseRes = {};
            exerciseRes['_id'] = userResult._id;
            exerciseRes['count'] = userResult.log.length;
            exerciseRes['log'] = userResult.log;

            res.json(exerciseRes);
        })
        .catch((err) => { console.log(`Failed to get all exercise log ${userId}`) });
});

const listener = app.listen(process.env.PORT || 3000, () => {
    console.log('Your app is listening on port ' + listener.address().port)
})
