import getPaginatedResponse from "@reactioncommerce/api-utils/graphql/getPaginatedResponse.js";
import wasFieldRequested from "@reactioncommerce/api-utils/graphql/wasFieldRequested.js";
import { decodeShopOpaqueId } from "../../xforms/id.js";

/**
 * @name Query/orders
 * @method
 * @memberof Order/GraphQL
 * @summary Get an order by its reference ID
 * @param {Object} parentResult - unused
 * @param {ConnectionArgs} args - An object of all arguments that were sent by the client
 * @param {Object} args.filters - An Object of filters to apply
 * @param {String} args.shopIds - shop IDs to check for orders from
 * @param {Object} context - An object containing the per-request state
 * @param {Object} info Info about the GraphQL request
 * @returns {Promise<Object>|undefined} An Order object
 */
export default async function getFavoriteOrders(parentResult, args, context, info) {
    const { filters, shopIds: opaqueShopIds, ...connectionArgs } = args;

    const shopIds = opaqueShopIds && opaqueShopIds.map(decodeShopOpaqueId);

    const query = await context.queries.getFavoriteOrders(context, {
        filters,
        shopIds
    });
    console.log("query ",query)
    return query;

    //   return getPaginatedResponse(query, connectionArgs, {
    //     includeHasNextPage: wasFieldRequested("pageInfo.hasNextPage", info),
    //     includeHasPreviousPage: wasFieldRequested("pageInfo.hasPreviousPage", info),
    //     includeTotalCount: wasFieldRequested("totalCount", info)
    //   });
}
