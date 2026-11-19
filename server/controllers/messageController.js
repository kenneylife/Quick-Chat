import Message from "../models/Message.js";
import User from "../models/User.js";
import cloudinary from "../lib/cloudinary.js";
import { io, userSocketMap } from "../server.js";


//Get All users except the logged in user
export const getUserForSidebar = async (req, res) => {
  try {
      const userId = req.user._id;
      const filteredUsers = await User.find({_id: {$ne: userId}}).select('-password');

      //Count numbers of messages not seen
      const undeenMessages = {}
      const promises = filteredUsers.map(async (user) => {
        const messages = await Message.find({senderId: user._id, receiverId: userId, seen: false});
        if(messages.length > 0){
          undeenMessages[user._id] = messages.length;
        }
      })
      await Promise.all(promises);
      res.json({success: true, users: filteredUsers, undeenMessages})
  } catch (error) {
    console.log(error.message);
    res.json({success: false, message: error.messages})
  }
}

// Get all messages for selected user
export const  getMessages = async (req, res) => {
  try {
    const {id: selectedUserId} = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        {senderId: myId, receiverId: selectedUserId},
        {senderId: selectedUserId, receiverId: myId}
      ]
   })
   await Message.updateMany({senderId: selectedUserId, receiverId: myId}, {seen: true});
   res.json({success: true, messages})
  } catch (error) {
      console.log(error.message);
    res.json({success: false, message: error.messages})
  }
}

// api to mark message as seen using message id
export const markMessageAsSeen = async (req, res) => {
  try {
    const {id} = req.params;
    await Message.findByIdAndUpdate(id, {seen: true})
    res.json({success: true})
  } catch (error) {
       console.log(error.message);
    res.json({success: false, message: error.messages})
  }
}

//Send message to selected user
export const sendMessage = async (req, res) => {
   try {
      const {text, image} = req.body;
      const receiverId = req.params.id;
      const senderId = req.user._id

let imageUrl;
if (image) {
  try {
    const uploadResponse = await cloudinary.uploader.upload(image, {
      folder: "mavor/messages",
      resource_type: "auto"
    })
    imageUrl = uploadResponse.secure_url
  } catch (e) {
    console.log("Cloudinary 403 blocked, saving locally")
    imageUrl = image
  }
}

const newMessage = await Message.create({
  senderId,
  receiverId,
  text,
  image: imageUrl
})

// Emit the new message to the receover's socket
const receiverSocketId = userSocketMap[receiverId];
if (receiverSocketId){
  io.to(receiverSocketId).emit('newMessage', newMessage)
}

      res.json({success: true, newMessage})
  } catch (error) {
       console.log(error.message);
    res.json({success: false, message: error.messages})
  }
}
