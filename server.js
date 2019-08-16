const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const shortid = require("shortid");
const cors = require("cors");

const mongoose = require("mongoose");

const URI =
  "mongodb+srv://name1000:76880A@cluster0-tzycp.mongodb.net/test?retryWrites=true&w=majority";
mongoose.connect(URI, { useNewUrlParser: true });

app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});
let Schema = mongoose.Schema;

let userSchema = new Schema({
  username: {
    type: String,
    required: true
  },
  exercise: [
    {
      description: String,
      duration: Number,
      date: String
    }
  ],
  _id :{
  type:String,
  default: shortid.generate
}
});

let User = mongoose.model("User", userSchema);

app.post("/api/exercise/new-user", (req, res) => {
  let name = req.body.username;
  console.log(name);
  let newUser = new User({ username: name, exercise: [] });
  newUser.save().then((data, err) => {
    if (err) {
      console.log(err);
      return;
    }
    res.send({
      name: data.username,
      _id: data["_id"]
    });
  });
});
app.get("/api/exercise/users", (req, res) => {
  User.find({}).then((data, err) => {
    if (err) console.log(err);
    const mapped = data.map(el => {
      return {
        username: el.username,
        _id: el["_id"]
      };
    });
    res.send(mapped);
  });
});
app.post("/api/exercise/add", (req, res) => {
  User.findOne({ _id: req.body.userId }).then((data, err) => {
    if (err) res.send(err);
    let date2 = Date.parse(req.body.date);
    if(isNaN(date2))
      {
        date2 = new Date();
      }
    console.log(typeof date2);
    date2 = date2.toUTCString();
    data.exercise.push({
      description: req.body.description,
      duration: req.body.duration,
      date: date2
    });
    data.save().then(() => {
      res.send(data);
    });
  });
});
app.get("/api/exercise/log", (req, res) => {
  //console.log(req.params);
  //console.log(req.query);
  const id = req.query.userId;
  const from = new Date(req.query.from);
  const to = new Date(req.query.to);
  const limit = req.query.limit;
  User.findOne({ _id: id }).then((data, err) => {
    //console.log(data, err);
    if (err) res.send(err);
    let exer = [...data.exercise];
    let count = exer.length;
    if (!isNaN(from) && !isNaN(to)) {
      exer = exer.filter(el => {
        let d = new Date(el.date);
        return d > from && d < to;
      });
    }
    if (limit) exer = exer.slice(0, limit);
    res.send({
      username: data.username,
      _id: id,
      exercise: exer,
      count: count
    });
  });
});
// Not found middleware
app.use((req, res, next) => {
  return next({ status: 404, message: "not found" });
});

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage;

  if (err.errors) {
    // mongoose validation error
    errCode = 400; // bad request
    const keys = Object.keys(err.errors);
    // report the first validation error
    errMessage = err.errors[keys[0]].message;
  } else {
    // generic or custom error
    errCode = err.status || 500;
    errMessage = err.message || "Internal Server Error";
  }
  res
    .status(errCode)
    .type("txt")
    .send(errMessage);
});

const listener = app.listen(process.env.PORT || 5500, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
