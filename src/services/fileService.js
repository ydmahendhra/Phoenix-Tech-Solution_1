const multer = require('multer');
const { getGridFSBucket } = require('../utils/db');
const { ObjectId } = require('mongodb');

// Memory storage for multer so we can directly pipe buffer to GridFS
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];

  if (allowedMimeTypes.includes(file.mimetype) || file.originalname.match(/\.(pdf|doc|docx|xls|xlsx|jpg|jpeg|png|webp)$/i)) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file format. Allowed formats: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, WEBP.'), false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024 // 25 MB max limit
  },
  fileFilter
});

const uploadToGridFS = (buffer, filename, contentType, metadata = {}) => {
  return new Promise((resolve, reject) => {
    const bucket = getGridFSBucket();
    const uniqueFilename = `${Date.now()}-${filename.replace(/\s+/g, '_')}`;

    const uploadStream = bucket.openUploadStream(uniqueFilename, {
      contentType,
      metadata: {
        ...metadata,
        originalName: filename,
        uploadedAt: new Date()
      }
    });

    uploadStream.on('error', (error) => {
      reject(error);
    });

    uploadStream.on('finish', (file) => {
      resolve({
        fileId: file._id.toString(),
        storedFileName: uniqueFilename,
        originalFileName: filename,
        contentType,
        fileSize: file.length,
        fileUrl: `/api/files/${file._id}`
      });
    });

    uploadStream.end(buffer);
  });
};

const downloadFromGridFS = async (fileId, res) => {
  try {
    const bucket = getGridFSBucket();
    const _id = new ObjectId(fileId);

    const files = await bucket.find({ _id }).toArray();
    if (!files || files.length === 0) {
      return res.status(404).json({ success: false, message: 'File not found in storage.' });
    }

    const file = files[0];
    res.setHeader('Content-Type', file.contentType || 'application/octet-stream');
    res.setHeader('Content-Length', file.length);
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${encodeURIComponent(file.metadata?.originalName || file.filename)}"`
    );

    const downloadStream = bucket.openDownloadStream(_id);
    downloadStream.pipe(res);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve file from storage: ' + error.message });
  }
};

module.exports = {
  upload,
  uploadToGridFS,
  downloadFromGridFS
};
