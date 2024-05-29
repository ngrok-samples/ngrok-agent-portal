# Getting Started with ngrok agent portal

This portal serves as an example for how to create your own custom ngrok agents
using the ngrok SDKs. There are 3 major components

## backend

The backend is an api service for defining and manipulating agent instances and
their configuration. It requires a connection to a mongodb instance and will
bind to a port on localhost requiring no authentication. Steps to start it:

```
cd backend
npm install
npm run startmongo

cat << EOF >> .env
NODE_ENV=development
DATABASE=mongodb://127.0.0.1:27017/portal?retryWrites=true&w=majority
PORT=8000
EOF

npm run start
```

## frontend

The frontend is a react application that talks to the backend api. It assumes
the backend api URL is http://localhost:8000 to match the above config, but
if you want to run the backend on a different port or have it proxied through
an ngrok endpoint, just change the baseURL parameter in
`frontend/src/utils/axios.js`

Steps to start it:

```
cd frontend
npm install
npm run start
```

When you create a new agent definition, that agent will be auto-assigned a
unique GUID to represent that agent. For each agent instance, The user is
responsible for giving the backend the following information. It is recommend
that you create a separate ngrok bot user for each agent, and allocate
ngrok authtokens and api keys to that agent's bot user. You can also use the
actual bot user id as the agent token if you want to.

| Field         | Description                                                                     | Example Values                                                                   |
| :------------ | :------------------------------------------------------------------------------ | :------------------------------------------------------------------------------- |
| Agent ID      | An auto-generated GUID uniquiely representing this agent (immutable)            | 53d6584f-9823-46d3-b4c5-1d0c3801154f                                             |
| Agent Token   | A secret authentication token unique to this agent instance                     | bot_2ckSNXNt0jCAnKa0xBBBJUyjMsE                                                  |
| Agent Address | Agent API endpoint URL accessible to the backend for issuing agent commands     | http://localhost:8001                                                            |
| Auth Token    | A valid ngrok authtoken                                                         | 2ckGMqwbYtWq2bNtwiuPrKX12Vg_6sLmax7Y9ZR23C5PGKpSR                                |
| API Key       | A valid ngrok API key                                                           | 2ckSsZC9HkVZ7lsLKD1lfpdWkF8_4qy21MXtBreM2pt9Eme8F                                |
| Agent YAML    | The top portion of a normal agent ngrok.yml file (excluding tunnel definitions) | version: "2"<br>server_addr: tunnel.us.connect.example.com:443<br>root_cas: host |

Once the agent starts and comes online, the status indicator for the agent will
change from red to green.

In order to define endpoints for the agent click the tunnel icon and it will
bring up the endpoint editor dialog. You will define one endpoint for each
tunnel that you want the agent to start, and you need only supply an endpoint
name and the endpoint yaml. For example:

| Endpoint Name | Endpoint YAML                                            |
| :------------ | :------------------------------------------------------- |
| webserver     | proto: http<br>addr: 8080<br>domain: website.example.com |

For each endpoint, there is a status indicator from the agent saying whether
the endpoint is online or offline. If the endpoint is offline, you can press
the play button to start the endpoint tunnel, and if it is online you can press
the stop button to bring the tunnel down.

## agent-nodejs

The agent-nodejs is the agent code itself, written in nodejs and using the
ngrok nodejs SDK. It itself presents an api service for the backend to send
realtime configuration changes as well as commands to start and stop endpoint
tunnels. It will bind to a port on localhost requiring no authentication.
Steps to start it:

```
cd agent-nodejs
npm install

cat << EOF >> .env
NODE_ENV=development
PORT=8001

BACKEND_URL=http://localhost:8000
AGENT_ID=53d6584f-9823-46d3-b4c5-1d0c3801154f
AGENT_TOKEN=bot_2ckSNXNt0jCAnKa0xBBBJUyjMsE
EOF

npm run start
```

## agent-python

Make Python is install and all its path is setup to get python and pip working in terminal

```
cd agent-python
virtualenv .venv
. .venv/bin/activate
pip install -r  requirements.txt
or to install all the packages listed in requirements.txt in the current directory for the current user.
pip install --user -r requirements.txt
cat << EOF >> .env
ENV=development
PORT=8001

BACKEND_URL=http://localhost:8000
AGENT_ID=53d6584f-9823-46d3-b4c5-1d0c3801154f
AGENT_TOKEN=bot_2ckSNXNt0jCAnKa0xBBBJUyjMsE
EOF

python server.py
```
