import axios from "axios";

let baseURL = "http://localhost:8000/api/v1";

const instance = axios.create({
  baseURL,
});
export default instance;
