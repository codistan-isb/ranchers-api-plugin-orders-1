let WHATSAPPAPIKEY = process.env.WHATSAPP_API_KEY;
import axios from "axios";
export default async function whatsAppMessage(context, createdBy, generatedID) {
  console.log("createdBy", createdBy);
  console.log("generatedID ", generatedID);
  console.log("WHATSAPPAPIKEY", WHATSAPPAPIKEY);
  let { collections } = context;
  let { Accounts, WhatsAppMessage } = collections;
  let mobileNumber;
  let findUserResponse = await Accounts.findOne({ _id: createdBy });
  console.log("findUserResponse", findUserResponse);
  if (findUserResponse?.profile?.phone) {
    mobileNumber = findUserResponse?.profile?.phone;
  } else {
    let ifNotUser = await users.findOne({ _id: createdBy });
    mobileNumber = ifNotUser?.phone;
  }
  console.log("mobileNumber", mobileNumber);

  let message = "Your order has been placed successfully";

  let config = {
    method: "post",
    maxBodyLength: Infinity,
    url: `https://wa.sabtech.org/api/send.php?api_key=${WHATSAPPAPIKEY}&mobile=92${mobileNumber}&priority=0&message=${message}`,
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
        let savedMessage = await WhatsAppMessage.insertOne(messageData);
        console.log("Message saved successfully:", savedMessage);
      } else {
        console.error("Invalid or missing data in the response.");
      }
    } catch (error) {
      console.error("Error saving message:", error);
    }
  }

  // Call the function somewhere in your code

  //   var dt = new Date().getTime();
  //   var uuid = "xxxyxxxxxxxxxxxxxxx".replace(/[xy]/g, function (c) {
  //     var r = (dt + Math.random() * 16) % 16 | 0;
  //     dt = Math.floor(dt / 16);
  //     return (c == "x" ? r : (r & 0x3) | 0x8).toString(16);
  //   });
  //   return uuid;
}
