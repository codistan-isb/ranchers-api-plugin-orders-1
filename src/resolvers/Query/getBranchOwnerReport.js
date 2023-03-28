// export default async function getBranchOwnerReport(parent, args, context, info) {
//     console.log(args);
//     const { branchID, orderStatus } = args;
//     console.log(context.user);
//     // console.log(context.user.UserRole);
//     console.log(!context.user.branches);
//     if (context.user === undefined || context.user === null) {
//         throw new Error("Unauthorized access. Please login first");
//     }
//     if (
//         context.user.UserRole !== "admin" &&
//         (!context.user.branches ||
//             (context.user.branches && !context.user.branches.includes(branchID)))
//     ) {
//         throw new Error(
//             "Only admins or authorized branch users can access orders report"
//         );
//     }
//     const { BranchData, Orders } = context.collections;
//     const query = {};
//     if (branchID) {
//         query.branchID = branchID;
//     } else if (user.branches) {
//         query.branchID = { $in: user.branches };
//     }
//     if (orderStatus) {
//         query.status = orderStatus;
//     }
//     console.log(query);
//     const ordersResp = await Orders.find(query).sort({ createdAt: -1 }).toArray();
//     console.log(ordersResp)
//     const ordersWithId = ordersResp.map((order) => ({
//         id: order._id,
//         ...order,
//     }));
//     return ordersWithId
// }