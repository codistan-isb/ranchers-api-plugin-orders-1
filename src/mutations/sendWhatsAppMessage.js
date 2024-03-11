let WHATSAPPAPIKEY = process.env.WHATSAPP_API_KEY;
import axios from "axios";
export default async function sendWhatsAppMessage(context, input) {
  console.log("input", input);
  let { generatedID, createdBy, OrderStatus, rejectionReason } = input;
  let { collections } = context;
  let { Accounts, WhatsAppMessage } = collections;
  let mobileNumber, firstName, lastName, message;
  let findUserResponse = await Accounts.findOne({ _id: createdBy });
  console.log("findUserResponse", findUserResponse);
  if (findUserResponse?.profile?.phone) {
    mobileNumber = findUserResponse?.profile?.phone;
    firstName = findUserResponse?.profile?.firstName;
    lastName = findUserResponse?.profile?.lastName;
  } else {
    let ifNotUser = await users.findOne({ _id: createdBy });
    mobileNumber = ifNotUser?.phone;
    firstName = ifNotUser?.firstName;
    lastName = ifNotUser?.lastName;
  }
  console.log("mobileNumber", mobileNumber.substring(1));
  if (OrderStatus === "placed" || OrderStatus === "new") {
    message = `Dear ${
      firstName + " " + lastName
    } , thank you for choosing Ranchers Cafe! Your ${generatedID} has been successfully placed. We are working diligently to prepare your delicious meal. You will receive another message once your order is ready for pickup or delivery. Thank you for your patronage!`;
  }
  if (OrderStatus === "confirmed" || OrderStatus === "processing") {
    message = `Hello ${
      firstName + " " + lastName
    } , just a quick update on your order ${generatedID}. Our team is currently working on preparing your meal with care. We appreciate your patience and understanding. Stay tuned for further updates!`;
  }
  if (OrderStatus === "ready") {
    message = `Hello ${
      firstName + " " + lastName
    } , just a quick update on your order ${generatedID}. Your order is prepared and ready to dispatch. Our team has worked diligently to ensure your meal is prepared with care. We appreciate your patience and understanding. Stay tuned for further updates!`;
  }
  if (OrderStatus === "pickedUp") {
    message = `Hi  ${
      firstName + " " + lastName
    } , great news! Your order ${generatedID} has been dispatched and is on its way to you. Our dedicated rider is on route to deliver your scrumptious meal. We hope you enjoy it. Thank you for choosing Ranchers Cafe!`;
  }
  if (OrderStatus === "canceled" || OrderStatus === "reject") {
    message = `Dear Valued Customer, We regret to inform you that your recent order i.e ${generatedID}. The reason is ${rejectionReason} . If you require any assistance, please contact our customer support team at 051-111-577-677
    . Thank you for your understanding."`;
  }
  if (OrderStatus === "delivered") {
    message = `Hi  ${
      firstName + " " + lastName
    } ,We're excited to announce that your order with the ID ${generatedID} has been delivered successfully! Your satisfaction is paramount to us, so if you have any feedback, please share it with us. Thank you for choosing Ranchers Cafe. We're looking forward to serving you again soon!`;
  }
  console.log("message", message);
  let config = {
    method: "post",
    maxBodyLength: Infinity,
    url: `https://wa.sabtech.org/api/send.php?api_key=${WHATSAPPAPIKEY}&mobile=92${mobileNumber.substring(
      1
    )}&priority=0&message=${message}`,
    headers: {},
  };
  console.log("config", config);
  axios
    .request(config)
    .then((response) => {
      console.log(JSON.stringify(response?.data));
      updateDatabase(response);
    })
    .catch((error) => {
      console.log(error);
    });

  async function updateDatabase(response) {
    try {
      if (response && response.data) {
        let messageData = response.data;
        messageData.createdAt = new Date(); // Adding createdAt field with current date
        messageData.userId = createdBy;
        messageData.kitchenOrderID = generatedID;
        await WhatsAppMessage.insertOne(messageData);
        // console.log("Message saved successfully:", savedMessage);
      } else {
        console.error("Invalid or missing data in the response.");
      }
    } catch (error) {
      let messageData;
      messageData.createdAt = new Date(); // Adding createdAt field with current date
      messageData.userId = createdBy;
      messageData.kitchenOrderID = generatedID;
      messageData.errorMessage = error;
      messageData.status = false;
      await WhatsAppMessage.insertOne(messageData);
      console.error("Error saving message:", error);
    }
  }
}
