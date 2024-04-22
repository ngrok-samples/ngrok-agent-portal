const agentEndpointController = require("./controllers/agentEndpointController");
let endpoints = [];

async function initializeAgentConfig() {
  const response = await agentEndpointController.fetchAgentConfig();
  if (response.success) {
    endpoints = response.data.map((x) => {
      return {
        ...x,
        status: "offline",
      };
    });
  }
}

function changeEndpointsStatus(id) {
  let success = false;

  endpoints = endpoints.map((e) => {
    if (e.id === id) {
      e.status = e.status === "online" ? "offline" : "online";
      success = true;
    }
    return e;
  });
  return {
    success,
    data: endpoints,
  };
}

function getEndpoints() {
  return endpoints;
}

function addEndpoint(endpoint) {
  endpoints.push({
    ...endpoint,
    status: "offline",
  });
  return endpoints;
}

function deleteEndpoint(id) {
  endpoints = endpoints.filter((e) => e.id !== id);
  return endpoints;
}
module.exports = {
  initializeAgentConfig,
  changeEndpointsStatus,
  getEndpoints,
  addEndpoint,
  deleteEndpoint,
};
