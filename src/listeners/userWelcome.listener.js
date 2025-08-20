const kafka = require("../utils/kafka.client.js");
const { getDocument } = require("../utils/elasticsearch.js");
const { notificationService } = require("../services");
const consumer = kafka.consumer({
  groupId: `librarymanagementsystem-notification-service-userWelcome-group`,
});

const userWelcomeListener = async () => {
  await consumer.connect();
  await consumer.subscribe({
    topic: "auth.user.created",
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
          template: "userWelcome",
          metadata: {
            ...notice,
            actionDeepLink: "&#39;/member/onboarding&#39;",
            actionText: "&#39;Get Started&#39;",
          },
        };

        const dataViewId = notice.id;
        const dataSource = await getDocument(
          "librarymanagementsystem_memberProfileView",
          dataViewId,
        );

        this.dataSource = dataSource.source;
        mappedData.metadata = {
          ...mappedData.metadata,
          dataSource: dataSource.source,
        };

        if (
          !(this.dataSource.roles && this.dataSource.roles.includes("member"))
        ) {
          console.log(
            "condition not met",
            "this.dataSource.roles &amp;&amp; this.dataSource.roles.includes(&#39;member&#39;)",
          );
          return;
        }

        const targetmember = mappedData.metadata.dataSource[""];
        mappedData.to = targetmember;
        await notificationService.sendNotification(mappedData);
      } catch (error) {
        console.error("auth.user.created ", error);
      }
    },
  });
};

module.exports = userWelcomeListener;
