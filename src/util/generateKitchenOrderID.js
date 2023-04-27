import { createRequire } from "module";
const require = createRequire(import.meta.url);
const crypto = require("crypto");

export default async function generateKitchenOrderID(query, Orders, branchID) {
    const prefix = 'Order # ';
    const count = await Orders.countDocuments(query);
    // console.log("count:- ", count);
    if (count > 0) {
        const options = { sort: { kitchenOrderID: -1 } };
        const lastDocument = await Orders.findOne(query, options);
        // const lastId = parseInt(lastDocument.kitchenOrderID.substr(2), 10);
        const lastId = parseInt(lastDocument.kitchenOrderID.substr(prefix.length), 25);
        // if (!isNaN(lastId)) {
        //     kitchenOrderID = lastId + 1;
        // }
        // console.log("lastDocument.kitchenOrderID:- ", lastDocument.kitchenOrderID);
        // console.log("lastId:- ", lastId);
        const nextId = lastId + 1;
        const newID = `Order # ${nextId}`;
        // console.log("New ID:- ", newID);
        return newID
    } else {
        const newID = "Order # 1";
        // console.log("Else New ID:- ", newID);
        return newID;
    }
}
