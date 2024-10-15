


module.exports={
saveResetToken: async function (userId, resetToken, resetExpires) {
    try {
      console.log("object",userId)
      const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
      await User.findByIdAndUpdate(userId, {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: resetExpires,
      });
    } catch (err) {
      throw new Error('Error saving reset token');
    }
  },
  findUserByEmail: async function(email) {
    // console.log(email)
     try{
     return await User.findOne({ email: email, isDeleted: false , isVerified:true});
     }catch(error){
       throw new Error("Error finding user by email: " + error.message);
   }},
   findUserByResetToken : async function(resetToken) {
    try {
      const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
      const user = await User.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { $gt: Date.now() }, // Ensure token is not expired
      });
     // console.log("rrr",user);
      return user;  // Returns user object if the token is valid and not expired
    } catch (err) {
      throw new Error('Error finding user by reset token');
    }
  },
  createUser:async function ({ fullName, phone, email, hashedPassword }) {
    if (!hashedPassword) {
      throw new Error("Password is required");
    }
    
    const password = hashedPassword;
   
    return await User.create({
      fullName,
      phone,
      email,
      password,
      isDeleted: false,
      isVerified:true
    });
  },
  updatePassword : async function (userId, hashedPassword) {
    console.log("hash",hashedPassword)
    console.log("userid",userId)
    try {
      await User.findByIdAndUpdate(userId, {
        password: hashedPassword,
        resetPasswordToken: null,  // Clear the reset token after password update
        resetPasswordExpires: null,
      });
    } catch (err) {
      throw new Error('Error updating password');
    }
  },
   generateResetToken : () =>{
    return crypto.randomBytes(32).toString('hex');  // Generate a random token
  },
   clearResetToken : async function (userId)  {
    try {
      await User.findByIdAndUpdate(userId, {
        resetPasswordToken: null,
        resetPasswordExpires: null,
      });
    } catch (err) {
      throw new Error('Error clearing reset token');
    }
  }
}