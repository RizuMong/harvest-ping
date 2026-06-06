const fetch = require('node-fetch');

// Get the push token from command line arguments
const pushToken = process.argv[2];

if (!pushToken) {
  console.error("Error: Please provide your Expo Push Token as an argument.");
  console.error("Example: node scratch/test-push-delivery.js ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]");
  process.exit(1);
}

async function sendPushAndCheckReceipt() {
  console.log(`1. Sending test push notification to: ${pushToken}...`);
  
  const payload = {
    to: pushToken,
    sound: 'default',
    title: 'Harvest Ping Test',
    body: 'If you see this, push notification is working!',
    channelId: 'default',
    data: { test: true },
  };

  try {
    const sendResponse = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const sendResult = await sendResponse.json();
    console.log("Send API Response:", JSON.stringify(sendResult, null, 2));

    if (!sendResult.data || sendResult.data.status !== 'ok') {
      console.error("Failed to queue notification with Expo.");
      return;
    }

    const ticketId = sendResult.data.id;
    console.log(`\n2. Push queued successfully. Ticket ID: ${ticketId}`);
    console.log("Waiting 3 seconds for Expo to process and attempt delivery to FCM...");
    
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log(`\n3. Fetching receipt for Ticket ID: ${ticketId}...`);
    const receiptResponse = await fetch('https://exp.host/--/api/v2/push/getReceipts', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ids: [ticketId] }),
    });

    const receiptResult = await receiptResponse.json();
    console.log("Receipt API Response:", JSON.stringify(receiptResult, null, 2));

    const receipt = receiptResult.data?.[ticketId];
    if (receipt) {
      if (receipt.status === 'ok') {
        console.log("\n🎉 Success! Expo successfully delivered the message to the push service (FCM/APNs).");
      } else if (receipt.status === 'error') {
        console.error(`\n❌ Delivery Error: ${receipt.message}`);
        if (receipt.details) {
          console.error("Details:", JSON.stringify(receipt.details, null, 2));
        }
        console.error("\nPossible fixes:");
        console.error("- If error is 'DeviceNotRegistered': The token is no longer valid. Re-register the device.");
        console.error("- If error contains 'InvalidCredentials' or 'MismatchSenderId': Upload/re-configure your Firebase Service Account JSON credentials on the EAS Dashboard.");
      }
    } else {
      console.log("\nNo receipt found yet. It may still be processing, or the ticket ID is invalid.");
    }
  } catch (error) {
    console.error("An error occurred during verification:", error);
  }
}

sendPushAndCheckReceipt();
