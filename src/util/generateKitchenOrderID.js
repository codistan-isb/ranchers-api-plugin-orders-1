import { createRequire } from "module";
const require = createRequire(import.meta.url);
const crypto = require("crypto");

export default async function generateKitchenOrderID(query, Orders, branchID) {
    const prefix = 'Order ';
    // console.log(query)
    const count = await Orders.countDocuments(query);
    // console.log("count:- ", count);
    let newKichtenID = 0;
    if (count > 0) {
        // const options = { sort: { kitchenOrderID: -1 } };
        // const lastDocument = await Orders.findOne(query, options);
        // console.log("lastDocument ", lastDocument)
        // const lastId = parseInt(lastDocument.kitchenOrderID.substr(2), 10);
        // let lastId = parseInt(lastDocument.kitchenOrderID.substr(prefix.length), 25);
        // if (!isNaN(lastId)) {
        //     kitchenOrderID = lastId + 1;
        // }
        // console.log("count ", count);
        // console.log("lastId:- ", lastId);
        newKichtenID = count + 1;
        const newID = `Order ${newKichtenID}`;
        // console.log("New ID:- ", newID);
        return newID
    } else {
        const newID = "Order 1";
        // console.log("Else New ID:- ", newID);
        return newID;
    }
}
