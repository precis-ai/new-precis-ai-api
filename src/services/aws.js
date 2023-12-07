const { S3 } = require("@aws-sdk/client-s3");
const Config = require("../utils/config");

const s3 = new S3({
  region: Config.AWS_BUCKET_REGION,
  credentials: {
    accessKeyId: Config.AWS_ACCESS_KEY,
    secretAccessKey: Config.AWS_SECRET_KEY
  }
});

const uploadFile = async ({ key, body, contentType, bucket }) => {
  const payload = {
    Bucket: bucket,
    Body: body,
    Key: key,
    ContentEncoding: "base64",
    ContentType: contentType
  };

  return await s3.putObject(payload);
};

const AWSService = {
  uploadFile
};

module.exports = AWSService;
