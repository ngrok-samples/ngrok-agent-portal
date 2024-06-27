const express = require("express");
const agentEndpointController = require("../controllers/agentEndpointController");
const validateAgent = require("../middleware/validateAgent");

const router = express.Router();

router.use(validateAgent);

//To get agent status
router.route("/").get(agentEndpointController.getAgentStatus);

//to Update Status of agent
router
  .route("/updateStatus/:endpointId")
  .patch(agentEndpointController.updateEndPointStatus);

//To get endpoint status
router
  .route("/getEndPointStatus/:agentId")
  .get(agentEndpointController.getEndPointStatus);

//To add Enpoint
router.route("/addEndpoint/").post(agentEndpointController.addEndpoint);

//To Update Endpoint
router
  .route("/updateEndpoint/:endpointId")
  .patch(agentEndpointController.updateEndpoint);

//To delete endpoint
router
  .route("/deleteEndpoint/:endpointId")
  .delete(agentEndpointController.deleteEndpoint);

module.exports = router;
