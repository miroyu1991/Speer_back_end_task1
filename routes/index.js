var express = require('express');
var router = express.Router();
const ObjectId = require('mongodb').ObjectId;

const md5 = require('blueimp-md5')
const {UserModel, ChatModel, TwitterModel} = require('../db/models')
// import { ResError, ResSuccess } from "../helper/responseMsg";

// filter unnecessary data
const filter = {password: 0, __v: 0} 

const ResError = {
  Unauthorized:{ 
      msg: "Unauthorized",
      code: 401
  },
  NotFound:{ 
      msg: "Not Found",
      code: 404
  },
  Conflict:{ 
      msg: "Conflict",
      code: 409
  },
  InternalServerError:{ 
      msg: "Internal Server Error",
      code: 500
  },
}

const ResSuccess = {
  success: {
      msg: "Success",
      code: 200
  }
}

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/register', function (req, res) {
  try{
    const {username, password, type} = req.body

    UserModel.findOne({username}, function (err, user) {
  
      if(user) {
  
        res.send(ResError.Conflict)
  
      } else {
  
        new UserModel({username, type, password:md5(password)}).save(function (error, user) {
  
          res.cookie('userid', user._id, {maxAge: 1000*60*60*24})
          const data = {username, type, _id: user._id}
          res.send({code: ResSuccess.success.code, data})
        })
      }
    })
  }catch{
    res.send(ResError.InternalServerError)
  }
  
})

router.post('/login', function (req, res) {
  try{
    const {username, password} = req.body
    UserModel.findOne({username, password:md5(password)}, filter, function (err, user) {
      if(user) {
        res.cookie('userid', user._id, {maxAge: 1000*60*60*24})

        res.send({code: ResSuccess.success.code, data: user})
      } else {
        res.send(ResError.Unauthorized)
      }
    })
  }catch{
    res.send(ResError.InternalServerError)
  }
})

router.post('/logout', function (req, res) {
  try{
    res.clearCookie('userid')
    res.send({code: ResSuccess.success.code, msg: "Logout"})
  }catch{
    res.send(ResError.InternalServerError)
  }
})


//get all users
router.get('/userlist', function (req, res) {
  try{
    UserModel.find({}, filter, function (error, users) {
      res.send({code: 0, data: users})
    })
  }catch{
    res.send(ResError.InternalServerError)
  }
  
})
//create a new twitter
router.post('/twitter/create', function (req, res) {
  try{
      const userid = req.cookies.userid
      if(!userid) {
        return res.send(ResError.Unauthorized)
      }else{
          const {content, retwitterId} = req.body
          const tid = TwitterModel.findOne({_id: retwitterId})
          if(tid){
            new TwitterModel({uid: userid, content, create_time: Date.now(), retwitterId: retwitterId}).save(function (error, data) {
              res.send({code: ResSuccess.success.code, data: data})
            })
          }else{
            new TwitterModel({uid: userid, content, create_time: Date.now()}).save(function (error, data) {
              res.send({code: ResSuccess.success.code, data: data})
            })
          }          
      }
  }catch{
      res.send(ResError.InternalServerError)
  }
})

//update a twitter
router.post('/twitter/update', function (req, res) {
  try{
      const userid = req.cookies.userid
      if(!userid) {
        return res.send(ResError.Unauthorized)
      }
      const {twitterId, content} = req.body
      TwitterModel.findOneAndUpdate({_id: twitterId }, {content: content}, function (error, oldTwitter) {
        if(!oldTwitter) {
          res.send(ResError.NotFound)
        } else {
          const { _id, uid, create_time, likeList, retwitterId } = oldTwitter
          const data = Object.assign({ _id, uid, create_time, likeList, retwitterId}, {content: content})
          res.send({code: ResSuccess.success, data: data})
        }
      })
  }catch{
      res.send(ResError.InternalServerError)
  }
})

//find a twitter
router.get('/twitter/find-one', function (req, res) {
  try{
      const { twitterId } = req.body
      TwitterModel.findOne({_id: twitterId}, function (error, twitter) {
        if(!twitter) {
          res.send(ResError.NotFound)
        } else {
          res.send({code: ResSuccess.success.code, data: twitter})
        }
      })
  }catch{
      res.send(ResError.InternalServerError)
  }
})

//find all twitter
router.get('/twitter/find-all', function (req, res) {
  try{
      TwitterModel.find(function (error, twitters) {
        if(!twitters) {
          res.send(ResError.NotFound)
        } else {
          res.send({code: ResSuccess.success.code, data: twitters})
        }
      })
  }catch{
      res.send(ResError.InternalServerError)
  }
})

//delete a twitter
router.delete('/twitter/delete', function (req, res) {
  try{
    const { twitterId } = req.body
    TwitterModel.deleteOne({_id: twitterId}, function (error, twitter) {
      if(!twitter) {
        res.send(ResError.NotFound)
      } else {
        res.send({code: ResSuccess.success.code, data: twitter})
      }
    })
  }catch{
      res.send(ResError.InternalServerError)
  }
})

//Chat to a user
router.post('/chat/create', function (req, res) {
  try{
      const userid = req.cookies.userid
      if(!userid) {
        return res.send(ResError.Unauthorized)
      }else{
          const {content, targetId} = req.body
          UserModel.findOne({_id: targetId}, function (error, target) {
            if(!target) {
              res.send(ResError.NotFound)
            } else {

              new ChatModel({from: userid, to: targetId, content, create_time: Date.now()}).save(function (error, data) {
                res.send({code: ResSuccess.success.code, data: data})
              })
            }
          })      
      }
  }catch{
      res.send(ResError.InternalServerError)
  }
})


//find all chat
router.get('/chat/find-all', function (req, res) {
  try{
      const userid = req.cookies.userid
      if(!userid) {
        return res.send(ResError.Unauthorized)
      }

      UserModel.find(function (err, userDocs) {
        const users = userDocs.reduce((users, user) => {
        users[user._id] = {username: user.username, header: user.header}
        return users
      } , {})
      
        ChatModel.find({'$or': [{from: userid}, {to: userid}]}, filter, function (error, chatMsgs) {
          res.send({code: ResSuccess.success.code, data: {users, chatMsgs}})
        })
      })
  }catch{
      res.send(ResError.InternalServerError)
  }
})
module.exports = router;