const mongoose = require("mongoose");
const YAML = require("js-yaml");
var validator = require("validator");

var AgentSchema = mongoose.Schema(
  {
    _id: {
      type: String,
    },
    agentToken: {
      type: String,
      required: [true, "Agent Token cannot be empty"],
    },
    authToken: {
      type: String,
      required: [true, "Agent Auth Token cannot be empty"],
    },
    apiKey: {
      type: String,
      required: [true, "API key cannot be empty"],
    },
    agentYaml: {
      type: String,
      required: [true, "API key cannot be empty"],
      validate: {
        validator: function (value) {
          try {
            // Attempt to parse the YAML
            YAML.load(value);
            return true; // Validation succeeds if parsing is successful
          } catch (error) {
            return false; // Validation fails if there's an error during parsing
          }
        },
        message: (props) => `${props.value} is not a valid YAML format`,
      },
    },
    agentAddress: {
      type: String,
      validate: {
        validator: (value) => {
          return (
            validator.isURL(value, {
              protocols: ["http", "https", "ftp"],
              require_tld: false,
              require_protocol: true,
              allow_query_components: false,
            }) && !`${value}`.endsWith("/")
          );
        },
        message: "Agent Adress must be a Valid URL",
      },
      required: [true, "Agent Adress cannot be empty"],
    },
    endpoints: [
      {
        _id: {
          type: String,
          required: [true, "Agent endpoint cannot be empty"],
          unique: [true, "Agent endpoint must be unique"], // If you want to enforce uniqueness for your custom _id
        },
        name: {
          type: String,
          required: [true, "Agent Endpoint name cannot be empty"],
        },
        // proto: {
        //   type: String,
        //   enum: ["http", "tls", "tcp"],
        //   required: [true, "Agent endpoint protocol cannot be empty"],
        // },
        // endPointaddr: {
        //   type: String,
        //   required: [true, "Endpoint Add cannot be empty"],
        // },
        // crt: {
        //   type: String,
        // },
        // key: {
        //   type: String,
        // },
        endpointYaml: {
          type: String,
          required: [true, "Endpoint YAML cannot be empty"],
          validate: {
            validator: function (value) {
              try {
                // Attempt to parse the YAML
                YAML.load(value);
                return true; // Validation succeeds if parsing is successful
              } catch (error) {
                return false; // Validation fails if there's an error during parsing
              }
            },
            message: (props) => `${props.value} is not a valid YAML format`,
          },
        },
        createdOn: {
          type: Date,
          default: Date.now(),
        },
        updatedOn: {
          type: Date,
          default: Date.now(),
        },
      },
    ],
    createdOn: {
      type: Date,
      default: Date.now(),
    },
    updatedOn: {
      type: Date,
      default: Date.now(),
    },
  },
  { _id: false }
);

// Create a compound unique index on 'name' within 'endpoints' array for each agent
AgentSchema.index({ "endpoints.name": 1, _id: 1 }, { unique: true });

let Agent;

if (!mongoose.models["Agent"]) {
  Agent = mongoose.model("Agent", AgentSchema);
} else {
  Agent = mongoose.models["Agent"];
}
module.exports = Agent;
