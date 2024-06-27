package module

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"os"
	"strings"
	"sync"

	"golang.ngrok.com/ngrok"
	"golang.ngrok.com/ngrok/config"
	ngrok_config "golang.ngrok.com/ngrok/config"
	ngrok_log "golang.ngrok.com/ngrok/log"
	"gopkg.in/yaml.v2"
)

type logger struct {
	lvl ngrok_log.LogLevel
}

func (l *logger) Log(ctx context.Context, lvl ngrok_log.LogLevel, msg string, data map[string]interface{}) {
	if lvl > l.lvl {
		return
	}
	lvlName, _ := ngrok_log.StringFromLogLevel(lvl)
	log.Printf("[%s] %s %v", lvlName, msg, data)
}

var l *logger = &logger{
	lvl: ngrok_log.LogLevelDebug,
}

var (
	endpoints = []map[string]interface{}{}
	listeners = make(map[string]ngrok.Forwarder) // Change to ngrok.Forwarder
	mu        sync.Mutex
)

func FetchAgentConfig() {
	agentID := os.Getenv("AGENT_ID")
	agentToken := os.Getenv("AGENT_TOKEN")
	baseUrl := os.Getenv("BACKEND_URL")

	if agentID == "" || agentToken == "" || baseUrl == "" {
		log.Fatal("Environment variables AGENT_ID, AGENT_TOKEN, or BACKEND_URL not set")
	}

	url := baseUrl + "/api/v1/endpoint/" + agentID

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		log.Fatalf("Error creating HTTP request: %v", err)
	}
	req.Header.Set("AGENT_ID", agentID)
	req.Header.Set("AGENT_TOKEN", agentToken)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		log.Fatalf("Error making HTTP request: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		log.Fatalf("Non-200 response from server: %d %s", resp.StatusCode, resp.Status)
	}

	log.Println("HTTP request successful")

	var apiResp map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&apiResp); err != nil {
		log.Fatalf("Error decoding JSON response: %v", err)
	}

	log.Println("JSON response decoded successfully")

	data, ok := apiResp["data"].(map[string]interface{})
	if !ok {
		log.Fatalf("Unexpected JSON structure: missing 'data' field")
	}

	log.Println("Found 'data' field in JSON response")

	doc, ok := data["doc"].([]interface{})
	if !ok {
		log.Fatalf("Unexpected JSON structure: 'doc' field is not an array")
	}

	log.Printf("Found %d items in 'doc' array", len(doc))

	endpoints = make([]map[string]interface{}, len(doc))
	for i, item := range doc {
		endpoint, ok := item.(map[string]interface{})
		if !ok {
			log.Fatalf("Unexpected JSON structure: item in 'doc' array is not an object")
		}
		endpoint["status"] = "offline"
		endpoints[i] = endpoint
		endpoints[i]["id"] = endpoint["_id"]
		delete(endpoints[i], "_id")
	}

	log.Println("Endpoints processed successfully")

	log.Println("Final endpoints:")
	for i, endpoint := range endpoints {
		log.Printf("Endpoint %d: %+v", i, endpoint)
	}
}

func GetAllEndPoints() []map[string]interface{} {
	return endpoints
}

func GetEndpointStatus(id string) map[string]interface{} {
	for _, endpoint := range endpoints {
		if endpoint["id"] == id {
			return endpoint
		}
	}
	return map[string]interface{}{}
}

func AddEndpoint(id string, endpointYaml string, listener interface{}) (map[string]interface{}, error) {
	newEndpoint := map[string]interface{}{
		"id":           id,
		"status":       "offline",
		"listener":     listener,
		"endpointYaml": endpointYaml,
	}

	endpoints = append(endpoints, newEndpoint)
	return newEndpoint, nil
}

func DeleteEndpoint(id string) {
	mu.Lock()
	defer mu.Unlock()
	for i, endpoint := range endpoints {
		if endpoint["id"] == id {
			if listener, ok := listeners[id]; ok {
				listener.Close()
				delete(listeners, id)
			}
			endpoints = append(endpoints[:i], endpoints[i+1:]...)
			break
		}
	}
}

