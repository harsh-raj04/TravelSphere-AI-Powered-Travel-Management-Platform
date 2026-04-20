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
packagesRouter.post("/", authenticate, authorize(ROLES.ADMIN), createPackage);
packagesRouter.put("/:id", authenticate, authorize(ROLES.ADMIN), updatePackage);
packagesRouter.delete("/:id", authenticate, authorize(ROLES.ADMIN), deletePackage);

module.exports = { packagesRouter };
