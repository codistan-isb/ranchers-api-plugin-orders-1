import fetch from "node-fetch";
const GOOGLE_API_KEY_DISTANCE_CALCULATOR =
    process.env.GOOGLE_API_KEY_DISTANCE_CALCULATOR;
export default async function deliveryTimeCalculation(
    branchAddress,
    deliveryAddress
) {
    console.log("GOOGLE_API_KEY_DISTANCE_CALCULATOR", GOOGLE_API_KEY_DISTANCE_CALCULATOR);
    if (branchAddress) {
        let apiKey = GOOGLE_API_KEY_DISTANCE_CALCULATOR;
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
                // console.log(`The duration between ${origin} and ${destination} is ${duration} seconds.`);
                return duration;
            })
            .catch(error => console.error('Error fetching API:- ', error));
        if (APIResp !== undefined || APIResp !== null || APIResp !== NaN) {
            return APIResp;
        }
        else {
            return 25.00;
        }
    }
    else {
        return 25.00
    }
}
