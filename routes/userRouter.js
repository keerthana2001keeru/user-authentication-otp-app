
var express = require("express");
const router = express.Router();
const { homePage, loginPage, userLogin, userRegister, user_registration, verify, verifyOTP, resendOTP, forgotpassword, forgotPassword, resetPassword, resetpassword } = require("../controller/userController");
const { userRegisterValidation, validate } = require("../middleware/validation");




router.get("/", homePage);
//login 
router.get("/login", loginPage);
router.post("/login", userLogin);
//register
router.get("/register", userRegister);
router.post("/registration",userRegisterValidation,validate, user_registration);
router.get('/verify',verify)
router.post('/verify-otp', verifyOTP);
router.get("/resendOtp",resendOTP)
router.get('/forgot-password',forgotpassword)
router.post('/forgot-password',forgotPassword)
router.post('/reset-password/:token',resetPassword);
router.get('/reset-password/:token',resetpassword);