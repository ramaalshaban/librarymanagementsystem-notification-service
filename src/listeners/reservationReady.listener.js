const kafka = require("../utils/kafka.client.js");
const { getDocument } = require("../utils/elasticsearch.js");
const { notificationService } = require("../services");
const consumer = kafka.consumer({
  groupId: `librarymanagementsystem-notification-service-reservationReady-group`,
});

const reservationReadyListener = async () => {
  await consumer.connect();
  await consumer.subscribe({
    topic: "lending.reservation.statusChanged",
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
          template: "reservationReady",
          metadata: {
            ...notice,
            actionDeepLink:
              "&#39;/member/account/reservations/&#39; + this.dataSource.id",
            actionText: "&#39;View Reservation&#39;",
          },
        };

        const dataViewId = notice.id;
        const dataSource = await getDocument(
          "librarymanagementsystem_reservationNotificationView",
          dataViewId,
        );

        this.dataSource = dataSource.source;
        mappedData.metadata = {
          ...mappedData.metadata,
          dataSource: dataSource.source,
        };

        if (
          !(
            this.dataSource.status === "fulfilled" &&
            !!this.dataSource.activationNotifiedAt
          )
        ) {
          console.log(
            "condition not met",
            "this.dataSource.status === &#39;fulfilled&#39; &amp;&amp; !!this.dataSource.activationNotifiedAt",
          );
          return;
        }

        const targetmember = mappedData.metadata.dataSource["member"];
        mappedData.to = targetmember;
        await notificationService.sendNotification(mappedData);
      } catch (error) {
        console.error("lending.reservation.statusChanged ", error);
      }
    },
  });
};

module.exports = reservationReadyListener;
