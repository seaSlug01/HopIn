const express = require("express");
const app = express();
const router = express.Router();
const path = require("path");
const fs = require("fs");
const multer  = require('multer')
const upload = multer({dest: "uploads/files/"})
const iconvlite  = require("iconv-lite");
const { decodeNonEnglishName, createUserDirectory, saveFile, srtToVtt, fileUpload } =  require("../controllers/utils.js");
iconvlite.skipDecodeWarning = true;

app.use(express.urlencoded({ extended: true }))
app.use(express.json({ limit: '50mb' }));



// const { readdirSync, rmSync } = require('fs');

router.delete("/deleteTempUserFiles/:userId", (req, res) => {
    let userDirectory;

    if(!fs.existsSync(path.join(__dirname, `../uploads/files/tmp-userFiles-${req.params.userId}`))) return;

    userDirectory = path.join(__dirname, `../uploads/files/tmp-userFiles-${req.params.userId}`);

    // fs.readdirSync(userDirectory).forEach(file => fs.rmSync(`${userDirectory}/${file}`))
    fs.rmdirSync(userDirectory, {recursive: true})
})

router.delete("/testDelete");

router.get("/files/tmp-userFiles:userId/:fileName", async (req, res) => {
    res.sendFile(path.join(__dirname, `../uploads/files/tmp-userFiles${req.params.userId}/${req.params.fileName}`))
});

router.post("/dropzone/single", upload.single("file"), async (req, res) => {
    // You only have access to the file through multer or some other middleware
    if(!req.file) {
        console.log("No file uploaded with ajax request");
        return res.sendStatus(400)
    }
    
    
    const file = req.file;
    file.originalname = decodeNonEnglishName(file.originalname)

    req.file.originalname = iconvlite.decode(file.originalname, "utf-8");
    const userDirectory = createUserDirectory(req.session.user._id);
    const pathToImage = saveFile(res, req.file, userDirectory);
    

    res.json({success: true, data: {...file, path: pathToImage } });
});

router.post("/dropzone/post", upload.any("files", 4), async (req, res) => {
    if(!req.files) {
        return res.sendStatus(400);
    }

    const type = req.files[0].mimetype.split("/")[0];
    if(!req.files.every(file => file.mimetype.split("/")[0] === type)) {
        // forbidden since files are not of the same type
        return res.sendStatus(403);
    }

    try {
        const userDirectory = createUserDirectory(req.session.user._id);
        for(let file of req.files) {
            file.originalname = decodeNonEnglishName(file.originalname)
            const pathToImage = saveFile(res, file, userDirectory);
            file.path = pathToImage;
        }
        
        res.status(200).send(req.files);

    } catch(error) {
        console.log(error);
        res.sendStatus(500);
    }
})


router.post("/dropzone/multiple", upload.any('files', 12), async (req, res) => {
    // but the thing is, i'm not uploading multiple files at once
    // I've had some problems with dropzone parallel upload
    // so in reality dropzone uploads operates on multiple file upload, one by one
    if(!req.files) {
        console.log("No file uploaded with ajax request");
        return res.sendStatus(400)
    }
    try {
        const userDirectory = createUserDirectory(req.session.user._id);
        for(let file of req.files) {
            file.originalname = decodeNonEnglishName(file.originalname)
            const pathToImage = saveFile(res, file, userDirectory);
            file.path = pathToImage;
        }
        
        res.status(200).send(req.files);
    } catch(error) {
        console.log(error);
        res.sendStatus(500);
    }
});


router.post("/cropper", upload.single("file"), async (req, res, next) => {
    if(!req.file) {
        console.log("No file uploaded with ajax request");
        return res.sendStatus(400)
    }

    try {
        const file = req.file;
        const userDirectory = createUserDirectory(req.session.user._id);
        const pathToImage = saveFile(res, file, userDirectory);
        

        res.status(200).send({...file, path: pathToImage });
    } catch(error) { 
        console.log(error);
        res.sendStatus(500);
    }
});

router.post("/dropzone/subtitles", upload.single("file"), async (req, res, next) => {
    if(!req.file) {
        console.log("No file uploaded with ajax request");
        return res.sendStatus(400)
    }

    try {
        const subs = await srtToVtt(req, res);
        res.status(201).send({subs})
    } catch(error) {
        console.log(error);
        res.status(500).send("bummer")
    }
});


module.exports = router;