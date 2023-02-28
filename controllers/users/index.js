const {fileUpload} = require("../utils");


const createEditUserObject = async (props) => {
    const { year, month, day, name, bio, location, website, canSeeMonthAndDay, canSeeYear, profilePic, coverPic, originalCover } = props;
    let splitName = name.trim().split(" ");
    let firstName = splitName[0];
    let lastName  = splitName[1] || "";

    if(splitName.length > 2) {
      lastName = splitName.pop();
      firstName = splitName.join(" ");   
    }

    var objectToBeSent = {
      firstName,
      lastName,
      bio,
      website,
      location
    }

    if(year) {
      // if year exists, that means everything else regarding the birthDate obj exist
      objectToBeSent.birthDate = {
        date: new Date(year, month, day),
        canSeeMonthAndDay,
        canSeeYear
      }
    }

    if(profilePic) {
        const resp = await fileUpload(profilePic, "../")
        objectToBeSent.profilePic = resp.secure_url;
    }

    
    if(coverPic && coverPic !== "") {
      const resp = await fileUpload(coverPic, "../")
      objectToBeSent.coverPic = resp.secure_url;
    } else {
      objectToBeSent.coverPic = originalCover;
    }

    return objectToBeSent;
}

module.exports = {createEditUserObject}

