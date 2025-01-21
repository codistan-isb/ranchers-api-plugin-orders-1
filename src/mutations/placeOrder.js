import _ from "lodash";
import ObjectID from "mongodb";
import SimpleSchema from "simpl-schema";
import Logger from "@reactioncommerce/logger";
import Random from "@reactioncommerce/random";
import ReactionError from "@reactioncommerce/reaction-error";
import getAnonymousAccessToken from "@reactioncommerce/api-utils/getAnonymousAccessToken.js";
import buildOrderFulfillmentGroupFromInput from "../util/buildOrderFulfillmentGroupFromInput.js";
import verifyPaymentsMatchOrderTotal from "../util/verifyPaymentsMatchOrderTotal.js";
import doEasyPaisaPayment from "../util/easyPaisaPayment.js";
import sendOrderEmail from "../util/sendOrderEmail.js";
import {
  Order as OrderSchema,
  orderInputSchema,
  Payment as PaymentSchema,
  paymentInputSchema,
} from "../simpleSchemas.js";
// import deliveryTimeCalculation from "../util/deliveryTimeCalculation.js";
import generateKitchenOrderID from "../util/generateKitchenOrderID.js";
import checkIfTime from "../util/checkIfTime.js";

const GUEST_TOKEN =
  "4fca69b380be5f9898f435e548654c063f757562ca32fb9e5d09bb5d38d3295b";

const inputSchema = new SimpleSchema({
  order: orderInputSchema,
  payments: {
    type: Array,
    optional: true,
  },
  "payments.$": paymentInputSchema,
});

/**
 * @summary Create all authorized payments for a potential order
 * @param {String} [accountId] The ID of the account placing the order
 * @param {Object} [billingAddress] Billing address for the order as a whole
 * @param {Object} context - The application context
 * @param {String} currencyCode Currency code for interpreting the amount of all payments
 * @param {String} email Email address for the order
 * @param {Number} orderTotal Total due for the order
 * @param {Object[]} paymentsInput List of payment inputs
 * @param {Object} [shippingAddress] Shipping address, if relevant, for fraud detection
 * @param {String} shop shop that owns the order
 * @returns {Object[]} Array of created payments
 */
async function
  createPayments({
    accountId,
    billingAddress,
    context,
    currencyCode,
    email,
    orderTotal,
    paymentsInput,
    shippingAddress,
    shop,
    taxPercentage,
  }) {
  // console.log("paymentsInput create Payment ", paymentsInput)

  // Determining which payment methods are enabled for the shop
  const availablePaymentMethods = shop.availablePaymentMethods || [];
  console.log("orderTotal in createPayments ", orderTotal)
  // Verify that total of payment inputs equals total due. We need to be sure
  // to do this before creating any payment authorizations
  verifyPaymentsMatchOrderTotal(paymentsInput || [], orderTotal, taxPercentage);

  // Create authorized payments for each
  const paymentPromises = (paymentsInput || []).map(async (paymentInput) => {
    const {
      amount,
      method: methodName,
      tax,
      totalAmount,
      finalAmount,
    } = paymentInput;

    // Verify that this payment method is enabled for the shop
    if (!availablePaymentMethods.includes(methodName)) {
      throw new ReactionError(
        "payment-failed",
        `Payment method not enabled for this shop: ${methodName}`
      );
    }

    // Grab config for this payment method
    let paymentMethodConfig;
    try {
      paymentMethodConfig =
        context.queries.getPaymentMethodConfigByName(methodName);
    } catch (error) {
      Logger.error(error);
      throw new ReactionError(
        "payment-failed",
        `Invalid payment method name: ${methodName}`
      );
    }

    // Authorize this payment
    const payment = await paymentMethodConfig.functions.createAuthorizedPayment(
      context,
      {
        accountId, // optional
        amount,
        tax,
        totalAmount,
        finalAmount,
        billingAddress: paymentInput.billingAddress || billingAddress,
        currencyCode,
        email,
        shippingAddress, // optional, for fraud detection, the first shipping address if shipping to multiple
        shopId: shop._id,
        paymentData: {
          ...(paymentInput.data || {}),
        }, // optional, object, blackbox
      }
    );
    const paymentWithCurrency = {
      ...payment,
      // This is from previous support for exchange rates, which was removed in v3.0.0
      currency: { exchangeRate: 1, userCurrency: currencyCode },
      currencyCode,
    };

    PaymentSchema.validate(paymentWithCurrency);

    return paymentWithCurrency;
  });

  let payments;
  try {

    payments = await Promise.all(paymentPromises);
    console.log("payments ", payments)
    payments = payments.filter((payment) => !!payment); // remove nulls
  } catch (error) {
    Logger.error("createOrder: error creating payments", error);
    throw new ReactionError(
      "payment-failed",
      `There was a problem authorizing this payment: ${error.message}`
    );
  }
  return payments;
}

