export default async function taxInfo(node) {
    // console.log("taxInfo node ", node.payments);
    // console.log("taxInfo node tax", node.payments[0].tax);
    // console.log("taxInfo node totalAmount", node.payments[0].totalAmount);
    // console.log("taxInfo node finalAmount", node.payments[0].finalAmount);
    let taxInfoPayload = {
        "tax": node.payments[0].tax,
        "totalAmount": node.payments[0].totalAmount,
        "finalAmount": node.payments[0].finalAmount
    }
    return taxInfoPayload
}