const express = require("express");
const agentController = require("../controllers/agentController");

const router = express.Router();

router.route("/").get(agentController.getAll).post(agentController.createOne);

router.route("/checkAgentStatus/:id").get(agentController.checkAgentStatus);

router
  .route("/:id")
  .get(agentController.getOne)
  .patch(agentController.update)
  .delete(agentController.delete);

module.exports = router;
