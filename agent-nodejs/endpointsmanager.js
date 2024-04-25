const logger = require("./utils/logger");
const yaml = require('js-yaml');
const agentEndpointController = require("./controllers/agentEndpointController");
const ngrok = require("@ngrok/ngrok");

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

async function changeEndpointsStatus(id) {
    let success = false;

    const endpoint = endpoints.find(e => e.id === id);
    if (endpoint.status === "offline") {
        logger.debug(JSON.stringify(endpoint));
        let endpointYaml = '';
        try {
            endpointYaml = yaml.load(endpoint.endpointYaml);
        } catch (yamlError) {
            logger.error(`Failed to parse YAML for endpoint ${id}: ${yamlError.message}`);
            success = false;
            return {
                success,
                data: endpoints,
            };
        }
        logger.debug("Starting endpoint " + endpoint.name + " with options: " + JSON.stringify(endpointYaml));
        try {
            const listener = await ngrok.forward({...{authtoken_from_env: true}, ...endpointYaml});
            console.log(`Ingress established for endpoint ${endpoint.name} at: ${listener.url()}`);
            endpoint.listener = listener;
            endpoint.status = "online";
            success = true;
            return {
                success,
                data: endpoints,
            };
        } catch (err) {
            console.log('listener setup error: ' + err);
            success = false;
            return {
                success,
                data: endpoints,
            };
        }
    } else {
        logger.debug("Stopping endpoint " + endpoint.name);
        try {
            await endpoint.listener.close();
            console.debug(`Ingress closed`);
            endpoint.status = "offline";
            success = true;
            return {
                success,
                data: endpoints,
            };
        } catch(err) {
            console.log('listener close error: ' + err);
            success = false;
            return {
                success,
                data: endpoints,
            };
        }
    }
}

function getEndpoints() {
    return endpoints;
}

function addEndpoint(endpoint) {
    endpoints.push({
        ...endpoint,
        status: "offline",
        listener: null,
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

