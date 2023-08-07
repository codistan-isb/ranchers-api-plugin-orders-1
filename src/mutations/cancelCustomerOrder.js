import ReactionError from "@reactioncommerce/reaction-error";
import Random from "@reactioncommerce/random";

export default async function cancelCustomerOrder(context, input) {
  //   inputSchema.validate(input);
  //   console.log("input ", input);
  let { orderID, cancelOrderReason } = input;

  let { accountId, appEvents, collections, userId } = context;
  let { Orders } = collections;
  //   console.log("orderID ", orderID);
  // First verify that this order actually exists
  let order = await Orders.findOne({ _id: orderID });
  if (!order) throw new ReactionError("not-found", "Order not found");
  let rejectionReason = cancelOrderReason;
  //   const userId = CurrentRiderID;
  let modifier = {
    $set: {
      "workflow.status": "canceled",
      rejectionReason,
      updatedAt: new Date(),
    },
  };
  let appTypeCustomer = "customer";
  let CustomerAccountID = order?.accountId;
  let message = `Your order is canceled and reason is ${rejectionReason}`;
  let { modifiedCount, value: updatedOrder } = await Orders.findOneAndUpdate(
    { _id: orderID },
    modifier,
    { returnOriginal: false }
  );
  //   console.log("updatedOrder", updatedOrder);
  if (modifiedCount === 0 || !updatedOrder)
    throw new ReactionError("server-error", "Unable to update order");
  let paymentIntentClientSecret1 =
    context.mutations.oneSignalCreateNotification(context, {
      message,
      id: CustomerAccountID,
      appType: appTypeCustomer,
      userId: CustomerAccountID,
      orderID: orderID,
    });
  console.log("paymentIntentClientSecret1 ", paymentIntentClientSecret1);

  return { order: updatedOrder };
}
