const express = require("express");
const { authenticate } = require("../middlewares/authenticate");
const {
  createTicket,
  getMyTickets,
  getTicket,
  addMessage,
  updateMyTicketStatus,
} = require("../controllers/tickets.controller");

const ticketsRouter = express.Router();

// All routes require authentication (both agents and customers can use tickets)
ticketsRouter.use(authenticate);

ticketsRouter.post("/", createTicket);
ticketsRouter.get("/", getMyTickets);
ticketsRouter.get("/:id", getTicket);
ticketsRouter.post("/:id/messages", addMessage);
ticketsRouter.patch("/:id/status", updateMyTicketStatus);

module.exports = { ticketsRouter };
