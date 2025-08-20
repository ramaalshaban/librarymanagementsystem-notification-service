const kafka = require("../utils/kafka.client.js");
const { getDocument } = require("../utils/elasticsearch.js");
const { notificationService } = require("../services");
const consumer = kafka.consumer({
  groupId: `librarymanagementsystem-notification-service-issueEscalationUpdate-group`,
});

const issueEscalationUpdateListener = async () => {
  await consumer.connect();
  await consumer.subscribe({
    topic: "adminOps.issueEscalation.statusChanged",
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
          template: "issueEscalationUpdate",
          metadata: {
            ...notice,
            actionDeepLink:
              "&#39;/member/account/issues/&#39; + this.dataSource.id",
            actionText: "&#39;View Issue&#39;",
          },
        };

        const dataViewId = notice.id;
        const dataSource = await getDocument(
          "librarymanagementsystem_issueEscalationNotificationView",
          dataViewId,
        );

        this.dataSource = dataSource.source;
        mappedData.metadata = {
          ...mappedData.metadata,
          dataSource: dataSource.source,
        };

        if (
          !["assigned", "inProgress", "resolved", "closed"].includes(
            this.dataSource.status,
          )
        ) {
          console.log(
            "condition not met",
            "[&#39;assigned&#39;,&#39;inProgress&#39;,&#39;resolved&#39;,&#39;closed&#39;].includes(this.dataSource.status)",
          );
          return;
        }

        const targetraisedByUser =
          mappedData.metadata.dataSource["raisedByUser"];
        mappedData.to = targetraisedByUser;
        await notificationService.sendNotification(mappedData);

        const targetassignedToUser =
          mappedData.metadata.dataSource["assignedToUser"];
        mappedData.to = targetassignedToUser;
        await notificationService.sendNotification(mappedData);
      } catch (error) {
        console.error("adminOps.issueEscalation.statusChanged ", error);
      }
    },
  });
};

module.exports = issueEscalationUpdateListener;