func isValidYAML(yamlContent string) bool {
	var content interface{}
	err := yaml.Unmarshal([]byte(yamlContent), &content)
	return err == nil
}

func loadEndpointYaml(endpoint map[string]interface{}) (map[string]interface{}, error) {
	yamlContent, ok := endpoint["endpointYaml"].(string)
	if !ok {
		return nil, fmt.Errorf("endpointYaml not found or is not a string")
	}

	if isValidYAML(yamlContent) {
		var endpointYaml map[string]interface{}
		err := yaml.Unmarshal([]byte(yamlContent), &endpointYaml)
		if err != nil {
			return nil, fmt.Errorf("error unmarshalling endpointYaml: %v", err)
		}
		return endpointYaml, nil
	}

	return nil, fmt.Errorf("invalid YAML content")
}

func run(ctx context.Context, backend *url.URL, authtoken string, id string, endpointYaml map[string]interface{}) error {
	log.Println("Connecting to ngrok...")

	// 10 seconds timeout to avoid indefinite retries
	//connectCtx, cancel := context.WithTimeout(ctx, 10*time.Second)
	//defer cancel()

	// Try connecting to ngrok with a timeout context
	//sess, err := ngrok.Connect(connectCtx,
	sess, err := ngrok.Connect(context.Background(),
		ngrok.WithAuthtoken(authtoken),
		ngrok.WithLogger(&logger{lvl: ngrok_log.LogLevelDebug}),
	)
	if err != nil {
		if strings.Contains(err.Error(), "authentication failed") {
			return fmt.Errorf("invalid ngrok authtoken: %w", err)
		}
		return fmt.Errorf("failed to connect to ngrok: %w", err)
	}
	log.Println("Successfully connected to ngrok.")

	// Extract proto from endpointYaml
	proto, protoExists := endpointYaml["proto"].(string)
	if !protoExists {
		return fmt.Errorf("proto not found in endpointYaml")
	}

	var fwd ngrok.Forwarder
	switch proto {
	case "http":
		log.Println("Setting up HTTP forwarding...")
		options := []ngrok_config.HTTPEndpointOption{}

		// Conditionally include the domain option if present
		if domain, domainExists := endpointYaml["domain"].(string); domainExists {
			options = append(options, ngrok_config.WithDomain(domain))
		}

		// Add other configuration options based on endpointYaml if needed
		fwd, err = sess.ListenAndForward(ctx, backend, ngrok_config.HTTPEndpoint(options...))
	case "https":
		log.Println("Setting up HTTP forwarding...")
		options := []ngrok_config.HTTPEndpointOption{}

		// Conditionally include the domain option if present
		if domain, domainExists := endpointYaml["domain"].(string); domainExists {
			options = append(options, ngrok_config.WithDomain(domain))
		}

		// Add other configuration options based on endpointYaml if needed
		// fwd, err = sess.ListenAndForward(ctx, backend, ngrok_config.HTTPEndpoint(options...))
		fwd, err = sess.ListenAndForward(ctx,
			backend,
			config.HTTPEndpoint(),
		)
		if err != nil {
			return err
		}

		l.Log(ctx, ngrok_log.LogLevelInfo, "ingress established", map[string]any{
			"url": fwd.URL(),
		})

		err = fwd.Wait()
		if err == nil {
			return nil
		}
		l.Log(ctx, ngrok_log.LogLevelWarn, "accept error. now setting up a new forwarder.",
			map[string]any{"err": err})

	case "tcp":
		log.Println("Setting up TCP forwarding...")

		// Extract remote_addr if specified
		var remoteAddr string
		if remoteAddrValue, remoteAddrExists := endpointYaml["remote_addr"]; remoteAddrExists {
			switch v := remoteAddrValue.(type) {
			case string:
				remoteAddr = v
			case int:
				remoteAddr = fmt.Sprintf("0.tcp.ngrok.io:%d", v)
			case float64:
				remoteAddr = fmt.Sprintf("0.tcp.ngrok.io:%d", int(v))
			default:
				return fmt.Errorf("remote_addr has an unsupported type in endpointYaml")
			}
		}

		options := []ngrok_config.TCPEndpointOption{}
		if remoteAddr != "" {
			options = append(options, ngrok_config.WithRemoteAddr(remoteAddr))
		}

		// Add other configuration options based on endpointYaml if needed
		fwd, err = sess.ListenAndForward(ctx, backend, ngrok_config.TCPEndpoint(options...))
	default:
		return fmt.Errorf("unsupported protocol: %s", proto)
	}

	if err != nil {
		return fmt.Errorf("failed to listen and forward: %w", err)
	}

	log.Printf("Ingress established: %s", fwd.URL())

	mu.Lock()
	listeners[id] = fwd // Store the listener in the map
	mu.Unlock()

	// Wait for the forwarder to complete
	err = fwd.Wait()
	if err != nil {
		log.Printf("Forwarder error: %v", err)
		// Remove the listener from the map on error
		// mu.Lock()
		// delete(listeners, id)
		// mu.Unlock()
		return fmt.Errorf("forwarder error: %w", err)
	}

	return nil
}

