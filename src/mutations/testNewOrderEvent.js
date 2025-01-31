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
import pubSub from "../util/pubSubIntance.js";
// import { PubSub } from "graphql-subscriptions";
// const pubSub = new PubSub();

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
export default async function testNewOrderEvent(context, input) {
  let prepTime = 0;
  let taxID = "";
  let deliveryTime = 0.0;
  let deliveryCharges;
  let today = new Date().toISOString().substr(0, 10);
  // const cleanedInput = inputSchema.clean(input); // add default values and such
  // inputSchema.validate(cleanedInput);
  // const { order: orderInput, payments: paymentsInput } = cleanedInput;

  // const {
  //   branchID,
  //   notes,
  //   Latitude,
  //   Longitude,
  //   placedFrom,
  //   isGuestUser,
  //   guestToken,
  //   easyPaisaNumber
  // } = input;
  // console.log("input ", input)
  // const {
  //   billingAddress,
  //   cartId,
  //   currencyCode,
  //   customFields: customFieldsFromClient,
  //   email,
  //   fulfillmentGroups,
  //   ordererPreferredLanguage,
  //   shopId,
  // } = orderInput;

  const { accountId, appEvents, collections, getFunctionsOfType, userId } =
    context;
  // console.log("Collections available:", Object.keys(context.collections));
  const { TaxRate, Orders, Cart, BranchData, CartHistory, Transaction } = collections;
  console.log("ORDER_CREATED ",)
  console.log("newOrder ")
  pubSub.publish("ORDER_CREATED", {
    newOrder: {
      "id": "wZDevCHF3z8ncQPBT",
      "_id": "wZDevCHF3z8ncQPBT",
      "startTime": null,
      "endTime": null,
      "createdAt": "2025-01-30T12:36:25.911Z",
      "updatedAt": "2025-01-30T12:36:29.500Z",
      "branchID": "653f50a88de8510013649233",
      "isGuestUser": false,
      "transferFromBranchInfo": null,
      "summary": {
        "discountTotal": {
          "amount": 0,
          "__typename": "Money"
        },
        "__typename": "OrderSummary"
      },
      "payments": [
        {
          "finalAmount": 1049,
          "tax": 47,
          "totalAmount": 1049,
          "__typename": "Payment",
          "billingAddress": {
            "fullName": "Ihtesham Nazir",
            "phone": "03249092038",
            "__typename": "Address"
          }
        }
      ],
      "email": "ihtesham.nazir@codistan.org",
      "kitchenOrderID": "Order 3",
      "status": "new",
      "branches": null,
      "username": null,
      "OrderStatus": null,
      "riderOrderInfo": {
        "_id": null,
        "startTime": null,
        "endTime": null,
        "__typename": "riderOrderInfoPayload"
      },
      "riderInfo": {
        "userId": null,
        "_id": null,
        "firstName": null,
        "lastName": null,
        "phone": null,
        "__typename": "AccountNew"
      },
      "fulfillmentGroups": [
        {
          "selectedFulfillmentOption": {
            "fulfillmentMethod": {
              "fulfillmentTypes": [
                "pickup"
              ],
              "__typename": "FulfillmentMethod"
            },
            "__typename": "FulfillmentOption"
          },
          "items": {
            "nodes": [
              {
                "_id": "cmVhY3Rpb24vb3JkZXJJdGVtOkFUSFRxa2dNeG9RdWV6NEVi",
                "quantity": 1,
                "optionTitle": "7up",
                "title": "Chee Haww Chicken",
                "variantTitle": "7up",
                "attributes": [
                  {
                    "label": "Flavor",
                    "value": "Combo (with fries and drink)",
                    "__typename": "OrderItemAttribute"
                  },
                  {
                    "label": "Drink",
                    "value": "7up",
                    "__typename": "OrderItemAttribute"
                  }
                ],
                "price": {
                  "amount": 1049,
                  "__typename": "Money"
                },
                "__typename": "OrderItem"
              }
            ],
            "__typename": "OrderItemConnection"
          },
          "__typename": "OrderFulfillmentGroupNew"
        }
      ],
      "notes": [
        {
          "content": "testing",
          "createdAt": null,
          "__typename": "OrderNote"
        }
      ],
      "deliveryTime": 9,
      "branchTimePickup": {
        "branchOrderTime": null,
        "__typename": "branchTimePickupPayload"
      },
      "customerInfo": {
        "address1": ", Rawalpindi, Punjab, Pakistan, Arid University",
        "__typename": "customerInfoPayload"
      },
      "branchInfo": {
        "_id": "653f50a88de8510013649233",
        "name": "Ranchers Commercial ,Rawalpindi",
        "__typename": "Branch"
      },
      "paymentMethod": "CASH",
      "placedFrom": "web",
      "isPaid": false,
      "__typename": "OrderNew"
    }
  });

  return true
}
