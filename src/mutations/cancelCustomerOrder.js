import ReactionError from "@reactioncommerce/reaction-error";

export default async function cancelCustomerOrder(context, input) {
  let { orderID, cancelOrderReason } = input;

  let { accountId, appEvents, collections, userId } = context;
  let { Orders } = collections;
  try {
    let order = await Orders.findOne({ _id: orderID });
    if (!order) throw new ReactionError("not-found", "Order not found");
    let rejectionReason = cancelOrderReason;
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
    if (modifiedCount === 0 || !updatedOrder)
      throw new ReactionError("server-error", "Unable to update order");

    context.mutations.oneSignalCreateNotification(context, {
      message,
      id: CustomerAccountID,
      appType: appTypeCustomer,
      userId: CustomerAccountID,
      orderID: orderID,
    });
    context.mutations.sendWhatsAppMessage(context, {
      createdBy: CustomerAccountID,
      generatedID: order?.kitchenOrderID,
      OrderStatus: "canceled",
    });
    return { order: updatedOrder };
  } catch (error) {
    console.log("error ", error);
  }
}
