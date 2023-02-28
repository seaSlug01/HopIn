const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const NotificationSchema = new Schema(
  {
    userTo: { type: Schema.Types.ObjectId, ref: 'User' },
    userFrom: { type: Schema.Types.ObjectId, ref: 'User' },
    notificationType: String,
    opened: { type: Boolean, default: false },
    entityId: Schema.Types.ObjectId
  },
  { timestamps: true }
);


NotificationSchema.statics.insertNotification = async (userTo, userFrom, notificationType, entityId) => {
  console.log(userTo.toString() === userFrom.toString(), userTo, userFrom)
  if(userTo.toString() === userFrom.toString()) return;
  const data = { userTo, userFrom, notificationType, entityId }

  await Notification.deleteOne(data).catch(err => console.log(err))
  return Notification.create(data).catch(err => console.log(err))
}

NotificationSchema.statics.deleteNotification = async (userTo, userFrom, notificationType, entityId) => {
  return Notification.deleteOne({userTo, userFrom, notificationType, entityId}).catch(err => console.log(err));
}

const Notification = mongoose.model('Notification', NotificationSchema);
module.exports = Notification;
