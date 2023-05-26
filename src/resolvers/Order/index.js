import resolveAccountFromAccountId from "@reactioncommerce/api-utils/graphql/resolveAccountFromAccountId.js";
import resolveShopFromShopId from "@reactioncommerce/api-utils/graphql/resolveShopFromShopId.js";
import { encodeCartOpaqueId, encodeOrderOpaqueId } from "../../xforms/id.js";
import orderDisplayStatus from "./orderDisplayStatus.js";
import orderSummary from "./orderSummary.js";
import payments from "./payments.js";
import refunds from "./refunds.js";
import totalItemQuantity from "./totalItemQuantity.js";
import billingName from "./billingName.js";
import taxInfo from "./taxInfo.js";

export default {
  _id: (node) => encodeOrderOpaqueId(node._id),
  account: resolveAccountFromAccountId,
  billingName: (node) => billingName(node),
  cartId: (node) => encodeCartOpaqueId(node._id),
  displayStatus: (node, { language }, context) => orderDisplayStatus(context, node, language),
  fulfillmentGroups: (node) => node.shipping || [],
  notes: (node) => node.notes || [],
  payments: (node, _, context) => payments(context, node),
  refunds: (node, _, context) => refunds(context, node),
  shop: resolveShopFromShopId,
  status: (node) => {
    // console.log("Status Node ", node)
    return node.workflow?.status || ""
  },
  summary: (node, _, context) => orderSummary(context, node),
  totalItemQuantity,
  kitchenOrderID: (node) => {
    // console.log("node:- ", node)
    return node.kitchenOrderID
  },
  branchID: (node) => node.branchID,
  deliveryTime: (node) => node.deliveryTime + node.prepTime || node.deliveryTime + 20.0,
  Latitude: (node) => {
    // console.log("Lat node: ", node)
    return node.Latitude
  },
  Longitude: (node) => node.Longitude,
  taxInfo: (node) => taxInfo(node)
};
