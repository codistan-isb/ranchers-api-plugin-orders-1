import { decodeOrderOpaqueId } from "../../xforms/id.js";
import ReactionError from "@reactioncommerce/reaction-error";

export default async function cancelCustomerOrder(
  parentResult,
  { input },
  context
) {
  const { clientMutationId = null, orderID, cancelOrderReason } = input;
  if (context.user === undefined || context.user === null) {
    throw new ReactionError(
      "access-denied",
      "Unauthorized access. Please Login First"
    );
  }
  const { order } = await context.mutations.cancelCustomerOrder(context, {
    orderID: decodeOrderOpaqueId(orderID),
    cancelOrderReason,
  });

  return {
    clientMutationId,
    order,
  };
}
