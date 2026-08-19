const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({ cloudinary_url: process.env.CLOUDINARY_URL });

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:          'dhuaa-comic',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    transformation:  [{ quality: 'auto', fetch_format: 'auto' }],
  },
});

module.exports = { cloudinary, storage };
