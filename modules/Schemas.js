require("dotenv").config();
const mongoose = require("mongoose");

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const feedbackSchema = new mongoose.Schema({
  chatId: {
    type: Number,
    required: true,
    unique: true,
  },
  feedback: {
    type: String,
    required: true,
    minlength: 10,
    maxlength: 200,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const Feedback = mongoose.model("Feedback", feedbackSchema);

const historySchema = new mongoose.Schema({
  chatId: {
    type: Number,
    required: true,
    unique: true,
  },
  command: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const History = mongoose.model("History", historySchema);

const userSchema = new mongoose.Schema({
  chatId: {
    type: String,
    required: true,
    unique: true,
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50,
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true,
  },
});

const User = mongoose.model("User", userSchema);

const cryptoSchema = new mongoose.Schema({
  chatId: {
    type: String,
    required: true,
    unique: true,
  },
  cryptoSymbol: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true,
  },
});

const Crypto = mongoose.model("Crypto", cryptoSchema);

const crossoverSchema = new mongoose.Schema({
  cryptocurrency: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    required: true,
  },
  chatId: {
    type: Number,
    required: true,
  },
});
const Crossover = mongoose.model("Crossover", crossoverSchema);

const alertSchema = new mongoose.Schema({
  symbol: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  type: {
    type: String,
    enum: ["above", "below"],
    required: true,
  },
  chatId: {
    type: Number,
    required: true,
  },
});

const Alert = mongoose.model("Alert", alertSchema);

module.exports = {
  Feedback,
  History,
  User,
  Crypto,
  Crossover,
  Alert,
};
