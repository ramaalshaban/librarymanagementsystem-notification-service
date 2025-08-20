const kafka = require("../utils/kafka.client.js");
const { getDocument } = require("../utils/elasticsearch.js");
const { notificationService } = require("../services");
const consumer = kafka.consumer({
  groupId: `librarymanagementsystem-notification-service-personalizedRecommendation-group`,
});

const personalizedRecommendationListener = async () => {
  await consumer.connect();
  await consumer.subscribe({
    topic: "reviewEngagement.recommendation.created",
    fromBeginning: true,
  });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        console.log(
          `Received message on ${topic}: ${message.value.toString()}`,
        );

        const notice = JSON.parse(message.value.toString());

        const mappedData = {
          types: ["push"],
          isStored: true,
          template: "personalizedRecommendation",
          metadata: {
            ...notice,
            actionDeepLink:
              "&#39;/member/account/recommendations/&#39; + this.dataSource.id",
            actionText: "&#39;See Recommendations&#39;",
          },
        };

        const dataViewId = notice.id;
        const dataSource = await getDocument(
          "librarymanagementsystem_personalizedRecommendationView",
          dataViewId,
        );

        this.dataSource = dataSource.source;
        mappedData.metadata = {
          ...mappedData.metadata,
          dataSource: dataSource.source,
        };

        if (!true) {
          console.log("condition not met", "true");
          return;
        }

        const targetuser = mappedData.metadata.dataSource["user"];
        mappedData.to = targetuser;
        await notificationService.sendNotification(mappedData);
      } catch (error) {
        console.error("reviewEngagement.recommendation.created ", error);
      }
    },
  });
};

module.exports = personalizedRecommendationListener;
