import fetch from "node-fetch";
import ReactionError from "@reactioncommerce/reaction-error";

export default async function updateOrderTime(
    parent,
    { riderID, orderID, Latitude, Longitude },
    context,
    info
) {
    if (context.user === undefined || context.user === null) {
        throw new ReactionError("access-denied", "Please login first");
    }
    const { Orders } = context.collections;
    const apiKey = 'AIzaSyAN4uBGLP_KD6UlDkUi2Zbvjn5idqe6abU';
    const units = 'imperial';
    const OrderDetailResp = await Orders.find({ _id: orderID }).toArray();
    const origin = Latitude + "," + Longitude;
    if (!OrderDetailResp) {
        throw new ReactionError("not-found", "Order address not Found");
    }
    const destination =
        OrderDetailResp[0].shipping[0].address.address1 +
        "," +
        OrderDetailResp[0].shipping[0].address.city +
        "," +
        OrderDetailResp[0].shipping[0].address.postal +
        "," +
        OrderDetailResp[0].shipping[0].address.country;

    // console.log("complete Address:- ", destination);
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?units=${units}&origins=${origin}&destinations=${destination}&key=${apiKey}`;
    const APIResp = await fetch(url)
        .then(response => response.json())
        .then(data => {
            const duration = data?.rows[0]?.elements[0]?.duration?.value;
            // console.log("Duration is :- ", duration)
            // console.log(`The duration between ${origin} and ${destination} is ${duration} seconds.`);
            return duration;
        })
        .catch(error => console.error('Error fetching API:- ', error));
    // console.log("APIResp ", APIResp);
    if (APIResp) {
        const deliveryTime = Math.ceil(APIResp / 60);
        // console.log("deliveryTime ", deliveryTime);
        return deliveryTime;
    }
    else {
        return "10";
    }


}
