import {v2 as cloudinary} from 'cloudinary';

const CLOUD_NAME = "gstrtgfk";
const API_KEY = "556987492634344";
const API_SECRET = "j7On8vYJlRzesgQDT1kFRTO4oOI";

cloudinary.config({
  cloud_name: CLOUD_NAME,
  api_key: API_KEY,
  api_secret: API_SECRET
});

console.log("CLOUDINARY CONFIG:", cloudinary.config().cloud_name, cloudinary.config().api_key, "secret length:", API_SECRET.length);

export default cloudinary;