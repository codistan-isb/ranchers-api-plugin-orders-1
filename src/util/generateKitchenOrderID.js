import { createRequire } from "module";
const require = createRequire(import.meta.url);
const crypto = require("crypto");

export default async function generateKitchenOrderID(query, Orders, branchID) {
    
    const count = await Orders.countDocuments(query);
    let newKichtenID;
    if (count > 0) {
        newKichtenID = count + 1;
        const newID = `Order ${newKichtenID}`;
        return newID
    } else {
        const newID = "Order 1";
        return newID;
    }
}
