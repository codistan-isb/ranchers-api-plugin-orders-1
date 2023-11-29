import sendOrderEmail from "./util/sendOrderEmail.js";
import createNotification from "./util/createNotification.js";
import getProductbyId from "./util/getProductbyId.js";
import generateKitchenOrderID from "./util/generateKitchenOrderID.js";
import deliveryTimeCalculation from "./util/deliveryTimeCalculation.js";

/**
 * @summary Called on startup
 * @param {Object} context Startup context
 * @param {Object} context.collections Map of MongoDB collections
 * @returns {undefined}
 */
export default function ordersStartup(context) {
  const { appEvents } = context;

  appEvents.on("afterOrderCreate", async ({ order, createdBy, orderId, branchID, branchData, fulfillmentGroups }) => {
    let { collections } =
      context;
    const { Orders } = collections;
    // const today = new Date().toISOString().substr(0, 10);
    let deliveryTime = 0.0;
    // let query = {
    //   todayDate: { $eq: today },
    //   branchID: { $eq: branchID },
    //   kitchenOrderID: { $exists: true },
    // };
    // // console.log("order afterOrderCreate", order);
    // // console.log("createdBy afterOrderCreate", createdBy);
    // let generatedID = await generateKitchenOrderID(query, Orders, branchID);
    // let kitchenOrderID = generatedID;

    // console.log("generatedID in app event", generatedID);
    if (branchData) {
      let deliveryTimeCalculationResponse = await deliveryTimeCalculation(
        branchData,
        fulfillmentGroups[0].data.shippingAddress
      );
      if (deliveryTimeCalculationResponse) {
        deliveryTime = Math.ceil(deliveryTimeCalculationResponse / 60);
      }
    }
    let orderData = {
      // kitchenOrderID,
      deliveryTime,
      updatedAt: new Date()
    };
    // order.kitchenOrderID = kitchenOrderID;
    order.deliveryTime = deliveryTime;

    console.log("Order for email ", order);
    console.log("orderData", orderData);
    // console.log("Order for email Payment ", order.payments);


    await Orders.updateOne({ _id: orderId }, { $set: orderData })
    let productPurchased = await getProductbyId(context, { productId: order?.shipping[0]?.items[0]?.variantId })
    const message = "Your order has been placed";
    const appType = "customer";
    const id = createdBy;
    const orderID = orderId;
    let userId = createdBy
    // console.log("id", id);
    // console.log("orderID", orderID);
    context.mutations.oneSignalCreateNotification(context, {
      message,
      id,
      appType,
      userId,
      orderID,
    });
    const message1 = "New Order is placed";
    const appType1 = "admin";
    const id1 = userId;
    context.mutations.oneSignalCreateNotification(context, {
      message: message1,
      id: id1,
      appType: appType1,
      userId: userId,
    });
    sendOrderEmail(context, order, "new")
    createNotification(context, {
      details: null,
      from: createdBy,
      hasDetails: false,
      message: `You have a new order of ${productPurchased.title}`,
      status: "unread",
      to: productPurchased?.uploadedBy?.userId,
      type: "newOrder",
      url: `/en/profile/address?activeProfile=seller`
    })
  });
  // appEvents.on("afterOrderCreate", ({ order }) => sendOrderEmail(context, order, "new"));
  appEvents.on("afterOrderUpdate", async ({ order, updatedBy, status }) => {
    // console.log("order afterOrderUpdate ", order);
    // console.log("updatedBy afterOrderUpdate", updatedBy);
    const message = `Your order is ${status}`;
    const appTypecustomer = "customer";
    const Customerid = order?.accountId;
    const CustomeruserId = order?.accountId;
    const CustomerOrderID = order?._id;
    context.mutations.oneSignalCreateNotification(context, {
      message,
      id: Customerid,
      appType: appTypecustomer,
      userId: CustomeruserId,
      OrderID: CustomerOrderID,
    });
    sendOrderEmail(context, order, "confirmed")
  });

}
