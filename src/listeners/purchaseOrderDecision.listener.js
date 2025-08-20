const kafka = require("../utils/kafka.client.js");
const { getDocument } = require("../utils/elasticsearch.js");
const { notificationService } = require("../services");
const consumer = kafka.consumer({
  groupId: `librarymanagementsystem-notification-service-purchaseOrderDecision-group`,
});

const purchaseOrderDecisionListener = async () => {
  await consumer.connect();
  await consumer.subscribe({
    topic: "adminOps.branchPurchaseOrder.statusChanged",
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
          template: "purchaseOrderDecision",
          metadata: {
            ...notice,
            actionDeepLink:
              "&#39;/staff/purchase-orders/&#39; + this.dataSource.id",
            actionText: "&#39;Review Purchase Order&#39;",
          },
        };

        const dataViewId = notice.id;
        const dataSource = await getDocument(
          "librarymanagementsystem_purchaseOrderDecisionView",
          dataViewId,
        );

        this.dataSource = dataSource.source;
        mappedData.metadata = {
          ...mappedData.metadata,
          dataSource: dataSource.source,
        };

        if (!["approved", "rejected"].includes(this.dataSource.status)) {
          console.log(
            "condition not met",
            "[&#39;approved&#39;,&#39;rejected&#39;].includes(this.dataSource.status)",
          );
          return;
        }

        const targetrequestedBy = mappedData.metadata.dataSource["requestedBy"];
        mappedData.to = targetrequestedBy;
        await notificationService.sendNotification(mappedData);

        const targetapprovedBy = mappedData.metadata.dataSource["approvedBy"];
        mappedData.to = targetapprovedBy;
        await notificationService.sendNotification(mappedData);
      } catch (error) {
        console.error("adminOps.branchPurchaseOrder.statusChanged ", error);
      }
    },
  });
};

module.exports = purchaseOrderDecisionListener;
