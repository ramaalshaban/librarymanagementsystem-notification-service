const kafka = require("../utils/kafka.client.js");
const { getDocument } = require("../utils/elasticsearch.js");
const { notificationService } = require("../services");
const consumer = kafka.consumer({
  groupId: `librarymanagementsystem-notification-service-overdueNotice-group`,
});

const overdueNoticeListener = async () => {
  await consumer.connect();
  await consumer.subscribe({
    topic: "lending.loan.statusChanged",
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
          template: "overdueNotice",
          metadata: {
            ...notice,
            actionDeepLink:
              "&#39;/member/account/loans/&#39; + this.dataSource.id",
            actionText: "&#39;Pay or Renew&#39;",
          },
        };

        const dataViewId = notice.id;
        const dataSource = await getDocument(
          "librarymanagementsystem_loanDueNoticeView",
          dataViewId,
        );

        this.dataSource = dataSource.source;
        mappedData.metadata = {
          ...mappedData.metadata,
          dataSource: dataSource.source,
        };

        if (!(this.dataSource.status === "overdue")) {
          console.log(
            "condition not met",
            "this.dataSource.status === &#39;overdue&#39;",
          );
          return;
        }

        const targetmember = mappedData.metadata.dataSource["member"];
        mappedData.to = targetmember;
        await notificationService.sendNotification(mappedData);
      } catch (error) {
        console.error("lending.loan.statusChanged ", error);
      }
    },
  });
};

module.exports = overdueNoticeListener;
