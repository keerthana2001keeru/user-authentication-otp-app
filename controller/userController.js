






const homePage = async function (req,res){
    const products = await productHandler.getHomeProducts();
    let isUser = false;
    let wishlistCount = 0;
    let cartCount= 0;
    if (req.session.user) {
      let isUser = true;
      wishlistCount = req.session.user.wishlist.length;
      cartCount = req.session.user.cart.length;
      res.render("user/index", {isUser, products, user:req.session.user, wishlistCount,cartCount });
    } else {
      res.render("user/index", { products });
    }
  }
  
  const loginPage = function (req, res) {
   res.setHeader("Cache-Control", "no-cache, no-store , must-revalidate");
    if (req.session.user) {
      return res.redirect("/");
    } 
    else{
     return res.render("user/login", {formData:{}});
  }};
  
  const userLogin = async function (req, res, next) {
    try {
      const { email, password } = req.body;
      const user = await userHandler.findUserByEmail(email);
      const currentUser = user;
      if (currentUser) {
        const passwordMatch = await bcrypt.compare(
          password,
          currentUser.password
        );
        if (passwordMatch) {
          req.session.user = user ;
          req.session.loggedIn = true;
          req.session.userid=user._id;
          req.session.email=currentUser.email;
          console.log(req.session.email);
          req.session.username = currentUser.fullName;
          return res.redirect( "/");
        } else {
          return res.render("user/login", { errorMessage: "Invalid password",formData:req.body });
        }
      } else {
        return res.render("user/login", { errorMessage: "User not found" , formData:req.body});
      }
    } catch (err) {
      next(err);
    }
  }
   
  const userRegister = function (req, res) {
    res.setHeader("Cache-Control", "no-cache, no-store , must-revalidate");
    if (req.session.loggedIn) {
      return res.redirect("/");
    } else {
      return res.render("user/register",{formData:{}});
    }
    
  };
  
  const user_registration = async function (req, res, next) {
    
    const { fullName, email, password, phone } = req.body;
   
    // Check if a user is already exist with this email
    const user = await userHandler.findUserByEmail(email);
    if (user && user.isVerified == true) { 
          logger.info("user already exists");
          res.render("user/register", {
             errorMessage: "user already exists, kindly login",
             formData:req.body
          });
        }
    try {
      // Sending otp to the user provided email
      const otp = await sendOTP(email);
      // storing the info inside session
      req.session.signupInfo = { email, password, fullName, phone };
      // Creating timeout 90 second
      let expireTime = Date.now() + 5 * 60 * 1000;
      // Store it in the session
      req.session.emailOTP = { otp, expireTime };
     // res.json({ error: null });
     res.render('user/verify')
    } catch (err) {
      next(err);
    }
  };
  
   const verify = function (req, res) {
     if (req.session.user) {
       res.redirect("/");
     } else {
       res.render("user/verify");
     }
   };
  
  const verifyOTP = async (req, res, next) => {
    const { otpvalue } = req.body;
    
    // Retrieve OTP and expire time from session
    const sessionOTP = req.session.emailOTP?.otp;
    const expireTime = req.session.emailOTP?.expireTime;
    
    if (!sessionOTP || !expireTime) {
        return res.status(400).render('user/verify', { errorMessage: "OTP expired, please resend." });
    }
  
    // Check if OTP has expired
    if (Date.now() > expireTime) {
      req.session.emailOTP = null;
        return res.status(400).render('user/verify', { errorMessage: "OTP expired, please resend." });
    }
  
    // Check if the provided OTP matches the session OTP
    if (otpvalue === sessionOTP) {
     try{
        const { email, password, fullName, phone } = req.session.signupInfo;
        const hashedPassword = await bcrypt.hash(password, 10);
               const newUser = await userHandler.createUser({
                 fullName,
                 phone,
                 email,
                 hashedPassword,
               });
        //await userHandler.createUser({ email, password, fullName, phone });
        req.session.signupInfo = null;
        req.session.emailOTP = null;
        //successMessage: "Registration successful!"
        return res.redirect('/login');
    } catch (error){
      return next(error);
    }
  }else {
        // Invalid OTP
        return res.status(400).render('user/verify', { errorMessage: "Invalid OTP, please try again." });
    }
  };
  
  const resendOTP = async (req, res, next) => {
    const { email } = req.session.signupInfo;
    try {
        const newOTP = await sendOTP(email);
        let newExpireTime = Date.now() + 5 * 60 * 1000;
        req.session.emailOTP = { otp: newOTP, expireTime: newExpireTime };
        res.status(200).render('user/verify', { successMessage: "OTP resent successfully." });
    } catch (err) {
        next(err);
    }
  };
  const forgotpassword=function (req,res){
   
      res.render("user/forgot-password");
    
  }
  
  const forgotPassword = async (req, res, next) => {
    const { email } = req.body;
    console.log("emao",email)
    const user = await userHandler.findUserByEmail(email);
  
    if (!user) {
      return res.status(400).render('admin/forgot-password', { errorMessage: 'Email not found' });
    }
  
    const resetToken = userHandler.generateResetToken();
    const resetExpires = Date.now() + 3600000; // 1 hour from now
  console.log("yyy",user.id)
    await userHandler.saveResetToken(user.id, resetToken, resetExpires);
  
    const resetURL = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`;
    await sendEmail({
      to: user.email,
      subject: 'Password Reset Request',
      text: `You can reset your password using this link: ${resetURL}`,
    });
  
    res.render('user/forgot-password', { successMessage: 'Check your email for the password reset link' });
  };
  const resetpassword = async (req, res, next) => {
    const { token } = req.params;
    console.log("object",token)
    try {
      // Find the user by reset token
      const user = await userHandler.findUserByResetToken(token);
      if (!user) {
        return res.render('user/reset-password', { errorMessage: 'Invalid or expired token' });
      }
  
      // Render the password reset form
      res.render('user/reset-password', { token });
    } catch (err) {
      next(err);
    }
  }
  
  
  const resetPassword = async (req, res, next) => {
    const { token } = req.params;
    
    const { newPassword } = req.body;
  
  
    try {
      // Find the user by the reset token
      const user = await userHandler.findUserByResetToken(token);
      console.log("user",user)
      if (!user) {
        return res.render('user/reset-password', { errorMessage: 'Invalid or expired token' });
      }
  
      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
  
      // Update the user's password and clear the reset token
      await userHandler.updatePassword(user._id, hashedPassword);
      await userHandler.clearResetToken(user._id);
  
      // Redirect to login page with success message
      res.redirect('/login');
    } catch (err) {
      next(err);
    }
  }
  module.exports={
   
    loginPage,
    userLogin,
    user_registration,
    verifyOTP,
    userRegister,
    resendOTP,
   
    verify,
    forgotPassword,
    
    homePage,
  
   forgotpassword,
 
   resetPassword,
   resetpassword,
   
  }