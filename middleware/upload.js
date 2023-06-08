const path = require('path')
const multer = require('multer')

const Storage= multer.diskStorage({
        destination:'./public/uploads',
        filename: (req, file, cb)=> {
            cb(null, Date.now()+path.extname(file.originalname))
        }
    })
    
    const upload = multer({storage: Storage})

module.exports = upload