const mongoose = require('mongoose')

mongoose.connect('mongodb://localhost:27017/twitter')

const conn = mongoose.connection

conn.on('connected', () => {
  console.log('db connect success!')
})

// User Schema 
const userSchema = mongoose.Schema({
  username: {type: String, required: true},
  password: {type: String, required: true}
})

const UserModel = mongoose.model('user', userSchema)
exports.UserModel = UserModel

// Chat Schema
const chatSchema = mongoose.Schema({
  from: {type: mongoose.ObjectId, required: true}, 
  to: {type: mongoose.ObjectId, required: true},
  content: {type: String, required: true},
  create_time: {type: Number}
})

const ChatModel = mongoose.model('chat', chatSchema)
exports.ChatModel = ChatModel


// Twitter Schema
const twitterSchema = mongoose.Schema({
  uid: {type: mongoose.ObjectId, required: true}, 
  content: {type: String, required: true},
  create_time: {type: Number},
  likeList: {type: [mongoose.ObjectId], default: []},
  retwitterId: {type: mongoose.ObjectId}
})
const TwitterModel = mongoose.model('twitter', twitterSchema)
exports.TwitterModel = TwitterModel
