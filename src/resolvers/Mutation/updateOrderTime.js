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
  try {
    const apiKey = "AIzaSyAN4uBGLP_KD6UlDkUi2Zbvjn5idqe6abU";
    const units = "imperial";
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

    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?units=${units}&origins=${origin}&destinations=${destination}&key=${apiKey}`;
    const APIResp = await fetch(url)
      .then((response) => response.json())
      .then((data) => {
        const duration = data?.rows[0]?.elements[0]?.duration?.value;
        return duration;
      })
      .catch((error) => console.error("Error fetching API:- ", error));
    if (APIResp) {
      const deliveryTime = Math.ceil(APIResp / 60);
      return deliveryTime;
    } else {
      return "10";
    }
  } catch (error) {
    console.log("error ", error);
  }
}
