const asyncHandler = require("express-async-handler");
const Message = require("../models/messageModal");
const User = require("../models/userModal");
const Chat = require("../models/chatModal");
const testModel = require('../models/testModal')
const mongoose = require('mongoose')
const mongodb = require('mongodb');
const Grid = require('gridfs-stream');
const fs = require('fs');
const MultiStream = require('multistream')

let gfs;
let bucket 

mongoose.connection.on("connected", () => {
  let db = mongoose.connections[0].db;
  gfs = Grid(db, mongoose.mongo);
  gfs.collection('uploads');
  bucket = new mongodb.GridFSBucket(db, {
    bucketName: 'uploads'
  });
})
// let bucket = new mongodb.GridFSBucket(mongoose.connections[0].db, {
//   bucketName: 'uploads'
// });


//@description     Get all Messages
//@route           GET /api/Message/:chatId
//@access          Protected
const allMessages = asyncHandler(async (req, res) => {
  try {
    const messages = await Message.find({ chat: req.params.chatId })
      .populate("sender", "name pic email")
      .populate("chat");
    res.json(messages);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

//@description     Create New Message
//@route           POST /api/Message/
//@access          Protected

const sendMessage = asyncHandler(async (req, res) => {
    const { content, chatId } = req.body;
    if (!content || !chatId) {
      console.log("Invalid data passed into request");
      return res.sendStatus(400).json({data: "Invalid data passed into request"});
    }

    var newMessage = {
      sender: req.user._id,
      content: content,
      chat: chatId,
    };

    try {
      var message = await Message.create(newMessage);

      message = await message.populate("sender", "name pic")
      message = await message.populate("chat") 
      message = await User.populate(message, {
        path: "chat.users",
        select: "name pic email",
      });

      await Chat.findByIdAndUpdate(req.body.chatId, { latestMessage: message });

      res.json(message);
    } catch (error) {
      res.status(400);
      throw new Error(error.message);
    }
});
//@description     Downlaod audio image pdf files
//@route           GET /api/Message/downlaodFile
//@access          Protected

const downloadFile = asyncHandler(async (req, res) => {
  const filename = req.params.name
  gfs.files.findOne({ filename: filename }, (err, file) => {
    // Check if file
    if (!file || file.length === 0) {
      return res.status(404).json({
        err: 'No file exists'
      });
    }
    // File exists
    //   bucket.openDownloadStreamByName(req.params.name).
    //   pipe(fs.createWriteStream(req.params.name)).
    //   on('error', function(error) {
    //     throw new Error(error)
    //   }).
    //   on('finish', function() {
    //     console.log('done!');
    //     process.exit(0);
    //   });
    //   return res.status(200).json(file);
    // });
    contentType=file.contentType;
    //setting response header
    res.set({
      "Accept-Ranges": "bytes",
      "Content-Disposition": `attachment; filename=${filename}`,
      "Content-Type": `${contentType}`
    });
    
    const readstream = bucket.openDownloadStreamByName(filename);
    readstream.pipe(res);
  })
})
//@description     Get all audio files
//@route           GET /api/Message/audioFiles
//@access          Protected

const getAllAudio = asyncHandler(async (req, res) => {
  try
  {
    let readstream = [];
    let stream;
    gfs.files.find().toArray((err, files) => {
      // Check if files
      if (!files || files.length === 0) {
        res.json({ files: "No fies found" });
      } else {
        
          files.map(file => {
          if (
            file.contentType === 'audio/mp3' ||
            file.contentType === 'video/mp4'
          ) {
            file.isAudio = true;
          } else {
            file.isAudio = false;
          }
            if (file.filename.endsWith('mp3')) {
              res.header({
                'Content-Type': file.contentType,
                "Accept-Ranges": "bytes",
                "Content-Disposition": `attachment; filename=${file.filename}`,
              })
              stream = bucket.openDownloadStreamByName(file.filename)
              stream.pipe(res)
              readstream.push(stream, { name: file.filename });
            }
          })
          new MultiStream(stream).pipe(process.stdout)
      }
    })
  }
  catch (err) {
    res.status(400);
    throw new Error(err.message);
  }
})

const uploadVoice = asyncHandler(
async (req, res) => {
const file = req.file
  if (!file) {
    const error = new Error('Please upload a file')
    error.httpStatusCode = 400
    return next(error)
  }
    res.send(file)
})

module.exports = { allMessages, sendMessage, downloadFile, getAllAudio, uploadVoice };