const express = require("express");
const {
  allMessages,
  sendMessage,
  downloadFile,
  getAllAudio,
  uploadVoice
} = require("../controllers/messageControllers");
const { protect } = require("../middleware/authMiddleware");
const multer = require('multer');
const storage = require('../config/gridfsStorage')
const upload2 = multer({ dest: './uploads/' })
const router = express.Router();
const upload = multer({ storage });  

router.route("/audioFiles").post( upload2.single('file'), uploadVoice).get(getAllAudio)
router.route("/:chatId").get(protect, allMessages);
router.route("/").post(upload.single('file'), protect, sendMessage);
router.get("/downloadFile/:name", downloadFile)



module.exports = router;