const express = require("express");
const {
  listPackages,
  getPackageById,
  getPackageDetails,
  getDestinationCounts,
  createPackage,
  updatePackage,
  deletePackage,
  optInForPackage,
  myPackageInterests,
} = require("../controllers/packages.controller");
const { authenticate } = require("../middlewares/authenticate");
const { authorize } = require("../middlewares/authorize");
const { ROLES } = require("../constants/roles");

const packagesRouter = express.Router();

packagesRouter.get("/destination-counts", getDestinationCounts);
packagesRouter.get("/", listPackages);
packagesRouter.get("/interests/my", authenticate, authorize(ROLES.AGENT), myPackageInterests);
packagesRouter.get("/:id/details", getPackageDetails);
packagesRouter.post("/:id/interest", authenticate, authorize(ROLES.AGENT), optInForPackage);
packagesRouter.get("/:id", getPackageById);
packagesRouter.post("/", authenticate, authorize(ROLES.ADMIN), createPackage);
packagesRouter.put("/:id", authenticate, authorize(ROLES.ADMIN), updatePackage);
packagesRouter.delete("/:id", authenticate, authorize(ROLES.ADMIN), deletePackage);

module.exports = { packagesRouter };
