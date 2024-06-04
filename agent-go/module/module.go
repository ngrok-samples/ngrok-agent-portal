package module

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"os"

	"gopkg.in/yaml.v2"
)

var endpoints []map[string]interface{}

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
	req.Header.Set("Token", agentToken)

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
	for i, endpoint := range endpoints {
		if endpoint["id"] == id {
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

func loadEndpointYaml(endpoint map[string]interface{}) (interface{}, error) {
	yamlContent, ok := endpoint["endpointYaml"].(string)
	if !ok {
		return nil, fmt.Errorf("endpointYaml not found or is not a string")
	}

	if isValidYAML(yamlContent) {
		var endpointYaml interface{}
		err := yaml.Unmarshal([]byte(yamlContent), &endpointYaml)
		if err != nil {
			return nil, fmt.Errorf("error unmarshalling endpointYaml: %v", err)
		}
		return endpointYaml, nil
	}

	return nil, fmt.Errorf("invalid YAML content")
}
func UpdateEndpointStatus(id string) (map[string]interface{}, error) {
	for _, endpoint := range endpoints {
		if endpoint["id"] == id {
			if endpoint["status"] == "offline" {
				endpoint["status"] = "online"

				endpointYaml, err := loadEndpointYaml(endpoint)
				if err != nil {
					return nil, err
				}
				fmt.Printf("Loaded YAML for endpoint %s: %v\n", endpoint["id"], endpointYaml)

				return endpoint, nil
			} else {
				endpoint["status"] = "offline"
				return endpoint, nil
			}
		}
	}
	return nil, fmt.Errorf("endpoint with id %s not found", id)
}
