const kafka = require("../utils/kafka.client.js");
const { getDocument } = require("../utils/elasticsearch.js");
const { notificationService } = require("../services");
const consumer = kafka.consumer({
  groupId: `librarymanagementsystem-notification-service-dueDateReminder-group`,
});

const dueDateReminderListener = async () => {
  await consumer.connect();
  await consumer.subscribe({
    topic: "lending.loan.dueSoon",
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
          template: "dueDateReminder",
          metadata: {
            ...notice,
            actionDeepLink:
              "&#39;/member/account/loans/&#39; + this.dataSource.id",
            actionText: "&#39;Renew Loan&#39;",
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

        if (!true) {
          console.log("condition not met", "true");
          return;
        }

        const targetmember = mappedData.metadata.dataSource["member"];
        mappedData.to = targetmember;
        await notificationService.sendNotification(mappedData);
      } catch (error) {
        console.error("lending.loan.dueSoon ", error);
      }
    },
  });
};

module.exports = dueDateReminderListener;
