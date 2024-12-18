const path = require("path")
const fs = require("fs")
const cloudinary = require("cloudinary").v2
const { Storage } = require("@google-cloud/storage")
const iconvlite = require("iconv-lite")
const srt2vtt = require("srt-to-vtt")

const gc = new Storage({
  projectId: "hopin-372300",
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
})

const googleCloudBucket = gc.bucket("hopin-372300_bucket")

async function uploadToGoogleCloudBucket(filePath, goBack) {
  let gcs = googleCloudBucket
  const uploadResponse = await gcs.upload(
    path.join(__dirname, `${goBack}${filePath}`)
  )
  const uploadedFilename = uploadResponse[0].metadata.name
  const gcFile = await gcs.file(uploadedFilename)
  const signedUrl = await gcFile.getSignedUrl({
    action: "read",
    expires: "03-09-2491",
  })
  return signedUrl[0]
}

function directoryPath(filePath, goBack) {
  return path.join(__dirname, `${goBack}${filePath}`)
}

const fileUpload = async (filePath, goBack = "", options) => {
  try {
    const response = await cloudinary.uploader.upload(
      directoryPath(filePath, goBack),
      {
        ...options,
        use_fileName: true,
        folder: "HopIn",
      }
    )

    return response
  } catch (error) {
    console.log(error)
  }
}

function decodeNonEnglishName(name) {
  return iconvlite.decode(name, "utf-8")
}

// saving files

const createUserDirectory = (userId) => {
  const currentUserDirForFiles = `/uploads/files/tmp-userFiles-${userId}`

  // create a folder dir for current users stored (temp) files if it doesn't exist
  // C:\Users\Kwstas\Desktop\projects\NodeJS\twitterClone\routes -> Current directory
  if (!fs.existsSync(path.join(__dirname, `../${currentUserDirForFiles}`))) {
    fs.mkdirSync(path.join(__dirname, `../${currentUserDirForFiles}`), {
      recursive: true,
    })
  }

  return currentUserDirForFiles
}

const getExt = (fileName) => {
  return fileName.split(".").pop()
}

const saveFile = (res, file, dir) => {
  const ext = getExt(file.originalname)

  const filePath = `${dir}/${file.filename}-${
    file.originalname.split(".")[0]
  }.${ext}`
  var tempPath = file.path
  var targetPath = path.join(__dirname, `../${filePath}`)

  // replace path (uploads/files/ that comes from us declaring it in dropbox)
  // with the completed path (one that holds the custom user folder as well as the file name + extension)
  fs.rename(tempPath, targetPath, (error) => {
    if (error !== null) {
      console.log(error)
      return res.sendStatus(400)
    }
  })

  return filePath
}

function removeFile(filePath) {
  fs.unlink(filePath, function (err) {
    if (err && err.code == "ENOENT") {
      // file doens't exist
      console.info("File doesn't exist, won't remove it.")
    } else if (err) {
      // other errors, e.g. maybe we don't have enough permission
      console.error("Error occurred while trying to remove file")
    } else {
      console.info(`removed`)
    }
  })
}

async function removeFiles(paths, cd) {
  const deletePromise = paths.map((path) => removeFile(directoryPath(path, cd)))
  await Promise.all(deletePromise)
}

const srtToVtt = async (req, res) => {
  const SrtFile = req.file
  const ext = getExt(SrtFile.originalname)
  const isSrt = ext.toLowerCase() === "srt"

  if (!isSrt) return res.sendStatus(403)

  const convertToVTT = await fs
    .createReadStream(SrtFile.path)
    .pipe(srt2vtt())
    .pipe(
      fs.createWriteStream(
        `${SrtFile.originalname
          .split(".")
          .slice(0, SrtFile.originalname.split(".").length - 1)}.vtt`
      )
    )

  // commented out
  const dir = createUserDirectory(req.session.user._id)
  const VttFilePath = `${dir}/${SrtFile.filename}-${convertToVTT.path}`

  // current temp path is at the root level, we wanna add it
  // to the users tmp-files folders so we can mass delete them any time we want
  // ex: when logging out / when uploading the post, this path won't be needed
  // the srt file will go to a google cloud bucket

  // commented out
  var tempPath = convertToVTT.path
  var targetPath = path.join(__dirname, `../${VttFilePath}`)

  fs.rename(tempPath, targetPath, (error) => {
    if (error !== null) {
      console.log(error)
      return res.sendStatus(400)
    }
  })

  removeFile(SrtFile.path)

  return VttFilePath
}

module.exports = {
  directoryPath,
  fileUpload,
  googleCloudBucket,
  uploadToGoogleCloudBucket,
  decodeNonEnglishName,
  createUserDirectory,
  saveFile,
  getExt,
  srtToVtt,
  removeFile,
  removeFiles,
}