func stopNgrokListener(id string) error {
	mu.Lock()
	defer mu.Unlock()

	listener, exists := listeners[id]
	if !exists {
		return fmt.Errorf("listener with id %s not found", id)
	}

	log.Printf("Stopping ngrok listener for id: %s", id)
	if err := listener.Close(); err != nil {
		return fmt.Errorf("failed to stop ngrok listener: %w", err)
	}

	delete(listeners, id) // Remove listener from the map
	log.Printf("ngrok listener for id %s stopped successfully", id)

	return nil
}

func UpdateEndpointStatus(id string, authToken string) (map[string]interface{}, error) {
	for _, endpoint := range endpoints {
		if endpoint["id"] == id {
			if endpoint["status"] == "offline" {
				endpoint["status"] = "online"

				// Load endpoint YAML
				endpointYaml, err := loadEndpointYaml(endpoint)
				if err != nil {
					return nil, err
				}
				fmt.Printf("Loaded YAML for endpoint %s: %v\n", endpoint["id"], endpointYaml)

				// Extract proto and addr from endpointYaml
				proto, protoExists := endpointYaml["proto"].(string)
				if !protoExists {
					return nil, fmt.Errorf("proto not found in endpointYaml")
				}

				var addr string
				addrValue, addrExists := endpointYaml["addr"]
				if !addrExists {
					return nil, fmt.Errorf("addr not found in endpointYaml")
				}

				switch v := addrValue.(type) {
				case string:
					addr = v
				case int:
					addr = fmt.Sprintf("localhost:%d", v)
				case float64:
					addr = fmt.Sprintf("localhost:%d", int(v))
				default:
					return nil, fmt.Errorf("addr has an unsupported type in endpointYaml")
				}

				backend := fmt.Sprintf("%s://%s", proto, addr)
				backendUrl, err := url.Parse(backend)
				if err != nil {
					return nil, fmt.Errorf("failed to parse backend URL: %v", err)
				}

				if err := run(context.Background(), backendUrl, authToken, id, endpointYaml); err != nil {
					if strings.Contains(err.Error(), "invalid ngrok authtoken") {
						return nil, fmt.Errorf("invalid ngrok authtoken: %w", err)
					}
					return nil, err
				}

				return endpoint, nil
			} else {
				endpoint["status"] = "offline"
				err := stopNgrokListener(id)
				if err != nil {
					return nil, fmt.Errorf("failed to stop ngrok listener for id %s: %v", id, err)
				}

				// mu.Lock()
				// delete(listeners, id) // Ensure the listener is removed from the map
				// mu.Unlock()

				return endpoint, nil
			}
		}
	}
	return nil, fmt.Errorf("endpoint with id %s not found", id)
}
