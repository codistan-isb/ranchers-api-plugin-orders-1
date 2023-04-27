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
    // const apiKey = 'AIzaSyDsK8_E12WZ1Wixbh30QPJxc10JJb4ukFI';
    console.log(deliveryAddress);
    console.log(branchAddress)
    // const origin = branchAddress.Latitude + "," + branchAddress.Longitude;
    const origin = "Askari Blvd, Askari 14, Rawalpindi, Punjab 47311, Pakistan"
    const units = 'imperial';
    // const mode = 'bicycling';
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
    // &mode=${mode}
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?units=${units}&origins=${origin}&destinations=${destination}&key=${apiKey}`;
    console.log(url)
    const APIResp = await fetch(url)
        .then(response => response.json())
        .then(data => {
            console.log("API data:- ", data)
            console.log("Deep Data:- ", data.rows[0].elements[0])
            console.log("Row Data:- ", data.rows)
            console.log("Element Data:- ", data.rows[0].elements)
            // console.log(data.rows[0].elements[0])
            const duration = data.rows[0].elements[0].duration.value;
            console.log("Duration is :- ", duration)
            console.log(`The duration between ${origin} and ${destination} is ${duration} seconds.`);
            return duration;
        })
        .catch(error => console.error('Error fetching API:- ', error));
    console.log("APIResp :- ", APIResp)
    return APIResp;
    // return 20;
}
