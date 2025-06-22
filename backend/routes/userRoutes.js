const express = require("express");
const router = express.Router();
const userController = require("../controllers/userrControllers");

// Auth Routes
router.post("/signup", userController.signup);
router.post("/login", userController.login);

// User Data Routes
router.get("/all", userController.getAllUsers);
router.post("/singleUser", userController.getSingleUser); // Use route param for user ID
router.post("/addFriend" , userController.addFriend)

router.post("/toggle-name", userController.toggleNameVisibility);
// Goal Management Routes
router.post("/goal/add", userController.addGoal);
router.post("/goal/delete", userController.deleteGoal);
router.post("/goal/update", userController.updateGoal);

module.exports = router;
