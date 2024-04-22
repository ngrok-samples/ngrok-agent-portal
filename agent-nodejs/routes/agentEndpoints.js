const express = require("express");
const agentEndpointController = require("../controllers/agentEndpointController");

const router = express.Router();

router.route("/").get(agentEndpointController.getAgentStatus);

router
  .route("/updateStatus/:endpointId")
  .patch(agentEndpointController.updateEndPointStatus);

router
  .route("/getEndPointStatus/:agentId")
  .get(agentEndpointController.getEndPointStatus);

router.route("/addEndpoint/").post(agentEndpointController.addEndpoint);

router
  .route("/deleteEndpoint/:endpointId")
  .delete(agentEndpointController.deleteEndpoint);

module.exports = router;
