const { GridFsStorage } = require('multer-gridfs-storage');
const crypto = require('crypto')
const path = require('path')

const storage = new GridFsStorage({
    url: 'mongodb://localhost:27017/chatApp',
    file: (req, file) => {
      return new Promise((resolve, reject) => {
          const fileInfo = {
            filename: file.originalname,
            bucketName: 'uploads'
          };
          resolve(fileInfo);
        });
    }
});
  
module.exports = storage