const kafka = require("../utils/kafka.client.js");
const { getDocument } = require("../utils/elasticsearch.js");
const { notificationService } = require("../services");
const consumer = kafka.consumer({
  groupId: `librarymanagementsystem-notification-service-manualStaffAlert-group`,
});

const manualStaffAlertListener = async () => {
  await consumer.connect();
  await consumer.subscribe({
    topic: "reviewEngagement.engagementEvent.staffManual",
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
          types: ["inApp"],
          isStored: true,
          template: "manualStaffAlert",
          metadata: {
            ...notice,
            actionDeepLink: "&#39;&#39;",
            actionText: "&#39;&#39;",
          },
        };

        const dataViewId = notice.id;
        const dataSource = await getDocument(
          "librarymanagementsystem_manualStaffAlertView",
          dataViewId,
        );

        this.dataSource = dataSource.source;
        mappedData.metadata = {
          ...mappedData.metadata,
          dataSource: dataSource.source,
        };

        if (
          !["librarian", "manager", "regionalAdmin"].includes(
            this.dataSource.user.roles && this.dataSource.user.roles[0],
          )
        ) {
          console.log(
            "condition not met",
            "[&#39;librarian&#39;,&#39;manager&#39;,&#39;regionalAdmin&#39;].includes(this.dataSource.user.roles &amp;&amp; this.dataSource.user.roles[0])",
          );
          return;
        }

        const targetuser = mappedData.metadata.dataSource["user"];
        mappedData.to = targetuser;
        await notificationService.sendNotification(mappedData);
      } catch (error) {
        console.error("reviewEngagement.engagementEvent.staffManual ", error);
      }
    },
  });
};

module.exports = manualStaffAlertListener;
