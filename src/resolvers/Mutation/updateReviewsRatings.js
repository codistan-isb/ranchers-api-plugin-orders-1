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
    const { collections } = context;
    const { Catalog } = collections;

    try {
        // Fetch all products from the Catalog collection
        const allProducts = await Catalog.find({}).toArray();

        console.log(`Found ${allProducts.length} products to update.`);

        // Loop through each product and update it with rating and reviewCount
        for (const product of allProducts) {
            const rating = (Math.random() * (5 - 4) + 4).toFixed(1); // Random float between 4.0 and 5.0
            const reviewCount = Math.floor(Math.random() * (5000 - 4000 + 1) + 4000); // Random int between 4000 and 5000

            await Catalog.updateOne(
                { _id: product._id }, // Match the product by _id
                {
                    $set: {
                        "product.rating": parseFloat(rating),
                        "product.reviewCount": reviewCount
                    }
                }
            );

            console.log(
                `Updated product ${product.product.title} (ID: ${product.product._id}) with rating: ${rating} and reviewCount: ${reviewCount}`
            );
        }

        console.log("All products updated successfully.");
        return true;
    } catch (error) {
        console.error("Error updating products:", error);
        return false;
    }
}


