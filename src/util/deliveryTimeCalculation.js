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
    const apiKey = 'AIzaSyAN4uBGLP_KD6UlDkUi2Zbvjn5idqe6abU';
    console.log(deliveryAddress);
    const origin = branchAddress.Latitude + "," + branchAddress.Longitude;
    const units = 'imperial';
    const mode = 'bicycling';
    // "33.6404186,73.0636572"
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
    // const url = `https://maps.googleapis.com/maps/api/distancematrix/json?units=${units}&origins=${origin}&destinations=${destination}&mode=${mode}&key=${apiKey}`;
    // console.log(url)
    // const APIResp = await fetch(url)
    //     .then(response => response.json())
    //     .then(data => {
    //         console.log("API data:- ", data)
    //         console.log("Deep Data:- ", data.rows[0].elements[0])
    //         const duration = data.rows[0].elements[0].duration.value;
    //         console.log(`The duration between ${origin} and ${destination} is ${duration} seconds.`);
    //     })
    //     .catch(error => console.error('Error fetching API:- ', error));
    // console.log("APIResp :- ", APIResp)
    return 20
}
