import ReactionError from "@reactioncommerce/reaction-error";
import Random from "@reactioncommerce/random";

export default async function cancelCustomerOrder(context, input) {
  //   inputSchema.validate(input);
  //   console.log("input ", input);
  const { orderID, cancelOrderReason } = input;

  const { accountId, appEvents, collections, userId } = context;
  const { Orders } = collections;
  //   console.log("orderID ", orderID);
  // First verify that this order actually exists
  const order = await Orders.findOne({ _id: orderID });
  if (!order) throw new ReactionError("not-found", "Order not found");

  const modifier = {
    $set: {
      "workflow.status": "canceled",
      rejectionReason: cancelOrderReason,
      updatedAt: new Date(),
    },
  };

  const { modifiedCount, value: updatedOrder } = await Orders.findOneAndUpdate(
    { _id: orderID },
    modifier,
    { returnOriginal: false }
  );
  console.log("updatedOrder", updatedOrder);
  if (modifiedCount === 0 || !updatedOrder)
    throw new ReactionError("server-error", "Unable to update order");
  return { order: updatedOrder };
}
