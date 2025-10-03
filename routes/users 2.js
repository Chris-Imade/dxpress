const express = require("express");
const router = express.Router();
const usersController = require("../controllers/users");
const { isAuthenticated, isAdmin } = require("../middleware/auth");

// All routes require admin authentication
router.use(isAuthenticated);
router.use(isAdmin);

// Get users management page
router.get("/", usersController.getUsers);

// Create new user
router.post("/create", usersController.createUser);

// Get edit user page
router.get("/edit/:id", usersController.getEditUser);

// Update user
router.post("/update/:id", usersController.updateUser);

// Suspend user
router.post("/suspend/:id", usersController.suspendUser);

// Activate user
router.post("/activate/:id", usersController.activateUser);

// Delete user
router.delete("/delete/:id", usersController.deleteUser);

module.exports = router;
