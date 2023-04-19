// export default deliveryTimeCalculation =
// import { createRequire } from "module";

// const require = createRequire(import.meta.url);
// // // const pkg = require("../package.json");
// const { fetch: nodeFetch } = require('fetch');
import fetch from "node-fetch";

export default async function deliveryTimeCalculation(
    branchAddress,
    deliveryAddress
) {
    const apiKey = 'AIzaSyC3vl-jtFGzrBapun1U6sxT-Toena_1ywY';
    console.log(deliveryAddress);
    const origin = branchAddress.Latitude + "," + branchAddress.Longitude;
    const units = 'imperial';
    const mode = 'bicycling';
    const destination =
        deliveryAddress.address1 +
        "," +
        deliveryAddress.city +
        "," +
        deliveryAddress.postal +
        "," +
        deliveryAddress.country;
    console.log("branch Address:- ", origin);
    console.log("delivery Address:- ", destination);
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?units=${units}&origins=${origin}&destinations=${destination}&mode=${mode}&key=${apiKey}`;
    console.log(url)
    const APIResp = await fetch(url)
        .then(response => response.json())
        .then(data => {
            console.log(data)
            // const duration = data.rows[0].elements[0].duration.value;
            // console.log(`The duration between ${origin} and ${destination} is ${duration} seconds.`);
        })
        .catch(error => console.error('Error fetching API:- ', error));
    console.log(APIResp)
}
