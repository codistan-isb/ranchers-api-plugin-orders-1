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
 * @method favoriteOrder
 * @summary Places an order, authorizing all payments first
 * @param {Object} context - an object containing the per-request state
 * @param {Object} input - Necessary input. See SimpleSchema
 * @returns {Promise<Object>} Object with `order` property containing the created order
 */
export default async function favoriteOrder(context, input) {
  let prepTime = 0;
  let taxID = "";
  let deliveryTime = 0.0;
  let deliveryCharges;
  let today = new Date().toISOString().substr(0, 10);
  const {
    orderId
  } = input;
  console.log("input ", input)

  const { accountId, appEvents, collections, getFunctionsOfType, userId } =
    context;
  // console.log("Collections available:", Object.keys(context.collections));
  const { FavoriteOrder, Orders } = collections;

  // Create anonymousAccessToken if no account ID
  const fullToken = accountId ? null : getAnonymousAccessToken();

  const now = new Date();
  const favorteOrder = {
    accountId,
    orderId,
    createdAt: now
  };


  // Check the current number of favorite orders
  const count = await FavoriteOrder.countDocuments({ accountId });
  console.log("Current number of favorite orders: ", count);

  if (count >= 5) {
    console.log("Maximum number of favorite orders reached.");
    return {
      isUpdated: false,
      error: "You cannot have more than 5 favorite orders."
    };
  }

  console.log("ORDER RECORD", favoriteOrder)
  const insertedFavoriteOrder = await FavoriteOrder.findOneAndUpdate(
    {
      accountId,
      orderId,
    },
    {
      $set: favorteOrder
    },
    { upsert: true }
  );
  console.log("insertedFavoriteOrder ", insertedFavoriteOrder)
  const updateFavoriteOrder = await Orders.findOneAndUpdate(
    {
      _id: orderId,
    },
    {
      $set: {
        isFavorite: true
      }
    }
  );
  console.log("updateFavoriteOrder ", updateFavoriteOrder)
  if (insertedFavoriteOrder?.ok > 0) {
    return {
      isUpdated: true
    };
  } else {
    return {
      isUpdated: true
    };
  }


}
