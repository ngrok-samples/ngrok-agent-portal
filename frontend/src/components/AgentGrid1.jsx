// Import necessary components
import * as React from "react";
import { Button } from "@mui/material";
import {
  DataGrid,
  GridColDef,
  GridRowModel,
  GridRenderEditCellParams,
  useGridApiContext,
  GridColTypeDef,
  GridCellEditStopReasons,
} from "@mui/x-data-grid";
import InputBase, { InputBaseProps } from "@mui/material/InputBase";
import Popper from "@mui/material/Popper";
import Paper from "@mui/material/Paper";
import {
  randomInt,
  randomUserName,
  randomArrayItem,
} from "@mui/x-data-grid-generator";

// Sample rows data
var rows = [
  {
    id: 1,
    agentId: "550e8400-e29b-41d4-a716-446655440000",
    agentToken: "Token-1",
    authToken: "Auth-1",
    apiKey: "APIKey-1",
    agentYaml: "tunnels:\n  first:\n    addr: 80\n    proto: http",
  },
  {
    id: 2,
    agentId: "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
    agentToken: "Token-2",
    authToken: "Auth-2",
    apiKey: "APIKey-2",
    agentYaml: "tunnels:\n  second:\n    addr: 80\n    proto: http",
  },
  {
    id: 3,
    agentId: "6ba7b811-9dad-11d1-80b4-00c04fd430c9",
    agentToken: "Token-3",
    authToken: "Auth-3",
    apiKey: "APIKey-3",
    agentYaml: "tunnels:\n  third:\n    addr: 80\n    proto: http",
  },
  {
    id: 4,
    agentId: "6ba7b812-9dad-11d1-80b4-00c04fd430c0",
    agentToken: "Token-4",
    authToken: "Auth-4",
    apiKey: "APIKey-4",
    agentYaml: "tunnels:\n  fourth:\n    addr: 80\n    proto: http",
  },
  {
    id: 5,
    agentId: "6ba7b813-9dad-11d1-80b4-00c04fd430c1",
    agentToken: "Token-5",
    authToken: "Auth-5",
    apiKey: "APIKey-5",
    agentYaml: "tunnels:\n  fifth:\n    addr: 80\n    proto: http",
  },
];

function renderAgentAddButton() {
  return (
    <Button
      variant='contained'
      color='primary'
      onClick={() => {
        const idToAdd = rows.length + 1;
        const newRow = {
          id: idToAdd,
          agentId: "",
          agentToken: "",
          authToken: "",
          apiKey: "",
          agentYaml: "",
        };
        rows = [...rows, newRow];
      }}
    >
      Add
    </Button>
  );
}

function renderAgentDeleteButton(params) {
  return (
    <Button
      variant='contained'
      color='secondary'
      onClick={() => {
        const idToDelete = params.id;
        const newRows = rows.filter((row) => row.id !== idToDelete);
        rows = newRows;
      }}
    >
      Delete
    </Button>
  );
}

function EditTextarea(props) {
  const { id, field, value, colDef, hasFocus } = props;
  const [valueState, setValueState] = React.useState(value);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [inputRef, setInputRef] = React.useState(null);
  const apiRef = useGridApiContext();

  React.useLayoutEffect(() => {
    if (hasFocus && inputRef) {
      inputRef.focus();
    }
  }, [hasFocus, inputRef]);

  const handleRef = React.useCallback((el) => {
    setAnchorEl(el);
  }, []);

  const handleChange = React.useCallback(
    (event) => {
      const newValue = event.target.value;
      setValueState(newValue);
      apiRef.current.setEditCellValue(
        { id, field, value: newValue, debounceMs: 200 },
        event
      );
    },
    [apiRef, field, id]
  );

  return (
    <div style={{ position: "relative", alignSelf: "flex-start" }}>
      <div
        ref={handleRef}
        style={{
          height: 1,
          width: colDef.computedWidth,
          display: "block",
          position: "absolute",
          top: 0,
        }}
      />
      {anchorEl && (
        <Popper open anchorEl={anchorEl} placement='bottom-start'>
          <Paper elevation={1} sx={{ p: 1, minWidth: colDef.computedWidth }}>
            <InputBase
              multiline
              rows={4}
              value={valueState}
              sx={{ textarea: { resize: "both" }, width: "100%" }}
              onChange={handleChange}
              inputRef={setInputRef}
            />
          </Paper>
        </Popper>
      )}
    </div>
  );
}

const multilineColumn = {
  type: "string",
  renderEditCell: (params) => <EditTextarea {...params} />,
};

const columns = [
  {
    field: "deleteButton",
    renderHeader: renderAgentAddButton,
    renderCell: renderAgentDeleteButton,
    width: 150,
  },
  { field: "agentId", headerName: "Agent ID", width: 150 },
  { field: "agentToken", headerName: "Agent Token", width: 150 },
  { field: "authToken", headerName: "Auth Token", width: 150, editable: true },
  { field: "apiKey", headerName: "API Key", width: 150, editable: true },
  {
    field: "agentYaml",
    headerName: "Agent YAML",
    width: 600,
    editable: true,
    ...multilineColumn,
  },
];

export default function AgentGrid() {
  return (
    <div style={{ height: 400, width: "100%" }}>
      <DataGrid
        rows={rows}
        columns={columns}
        pageSize={5}
        rowsPerPageOptions={[5]}
        checkboxSelection
      />
    </div>
  );
}
