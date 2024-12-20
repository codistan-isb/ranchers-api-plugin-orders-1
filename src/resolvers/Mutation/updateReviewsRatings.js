import generateKitchenOrderID from "../../util/generateKitchenOrderID.js";
import {
    decodeCartOpaqueId,
    decodeFulfillmentMethodOpaqueId,
    decodeOrderItemsOpaqueIds,
    decodeShopOpaqueId,
} from "../../xforms/id.js";

/**
 * @name Mutation/updateReviewsRatings
 * @method
 * @memberof Payments/GraphQL
 * @summary resolver for the updateReviewsRatings GraphQL mutation
 * @param {Object} parentResult - unused
 * @param {Object} args.input - an object of all mutation arguments that were sent by the client
 * @param {Object} args.input.order - The order input
 * @param {Object[]} args.input.payments - Payment info
 * @param {String} [args.input.clientMutationId] - An optional string identifying the mutation call
 * @param {Object} context - an object containing the per-request state
 * @returns {Promise<Object>} PlaceOrderPayload
 */
export default async function updateReviewsRatings(parentResult, { input }, context) {
    const { accountId, appEvents, collections, getFunctionsOfType, userId } =
        context;
    // console.log("Collections available:", Object.keys(context.collections));
    const { TaxRate, Orders, Cart, BranchData, CartHistory, Transaction } = collections;
    console.log("TaxRate, Orders, Cart, BranchData, CartHistory, Transaction ",TaxRate, Orders, Cart, BranchData, CartHistory, Transaction)
    return {
    };
}
