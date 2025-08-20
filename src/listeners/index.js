const startBaseListeners = require("./base");
const reservationReadyListeners = require("./reservationReady.listener");
const dueDateReminderListeners = require("./dueDateReminder.listener");
const overdueNoticeListeners = require("./overdueNotice.listener");
const feeAssessmentListeners = require("./feeAssessment.listener");
const feePaymentReceiptListeners = require("./feePaymentReceipt.listener");
const personalizedRecommendationListeners = require("./personalizedRecommendation.listener");
const manualStaffAlertListeners = require("./manualStaffAlert.listener");
const issueEscalationUpdateListeners = require("./issueEscalationUpdate.listener");
const purchaseOrderDecisionListeners = require("./purchaseOrderDecision.listener");
const userWelcomeListeners = require("./userWelcome.listener");
const userVerificationListeners = require("./userVerification.listener");
const userResetPasswordListeners = require("./userResetPassword.listener");

const startListener = async () => {
  try {
    await startBaseListeners();
    await reservationReadyListeners();
    await dueDateReminderListeners();
    await overdueNoticeListeners();
    await feeAssessmentListeners();
    await feePaymentReceiptListeners();
    await personalizedRecommendationListeners();
    await manualStaffAlertListeners();
    await issueEscalationUpdateListeners();
    await purchaseOrderDecisionListeners();
    await userWelcomeListeners();
    await userVerificationListeners();
    await userResetPasswordListeners();
  } catch (error) {}
};

module.exports = startListener;
