const express = require("express");
const agentEndpointController = require("../controllers/agentEndpointController");

const router = express.Router();

router
  .route("/:agentId")
  .get(agentEndpointController.getAgentEndpoints)
  .post(agentEndpointController.createEndpoint);

router
  .route("/getEndpointStatus/:agentId")
  .get(agentEndpointController.getEndpointStatus);

router
  .route("/:agentId/:endpointId")
  .patch(agentEndpointController.updateEndpoint)
  .delete(agentEndpointController.deleteEndpoint);

router
  .route("/updateStatus/:agentId/:endpointId")
  .patch(agentEndpointController.updateEndPointStatus);

module.exports = router;
