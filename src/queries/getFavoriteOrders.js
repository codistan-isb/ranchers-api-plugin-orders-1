import _ from "lodash";
import ReactionError from "@reactioncommerce/reaction-error";

/**
 * @name getFavoriteOrders
 * @method
 * @memberof Order/NoMeteorQueries
 * @summary Query the Orders collection for orders and (optionally) shopIds
 * @param {Object} context - an object containing the per-request state
 * @param {Object} params - request parameters
 * @param {String} params.accountId - Account ID to search orders for
 * @param {Object}  params.filters - Filters to apply to a list of orders
 * @param {Array.<String>} params.shopIds - Shop IDs for the shops that owns the orders
 * @returns {Promise<Object>|undefined} - An Array of Order documents, if found
 */
export default async function getFavoriteOrders(context, { filters, shopIds } = {}) {
  const { accountId, appEvents, collections, getFunctionsOfType, userId } = context;
  const { FavoriteOrder } = collections;
  console.log("accountId ", accountId);
  const query = {};

  query.accountId = accountId;
  console.log("query ", query)

  return FavoriteOrder.aggregate([
    {
      $match: {
        accountId: accountId
      }
    },
    {
      $lookup: {
        from: "Orders",             // The collection to join.
        localField: "orderId",      // The field from the FavoriteOrder collection.
        foreignField: "_id",        // The field from the Orders collection.
        as: "orderDetails"          // The result of the join is stored in this new array field.
      }
    },
    {
      $unwind: {
        path: "$orderDetails",      // Unwind the orderDetails array to deconstruct it.
        preserveNullAndEmptyArrays: true // Optional: Retains the document even if orderDetails is empty or null.
      }
    }]).toArray()
}
