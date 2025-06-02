const express = require('express');
const router = express.Router();
const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');
const { verifyToken, checkRole } = require('../middlewares/checkAuth');

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Check if AWS configuration is present
const checkAWSConfig = () => {
  const requiredEnvVars = [
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'AWS_REGION',
    'AWS_S3_BUCKET'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required AWS configuration: ${missingVars.join(', ')}`);
  }
};

// Initialize S3 client
let s3Client;
try {
  checkAWSConfig();
  s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });
} catch (error) {
  console.error('AWS Configuration Error:', error.message);
}

// Upload multiple images
router.post('/', verifyToken, checkRole(['ADMIN']), upload.array('images', 10), async (req, res) => {
  try {
    if (!s3Client) {
      return res.status(500).json({
        success: false,
        message: 'AWS S3 configuration is missing. Please check server configuration.'
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const uploadedUrls = [];

    for (const file of req.files) {
      const fileExtension = file.originalname.split('.').pop();
      const fileName = `${uuidv4()}.${fileExtension}`;
      const key = `institutions/${fileName}`;

      const params = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      };

      try {
        await s3Client.send(new PutObjectCommand(params));
        const fileUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
        uploadedUrls.push(fileUrl);
      } catch (uploadError) {
        console.error('Error uploading file to S3:', uploadError);
        throw new Error(`Failed to upload file ${file.originalname}: ${uploadError.message}`);
      }
    }

    res.json({
      success: true,
      urls: uploadedUrls
    });
  } catch (error) {
    console.error('Error uploading files:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload files'
    });
  }
});

module.exports = router; 