/**
 * @method placeOrder
 * @summary Places an order, authorizing all payments first
 * @param {Object} context - an object containing the per-request state
 * @param {Object} input - Necessary input. See SimpleSchema
 * @returns {Promise<Object>} Object with `order` property containing the created order
 */
export default async function placeOrder(context, input) {
  let prepTime = 0;
  let taxID = "";
  let deliveryTime = 0.0;
  let deliveryCharges;
  let today = new Date().toISOString().substr(0, 10);
  const cleanedInput = inputSchema.clean(input); // add default values and such
  inputSchema.validate(cleanedInput);
  const { order: orderInput, payments: paymentsInput } = cleanedInput;

  const {
    branchID,
    notes,
    Latitude,
    Longitude,
    placedFrom,
    isGuestUser,
    guestToken,
    easyPaisaNumber
  } = input;
  console.log("input ", input)
  const {
    billingAddress,
    cartId,
    currencyCode,
    customFields: customFieldsFromClient,
    email,
    fulfillmentGroups,
    ordererPreferredLanguage,
    shopId,
  } = orderInput;

  const { accountId, appEvents, collections, getFunctionsOfType, userId } =
    context;
  // console.log("Collections available:", Object.keys(context.collections));
  const { TaxRate, Orders, Cart, BranchData, CartHistory, Transaction } = collections;

  //this is moved to the app event call
  let query = {
    todayDate: { $eq: today },
    branchID: { $eq: branchID },
    kitchenOrderID: { $exists: true },
  };
  let generatedID = await generateKitchenOrderID(query, Orders, branchID);
  let kitchenOrderID = generatedID;
  let todayDate = today;
  let branchData = await BranchData.findOne({
    _id: ObjectID.ObjectId(branchID),
  });
  console.log("branchData ", branchData)
  // if (branchData?.Timing) {
  //   const [startTime, endTime] = branchData.Timing.split(" - ").map((time) => time.trim());
  //   // Call the checkIfTime function
  //   const isOpen = await checkIfTime(startTime, endTime);

  //   console.log("Is branch open?", isOpen, "branch.name ", branchData.name);
  //   if (!isOpen) {
  //     throw new ReactionError("access-denied", `${branchData.name} Branch is closed for now. Please try between ${branchData.Timing}`);
  //   }
  // }
  if (branchData) {
    prepTime = branchData.prepTime;
    taxID = branchData.taxID;
    deliveryCharges = branchData.deliveryCharges;
  }

  // console.log("deliveryCharges", deliveryCharges);
  prepTime = prepTime ? prepTime : 20;
  const taxData = await TaxRate.findOne({ _id: ObjectID.ObjectId(taxID) });
  console.log("taxData ", taxData)
  let taxPercentage = taxData?.Cash;
  if (
    fulfillmentGroups?.[0]?.type === "pickup" &&
    fulfillmentGroups?.[0]?.paymentMethod === "CARD"
  ) {
    taxPercentage = taxData?.Card;
  }
  console.log("taxPercentage ", taxPercentage)

  const shop = await context.queries.shopById(context, shopId);
  if (!shop) throw new ReactionError("not-found", "Shop not found");

  // if (!userId && !shop.allowGuestCheckout) {
  //   throw new ReactionError("access-denied", "Guest checkout not allowed");
  // }

  if (!userId) {
    if (!isGuestUser) {
      throw new ReactionError("access-denied", "User or guest access required");
    }
    if (isGuestUser && (!guestToken || guestToken !== GUEST_TOKEN)) {
      throw new ReactionError(
        "access-denied",
        "Guest token required for guest users"
      );
    }
  }

  let cart;
  if (cartId) {
    console.log("cartId ", cartId)
    cart = await Cart.findOne({ _id: cartId });
    // await
    if (!cart) {
      throw new ReactionError(
        "not-found",
        "Cart not found while trying to place order"
      );
    }
  }
  // We are mixing concerns a bit here for now. This is for backwards compatibility with current
  // discount codes feature. We are planning to revamp discounts soon, but until then, we'll look up
  // any discounts on the related cart here.
  let discounts = [];
  let discountTotal = 0;
  if (cart) {
    const discountsResult = await context.queries.getDiscountsTotalForCart(
      context,
      cart
    );
    ({ discounts } = discountsResult);
    discountTotal = discountsResult.total;
  }
  // Create array for surcharges to apply to order, if applicable
  // Array is populated inside `fulfillmentGroups.map()`
  const orderSurcharges = [];

  // Create orderId
  const orderId = Random.id();

  // Add more props to each fulfillment group, and validate/build the items in each group
  let orderTotal = 0;
  let shippingAddressForPayments = null;
  const finalFulfillmentGroups = await Promise.all(
    fulfillmentGroups.map(async (inputGroup) => {
      const { group, groupSurcharges } =
        await buildOrderFulfillmentGroupFromInput(context, {
          accountId,
          billingAddress,
          cartId,
          currencyCode,
          discountTotal,
          inputGroup,
          orderId,
          cart,
          branchID,
          notes,
          Latitude,
          Longitude,
        });
      console.log("group ", group)

      // We save off the first shipping address found, for passing to payment services. They use this
      // for fraud detection.
      if (group.address && !shippingAddressForPayments)
        shippingAddressForPayments = group.address;

      // Push all group surcharges to overall order surcharge array.
      // Currently, we do not save surcharges per group
      orderSurcharges.push(...groupSurcharges);

      // Add the group total to the order total
      orderTotal += group.invoice.total;
      // console.log("orderTotal", orderTotal);
      // console.log("group", group);
      return group;
    })
  );
  console.log("orderTotal", orderTotal)

  const payments = await createPayments({
    accountId,
    billingAddress,
    context,
    currencyCode,
    email,
    orderTotal,
    paymentsInput,
    shippingAddress: shippingAddressForPayments,
    shop,
    taxPercentage,
  });
  console.log("payments ", payments[0].finalAmount)
  console.log("totalAmount ", payments[0].totalAmount)
  if (payments[0].totalAmount < 500) {
    throw new ReactionError(
      "invalid-order",
      "Order amount must be greater than 500"
    );
  }
  console.log("fulfillmentGroups?.[0]?.paymentMethod ", fulfillmentGroups?.[0]?.paymentMethod)
  let easyPaisaResponse;

  if (fulfillmentGroups[0].paymentMethod == "EASYPAISA") {
    console.log("orderId,null,1,null,easyPaisaNumber, email ", orderId, null, payments[0].finalAmount, null, easyPaisaNumber, email)
    easyPaisaResponse = await doEasyPaisaPayment(orderId, null, payments[0].finalAmount, null, easyPaisaNumber, email)
    console.log("easyPaisaResponse ", easyPaisaResponse)
    const transactionRecord = {
      orderId,
      accountId,
      email,
      // transactionId: '32794508224',
      // transactionDateTime: '17/12/2024 12:24 PM',
      transactionId: easyPaisaResponse?.transactionId,
      transactionDateTime: easyPaisaResponse?.transactionDateTime,
      easyPaisaNumber: easyPaisaNumber
    }

    console.log("TRANSACTION REOCRD", transactionRecord)
    const newTransaction = await Transaction.insertOne(transactionRecord)
    console.log("newTransaction ", newTransaction)
  }
  if (fulfillmentGroups[0].paymentMethod == "EASYPAISA" && easyPaisaResponse?.responseCode != "0000") {
    throw new ReactionError(
      "transaction-failed",
      "Transaction has been failed"
    );
  }

  console.log("fulfillmentGroups[0].paymentMethod", fulfillmentGroups[0].paymentMethod)

  // Create anonymousAccessToken if no account ID
  const fullToken = accountId ? null : getAnonymousAccessToken();

  const now = new Date();
  const order = {
    _id: orderId,
    accountId,
    billingAddress,
    cartId,
    createdAt: now,
    currencyCode,
    discounts,
    email,
    ordererPreferredLanguage: ordererPreferredLanguage || null,
    payments,
    shipping: finalFulfillmentGroups,
    shopId,
    placedFrom,
    branchID,
    notes,
    surcharges: orderSurcharges,
    totalItemQuantity: finalFulfillmentGroups.reduce(
      (sum, group) => sum + group.totalItemQuantity,
      0
    ),
    updatedAt: now,
    workflow: {
      status: "new",
      workflow: ["new"],
    },
    kitchenOrderID,
    todayDate,
    prepTime,
    deliveryTime,
    Latitude,
    Longitude,
    paymentMethod: fulfillmentGroups[0].paymentMethod,
    transactionId: fulfillmentGroups[0].paymentMethod == "EASYPAISA" ? easyPaisaResponse?.transactionId : ""
  };


  console.log("ORDER RECORD", order)

  if (fullToken) {
    const dbToken = { ...fullToken };
    // don't store the raw token in db, only the hash
    delete dbToken.token;
    order.anonymousAccessTokens = [dbToken];
  }
  let referenceId;
  const createReferenceIdFunctions = getFunctionsOfType(
    "createOrderReferenceId"
  );
  if (!createReferenceIdFunctions || createReferenceIdFunctions.length === 0) {
    // if the cart has a reference Id, and no custom function is created use that
    if (_.get(cart, "referenceId")) {
      // we want the else to fallthrough if no cart to keep the if/else logic simple
      ({ referenceId } = cart);
    } else {
      referenceId = Random.id();
    }
  } else {
    referenceId = await createReferenceIdFunctions[0](context, order, cart);
    if (typeof referenceId !== "string") {
      throw new ReactionError(
        "invalid-parameter",
        "createOrderReferenceId function returned a non-string value"
      );
    }
    if (createReferenceIdFunctions.length > 1) {
      Logger.warn(
        "More than one createOrderReferenceId function defined. Using first one defined"
      );
    }
  }
  console.log("referenceId ", referenceId)

  order.referenceId = referenceId;

  // Apply custom order data transformations from plugins
  const transformCustomOrderFieldsFuncs = getFunctionsOfType(
    "transformCustomOrderFields"
  );
  if (transformCustomOrderFieldsFuncs.length > 0) {
    let customFields = { ...(customFieldsFromClient || {}) };
    // We need to run each of these functions in a series, rather than in parallel, because
    // each function expects to get the result of the previous. It is recommended to disable `no-await-in-loop`
    // eslint rules when the output of one iteration might be used as input in another iteration, such as this case here.
    // See https://eslint.org/docs/rules/no-await-in-loop#when-not-to-use-it
    for (const transformCustomOrderFieldsFunc of transformCustomOrderFieldsFuncs) {
      customFields = await transformCustomOrderFieldsFunc({
        context,
        customFields,
        order,
      }); // eslint-disable-line no-await-in-loop
    }
    order.customFields = customFields;
  } else {
    order.customFields = customFieldsFromClient;
  }
  // Validate and save

  OrderSchema.validate(order);
  await Orders.insertOne({
    ...order,
    paymentMethod: fulfillmentGroups?.[0]?.paymentMethod || "CASH",
  });
  // sendOrderEmail(context, order, "new");
  // const message = "Your order has been placed";
  // const appType = "customer";
  // const id = userId;
  // const orderID = orderId;
  // const paymentIntentClientSecret =
  //   context.mutations.oneSignalCreateNotification(context, {
  //     message,
  //     id,
  //     appType,
  //     userId,
  //     orderID,
  //   });
  // const message1 = "New Order is placed";
  // const appType1 = "admin";
  // const id1 = userId;
  // const paymentIntentClientSecret1 =
  //   context.mutations.oneSignalCreateNotification(context, {
  //     message: message1,
  //     id: id1,
  //     appType: appType1,
  //     userId: userId,
  //   });
  // CartHistory.insertOne(cart);
  console.log("generatedID", generatedID);
  await appEvents.emit("afterOrderCreate", {
    createdBy: userId,
    order,
    orderId,
    branchID,
    branchData,
    fulfillmentGroups,
    generatedID,
  });

  return {
    orders: [order],
    // GraphQL response gets the raw token
    token: fullToken && fullToken.token,
  };
}
