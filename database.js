require('dotenv').config();
const mongoose = require('mongoose');
mongoose.set('useNewUrlParser', true);
mongoose.set('useUnifiedTopology', true);
mongoose.set('useFindAndModify', false);
// mongoose.set('useUnifiedTopology', true) // Commented out since newer versions have it by default
mongoose.set('useCreateIndex', true);

class Database {
  constructor() {
    this.connect();
  }

  connect() {
    mongoose
      .connect(
        process.env.MONGO_URI
      )
      .then(() => {
        console.log('Database connection enstablished');
      })
      .catch(err => {
        console.log('database connection failed: '.toUpperCase() + err.message);
      });
  }
}

module.exports = new Database();
