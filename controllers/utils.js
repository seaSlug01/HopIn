const path = require("path");
const fs = require("fs");
const cloudinary = require("cloudinary").v2;
const {Storage} = require("@google-cloud/storage");
const iconvlite  = require("iconv-lite");
const srt2vtt = require('srt-to-vtt')


const gc = new Storage({
  projectId: "hopin-372300",
  keyFilename: "hopin-372300-aada8aad0406.json"
})

const googleCloudBucket = gc.bucket("hopin-372300_bucket");

async function uploadToGoogleCloudBucket(filePath, goBack) {
  let gcs = googleCloudBucket;
  const uploadResponse = await gcs.upload(path.join(__dirname, `${goBack}${filePath}`));
  const uploadedFilename = uploadResponse[0].metadata.name;
  const gcFile = await gcs.file(uploadedFilename);
  const signedUrl = await gcFile.getSignedUrl({
    action: 'read',
    expires: '03-09-2491'
  })
  return  signedUrl[0];
}

function directoryPath(filePath, goBack) {
  return path.join(__dirname, `${goBack}${filePath}`);
}


function createCloudinarySignature() {
  

    var file='https://upload.wikimedia.org/wikipedia/commons/b/b1/VAN_CAT.png';

  var curl_command = 'curl -d "file=' + file + 
    '&api_key=323127161127519&eager=w_400,h_300,c_pad|w_260,h_200,c_crop&public_id=sample_image' + 
    '&timestamp=' + timestamp +
    '&signature=' + signature +
    '" -X POST http://api.cloudinary.com/v1_1/carl/image/upload';
}

const fileUpload = async (filePath, goBack = "", options) => {
  try {

    const timestamp = Math.round((new Date).getTime() / 1000);

    var signature = cloudinary.utils.api_sign_request({
      timestamp: timestamp,
      eager: 'w_400,h_300,c_pad|w_260,h_200,c_crop',
      public_id: 'sample_image'}, process.env.API_SECRET);


    const response = await cloudinary.uploader.upload(directoryPath(filePath, goBack), {
      ...options,
      use_fileName: true,
      folder: "HopIn",
      signature
    });

    return response;
  } catch(error) {
    console.log(error);
  }
}

function decodeNonEnglishName(name) {
  return iconvlite.decode(name, "utf-8");
}

// saving files

const createUserDirectory = (userId) => {
  const currentUserDirForFiles = `/uploads/files/tmp-userFiles-${userId}`;

  // create a folder dir for current users stored (temp) files if it doesn't exist
  // C:\Users\Kwstas\Desktop\projects\NodeJS\twitterClone\routes -> Current directory
  if(!fs.existsSync(path.join(__dirname, `../${currentUserDirForFiles}`))) {
      fs.mkdirSync(path.join(__dirname, `../${currentUserDirForFiles}`), { recursive: true });
  }

  return currentUserDirForFiles;
}

const getExt = (fileName) => {
  return fileName.split(".").pop();
}

const saveFile = (res, file, dir) => {
  const ext = getExt(file.originalname)

  const filePath = `${dir}/${file.filename}-${file.originalname.split(".")[0]}.${ext}`
  var tempPath = file.path;
  var targetPath = path.join(__dirname, `../${filePath}`);

  // replace path (uploads/files/ that comes from us declaring it in dropbox)
  // with the completed path (one that holds the custom user folder as well as the file name + extension)
  fs.rename(tempPath, targetPath, error => {
      if(error !== null) {
          console.log(error)
          return res.sendStatus((400))
      }
  })

  return filePath;
}

function removeFile(filePath) {
  fs.unlink(filePath, function(err) {
    if(err && err.code == 'ENOENT') {
        // file doens't exist
        console.info("File doesn't exist, won't remove it.");
    } else if (err) {
        // other errors, e.g. maybe we don't have enough permission
        console.error("Error occurred while trying to remove file");
    } else {
        console.info(`removed`);
    }
  });
}

const srtToVtt = async (req, res) => {
  const SrtFile = req.file;
  const ext = getExt(SrtFile.originalname)
  const isSrt = ext.toLowerCase() === "srt";

  if(!isSrt) return;

  const convertToVTT = await fs.createReadStream(SrtFile.path)
    .pipe(srt2vtt())
    .pipe(fs.createWriteStream(`${SrtFile.originalname.split(".").slice(0, SrtFile.originalname.split(".").length - 1)}.vtt`))

  const dir = createUserDirectory(req.session.user._id)
  const VttFilePath = `${dir}/${SrtFile.filename}-${convertToVTT.path}`
  // current temp path is at the root level, we wanna add it
  // to the users tmp-files folders so we can mass delete them any time we want
  // ex: when logging out / when uploading the post, this path won't be needed
  // the srt file will go to a google cloud bucket
  var tempPath = convertToVTT.path;
  var targetPath = path.join(__dirname, `../${VttFilePath}`);


  fs.rename(tempPath, targetPath, error => {
      if(error !== null) {
          console.log(error)
          return res.sendStatus((400))
      }
  })

  removeFile(SrtFile.path)

  return VttFilePath
}


module.exports = { directoryPath, fileUpload, googleCloudBucket, uploadToGoogleCloudBucket, decodeNonEnglishName, createUserDirectory, saveFile, getExt, srtToVtt }