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
    const origin = branchAddress.Latitude + "," + branchAddress.Longitude;
    const units = 'imperial';
    const destination =
        deliveryAddress.address1 +
        "," +
        deliveryAddress.city +
        "," +
        deliveryAddress.postal +
        "," +
        deliveryAddress.country;

    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?units=${units}&origins=${origin}&destinations=${destination}&key=${apiKey}`;
    // console.log(url)
    const APIResp = await fetch(url)
        .then(response => response.json())
        .then(data => {
            // console.log("API data:- ", data)
            // console.log("Deep Data:- ", data.rows[0].elements[0])
            // console.log("Row Data:- ", data.rows)
            // console.log("Element Data:- ", data.rows[0].elements)
            const duration = data?.rows[0]?.elements[0]?.duration?.value;
            // console.log("Duration is :- ", duration)
            console.log(`The duration between ${origin} and ${destination} is ${duration} seconds.`);

            return duration;
        })
        .catch(error => console.error('Error fetching API:- ', error));
    // console.log("APIResp :- ", APIResp)
    if (APIResp !== undefined || APIResp !== null || APIResp !== NaN) {
        return APIResp;
    }
    else {
        return 25.00;
    }
}
