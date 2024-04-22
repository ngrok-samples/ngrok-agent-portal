import logo from "./logo.svg";
import "./App.css";
import { ThemeProvider } from "@mui/material/styles";
import theme from "./utils/theme"; // Import the theme you just created
import AgentGrid from "./components/AgentGrid"; // Adjust the path as necessary

function App() {
  return (
    <ThemeProvider theme={theme}>
      <AgentGrid />
    </ThemeProvider>
  );
}

export default App;
