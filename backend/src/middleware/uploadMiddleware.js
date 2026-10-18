import multer from 'multer';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_EXTENSIONS = /\.(jpe?g|png|webp)$/i;

/**
 * Validates that the file buffer begins with valid magic bytes for JPEG, PNG, or WebP.
 */
export function validateImageMagicBytes(buffer) {
  if (!buffer || buffer.length < 12) {
    return false;
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return true;
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return true;
  }

  // WebP: RIFF .... WEBP
  const isRiff =
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46;
  const isWebp =
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50;
  if (isRiff && isWebp) {
    return true;
  }

  return false;
}

// Memory storage to process buffers without saving temporary local files
const storage = multer.memoryStorage();

const multerInstance = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB limit per file
    files: 10, // Max 10 files per request
  },
  fileFilter: (req, file, cb) => {
    // 1. Check browser-provided MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      const err = new Error(
        `Unsupported file type: ${file.mimetype}. Only JPEG, PNG, and WebP images are allowed.`
      );
      err.code = 'INVALID_FILE_TYPE';
      return cb(err, false);
    }

    // 2. Check filename extension
    if (!ALLOWED_EXTENSIONS.test(file.originalname)) {
      const err = new Error(
        'Invalid file extension. Only .jpg, .jpeg, .png, and .webp files are allowed.'
      );
      err.code = 'INVALID_FILE_EXTENSION';
      return cb(err, false);
    }

    cb(null, true);
  },
});

/**
 * Middleware that handles multer upload and formats errors into RoomSync standard error envelope
 */
export function handleListingImageUpload(req, res, next) {
  const upload = multerInstance.array('images', 10);

  upload(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: 'Image file too large. Maximum size allowed is 10 MB per image.',
            error: {
              code: 'FILE_TOO_LARGE',
              message: 'Maximum allowed image size is 10 MB.',
              details: [{ field: 'images', message: 'File exceeds 10 MB limit' }],
            },
          });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({
            success: false,
            message: 'Too many files uploaded. Maximum is 10 images per listing.',
            error: {
              code: 'TOO_MANY_FILES',
              message: 'Maximum 10 images can be uploaded at once.',
              details: [{ field: 'images', message: 'Exceeds maximum of 10 images' }],
            },
          });
        }
        return res.status(400).json({
          success: false,
          message: err.message,
          error: {
            code: 'UPLOAD_ERROR',
            message: err.message,
            details: [],
          },
        });
      }

      // Custom fileFilter errors
      return res.status(400).json({
        success: false,
        message: err.message,
        error: {
          code: err.code || 'INVALID_FILE',
          message: err.message,
          details: [{ field: 'images', message: err.message }],
        },
      });
    }

    // Additional magic byte validation on buffered contents
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        if (!validateImageMagicBytes(file.buffer)) {
          return res.status(400).json({
            success: false,
            message: `File "${file.originalname}" has invalid or corrupted image content.`,
            error: {
              code: 'INVALID_IMAGE_CONTENT',
              message: 'File content does not match a valid image signature.',
              details: [{ field: 'images', file: file.originalname }],
            },
          });
        }
      }
    }

    next();
  });
}
