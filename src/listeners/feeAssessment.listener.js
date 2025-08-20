const kafka = require("../utils/kafka.client.js");
const { getDocument } = require("../utils/elasticsearch.js");
const { notificationService } = require("../services");
const consumer = kafka.consumer({
  groupId: `librarymanagementsystem-notification-service-feeAssessment-group`,
});

const feeAssessmentListener = async () => {
  await consumer.connect();
  await consumer.subscribe({
    topic: "payment.fee.statusChanged",
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
          types: ["email"],
          isStored: true,
          template: "feeAssessment",
          metadata: {
            ...notice,
            actionDeepLink:
              "&#39;/member/account/fees/&#39; + this.dataSource.id",
            actionText: "&#39;Pay Fee Now&#39;",
          },
        };

        const dataViewId = notice.id;
        const dataSource = await getDocument(
          "librarymanagementsystem_feeAssessmentNotificationView",
          dataViewId,
        );

        this.dataSource = dataSource.source;
        mappedData.metadata = {
          ...mappedData.metadata,
          dataSource: dataSource.source,
        };

        if (!(this.dataSource.status === "unpaid")) {
          console.log(
            "condition not met",
            "this.dataSource.status === &#39;unpaid&#39;",
          );
          return;
        }

        const targetmember = mappedData.metadata.dataSource["member"];
        mappedData.to = targetmember;
        await notificationService.sendNotification(mappedData);
      } catch (error) {
        console.error("payment.fee.statusChanged ", error);
      }
    },
  });
};

module.exports = feeAssessmentListener;
