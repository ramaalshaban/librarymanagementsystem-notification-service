const { Kafka } = require("kafkajs");

const kafka = new Kafka({
  clientId: "librarymanagementsystem-notification-service",
  brokers: [process.env.KAFKA_URI || "kafka:9092"],
});

module.exports = kafka;
