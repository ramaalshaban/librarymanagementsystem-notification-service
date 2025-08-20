const kafkaPublish = require("../utils/publisher");

const sendPushNotification = async (notification) => {
  try {
    console.log("sending push notification", notification);
    await kafkaPublish(
      `librarymanagementsystem-notification-service-notification-push`,
      notification,
    );
  } catch (error) {
    console.error("Error publishing push notification", error);
  }
};
module.exports = sendPushNotification;
