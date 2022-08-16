const https = require("https");
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL; //Get this URL from the Slack App settings

exports.handler = async (event) => {
  const snsMessage = event.Records[0].Sns.Message; //Extract the message from the SNS event
  const deploymentURL = snsMessage.match(/\bhttps?:\/\/\S+amplifyapp.com/gi)[0]; //Extract the deployment URL from the message
  const consoleURL = snsMessage.match(
    /\bhttps?:\/\/console.aws.amazon.com\S+/gi
  )[0]; //Extract the console URL from the message

  const deploymentStatus = snsMessage.includes("FAILED")
    ? "FAILED"
    : snsMessage.includes("SUCCEED")
    ? "SUCCEEDED"
    : "STARTED";

  const message = `${
    deploymentStatus === "FAILED" ? "<!here>" : ""
  }Your build has ${deploymentStatus} \n To view details go to ${consoleURL} \n Deployment URL : ${deploymentURL}`;

  const slackShareColor = deploymentStatus === "FAILED" ? "#E52E59" : "#21E27C";

  //Format and Send the message to Slack channel
  const data = JSON.stringify({
    attachments: [
      {
        mrkdwn_in: ["text"],
        fallback: message,
        color: slackShareColor,
        text: message
      }
    ]
  });

  if (!["SUCCEEDED", "FAILED"].includes(deploymentStatus)) return null;

  return new Promise((resolve, reject) => {
    const request = https.request(
      SLACK_WEBHOOK_URL,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": data.length
        }
      },
      (res) => {
        console.log(`statusCode: ${res.statusCode}`);
        res.on("data", (d) => process.stdout.write(d));
        res.on("end", () => resolve());
      }
    );
    request.write(data);
    request.end();
  });
};
