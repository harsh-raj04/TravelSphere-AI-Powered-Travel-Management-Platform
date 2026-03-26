const express = require("express");
const {
  listPackages,
  getPackageById,
  createPackage,
  updatePackage,
  deletePackage,
} = require("../controllers/packages.controller");
const { authenticate } = require("../middlewares/authenticate");
const { authorize } = require("../middlewares/authorize");
const { ROLES } = require("../constants/roles");

const packagesRouter = express.Router();

packagesRouter.get("/", listPackages);
packagesRouter.get("/:id", getPackageById);
packagesRouter.post("/", authenticate, authorize(ROLES.AGENT), createPackage);
packagesRouter.put("/:id", authenticate, authorize(ROLES.AGENT), updatePackage);
packagesRouter.delete(
  "/:id",
  authenticate,
  authorize(ROLES.AGENT, ROLES.ADMIN),
  deletePackage
);

module.exports = { packagesRouter };
