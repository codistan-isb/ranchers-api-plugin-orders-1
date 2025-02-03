import generateKitchenOrderID from "../../util/generateKitchenOrderID.js";
import {
  decodeCartOpaqueId,
  decodeFulfillmentMethodOpaqueId,
  decodeOrderItemsOpaqueIds,
  decodeOrderOpaqueId,
  decodeShopOpaqueId,
} from "../../xforms/id.js";

/**
 * @name Mutation/favoriteOrder
 * @method
 * @memberof Payments/GraphQL
 * @summary resolver for the favoriteOrder GraphQL mutation
 * @param {Object} parentResult - unused
 * @param {Object} args.input - an object of all mutation arguments that were sent by the client
 * @param {Object} args.input.order - The order input
 * @param {Object[]} args.input.payments - Payment info
 * @param {String} [args.input.clientMutationId] - An optional string identifying the mutation call
 * @param {Object} context - an object containing the per-request state
 * @returns {Promise<Object>} favoriteOrderPayload
 */
export default async function favoriteOrder(parentResult, { input }, context) {
  let {
    orderId
  } = input;
  console.log("input ",input)
  console.log(decodeOrderOpaqueId(orderId))
  orderId=decodeOrderOpaqueId(orderId)
  console.log("orderId ",orderId)
  const response = await context.mutations.favoriteOrder(context, {
    orderId:orderId
  });
  console.log("response", response);
  // console.log("Order Placed payments ", orders[0].payments);
  return response
}
