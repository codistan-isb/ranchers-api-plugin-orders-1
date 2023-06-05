import ReactionError from "@reactioncommerce/reaction-error";
import encodeOpaqueId from "@reactioncommerce/api-utils/encodeOpaqueId.js";
const encodeFulfillmentGroupOpaqueId = encodeOpaqueId("reaction/fulfillmentMethod");

/**
 * @name getOrderShippingByAddress
 * @method
 * @memberof Order/NoMeteorQueries
 * @summary Query the Orders collection for an order with the provided orderId
 * @param {Object} context - an object containing the per-request state
 * @param {Object} params - request parameters
 * @param {String} params.orderId - Order ID
 * @param {String} params.shopId - Shop ID for the shop that owns the order
 * @param {String} [params.token] - Anonymous order token
 * @returns {Promise<Object>|undefined} - An Order document, if one is found
 */
export default async function getOrderShippingByAddress(parnet, { input } = {},context) {
  console.log("input",input);
  const {address, city}=input;
  if (!address || !city) {
    throw new ReactionError("invalid-param", "You must provide address and city arguments");
  }
  const {collections}=context;
  const {Shipping}=collections;
const getShippingMethod=await Shipping.find({}).toArray();
console.log(getShippingMethod[0]?.methods[0]["_id"]);
const selectedFullfilmentId=await encodeFulfillmentGroupOpaqueId(getShippingMethod[0]?.methods[0]["_id"])
console.log("selectedFullfilmentId",selectedFullfilmentId)
  return selectedFullfilmentId;
 
}
