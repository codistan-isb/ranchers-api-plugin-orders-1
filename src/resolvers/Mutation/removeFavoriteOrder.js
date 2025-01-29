import generateKitchenOrderID from "../../util/generateKitchenOrderID.js";
import {
  decodeCartOpaqueId,
  decodeFulfillmentMethodOpaqueId,
  decodeOrderItemsOpaqueIds,
  decodeShopOpaqueId,
} from "../../xforms/id.js";

/**
 * @name Mutation/removeFavoriteOrder
 * @method
 * @memberof Payments/GraphQL
 * @summary resolver for the removeFavoriteOrder GraphQL mutation
 * @param {Object} parentResult - unused
 * @param {Object} args.input - an object of all mutation arguments that were sent by the client
 * @param {Object} args.input.order - The order input
 * @param {Object[]} args.input.payments - Payment info
 * @param {String} [args.input.clientMutationId] - An optional string identifying the mutation call
 * @param {Object} context - an object containing the per-request state
 * @returns {Promise<Object>} favoriteOrderPayload
 */
export default async function removeFavoriteOrder(parentResult, { input }, context) {
  const {
    orderId
  } = input;
  console.log("input ",input)
  const response = await context.mutations.removeFavoriteOrder(context, {
    orderId:orderId
  });
  console.log("response", response);
  // console.log("Order Placed payments ", orders[0].payments);
  return response
}
