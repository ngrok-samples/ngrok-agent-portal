import React, { useState, useEffect } from "react";
import {
  CircularProgress,
  Dialog,
  DialogContent,
  Grid,
  Typography,
  Button,
  Snackbar,
  Alert,
  Paper,
  Popper,
  InputBase,
  Tooltip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/DeleteOutlined";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Close";
import GetAppIcon from "@mui/icons-material/GetApp";
import CircleIcon from "@mui/icons-material/Circle";
import CellTowerIcon from "@mui/icons-material/CellTower";

import {
  GridRowModes,
  DataGrid,
  GridToolbarContainer,
  GridActionsCellItem,
  GridRowEditStopReasons,
  useGridApiRef,
  useGridApiContext,
} from "@mui/x-data-grid";
import { v4 as uuidv4 } from "uuid";
import jsYaml from "js-yaml";
import validator from "validator";
import axiosInstance from "../utils/axios";
import axios from "axios";
import AgentEndpointsDialog from "./AgentEndpointsDialog";
import RenderExpandableCell from "./RenderExpandableCell";
import EditTextarea from "./EditTextarea";
const initialRows = [
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

function EditToolbar(props) {
  const { rows, setRows, setRowModesModel } = props;

  const handleClick = () => {
    //const id = ksuid.randomSync().toString();
    const id = uuidv4();
    setRows((oldRows) => [
      {
        id,
        agentToken: "",
        createdOn: new Date().toString(),
        authToken: "",
        apiKey: "",
        agentYaml: "",
        agentAddress: "",
        isNew: true,
      },
      ...oldRows,
    ]);
    setRowModesModel((oldModel) => ({
      ...oldModel,
      [id]: { mode: GridRowModes.Edit, fieldToFocus: "agentToken" },
    }));
  };

  const exportToYaml = () => {
    const yamlData = jsYaml.dump(rows);

    // Create a Blob containing the YAML data
    const blob = new Blob([yamlData], {
      type: "application/yaml;charset=utf-8;",
    });

    // Create a link element to download the YAML file
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute("download", "export.yaml");
    document.body.appendChild(link);

    // Trigger a click on the link to start the download
    link.click();

    // Remove the link from the DOM
    document.body.removeChild(link);
  };
  return (
    <GridToolbarContainer>
      <Grid container justifyContent='flex-end' gap='20px' sx={{ p: "10px" }}>
        {rows.length > 0 && (
          <Grid item>
            <Button
              variant='contained'
              startIcon={<GetAppIcon />}
              onClick={exportToYaml}
              sx={{ textTransform: "none", px: "30px" }}
            >
              Export data
            </Button>
          </Grid>
        )}
        <Grid item>
          <Button
            variant='contained'
            startIcon={<AddIcon />}
            onClick={handleClick}
            sx={{ textTransform: "none", px: "30px" }}
          >
            Add Agent
          </Button>
        </Grid>
      </Grid>
    </GridToolbarContainer>
  );
}

export default function FullFeaturedCrudGrid() {
  const [rows, setRows] = useState([]);
  const [rowsLoaded, setRowsLoaded] = useState(false);
  const apiRef = useGridApiRef();
  const [rowModesModel, setRowModesModel] = useState({});
  const [loading, setLoading] = useState({
    active: false,
    action: "",
  });
  const [showToast, setShowToast] = useState({
    active: false,
    message: "",
    severity: "",
  });
  const [error, setError] = useState({
    active: false,
    message: "",
    action: "",
  });
  const [showDeleteModal, setShowDeleteModal] = React.useState({
    active: false,
    rowId: null,
  });
  const [showEndpointsDialog, setShowEndpointDialog] = useState({
    active: false,
    row: null,
  });

  const checkAgentStatus = async () => {
    //agentAddress
    if (rows.length === 0) return;
    let newAgentList = await Promise.all(
      rows.map(async (row) => {
        try {
          const response = await axios.get(`${row.agentAddress}`);
          if (response.data.success) {
            row.statusLoaded = true;
            row.status = "online";
          } else {
            row.statusLoaded = true;
            row.status = "offline";
          }
        } catch (err) {
          row.statusLoaded = true;
          row.status = "offline";
        }
        return row;
      })
    );
    if (showEndpointsDialog.active && showEndpointsDialog.row !== null) {
      let newRow = newAgentList.find(
        (x) => x.id === showEndpointsDialog.row.id
      );
      if (newRow) {
        setShowEndpointDialog((s) => {
          return {
            ...s,
            row: newRow,
          };
        });
      }
    }
    setRows(newAgentList);
  };
  const fetchData = async () => {
    try {
      setLoading({
        active: true,
        action: "page",
      });
      const response = await axiosInstance.get(`/agent/`);
      if (response.data.success) {
        const agentList = response.data.data.doc.map((x) => {
          return {
            ...x,
            id: x._id,
            endpoints: x.endpoints
              ? x.endpoints.map((endpoint) => {
                  return {
                    ...endpoint,
                    id: endpoint._id,
                  };
                })
              : [],
            statusLoaded: false,
          };
        });
        setRows(agentList);
      } else {
        setError({
          active: true,
          message: response.data.message,
          action: "page",
        });
      }
      setLoading({
        active: false,
        action: "",
      });
    } catch (err) {
      const errorRes = err.response?.data;

      setLoading({
        active: false,
        action: "",
      });

      setError({
        active: true,
        message: errorRes?.message || "Fail to Fetch Rows data",
        action: "page",
      });
    }
  };
  useEffect(() => {
    if (!rowsLoaded && rows.length > 0) {
      checkAgentStatus();
      setRowsLoaded(true);
    }
  }, [rows]);
  useEffect(() => {
    fetchData();
  }, []);
  useEffect(() => {
    if (rowsLoaded) {
      // Set up an interval to call the API every 5 minute (3600 *5 milliseconds)
      const intervalId = setInterval(() => {
        checkAgentStatus();
      }, 5 * 60 * 1000);

      // Clean up the interval when the component is unmounted
      return () => clearInterval(intervalId);
    }
  }, [rowsLoaded]);
  const handleRowEditStop = (params, event) => {
    if (params.reason === GridRowEditStopReasons.rowFocusOut) {
      event.defaultMuiPrevented = true;
    }
  };
  const editHandler = async (newRow) => {
    try {
      setLoading({
        active: true,
        action: "save-" + newRow.id,
      });
      const response = await axiosInstance.patch(`/agent/${newRow.id}`, newRow);
      if (response.data.success) {
        const updatedRow = {
          ...newRow,
          isNew: false,
        };
        setShowToast({
          active: true,
          message: "Row Updated Successfully!",
          severity: "success",
        });
        setLoading({
          active: false,
          action: "",
        });
        return {
          success: true,
          data: updatedRow,
        };
      } else {
        setShowToast({
          active: true,
          message: response.data.message,
          action: "error",
        });
        setLoading({
          active: false,
          action: "",
        });
        return {
          success: false,
          message: response.data.message,
        };
      }
    } catch (err) {
      const errorRes = err.response?.data;

      setLoading({
        active: false,
        action: "",
      });

      setShowToast({
        active: true,
        message: errorRes?.message || "Fail to Update Row",
        severity: "error",
      });
      return {
        success: false,
        message: errorRes?.message || "Fail to Update Row",
      };
    }
  };
  const handleEditClick = (id) => () => {
    setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.Edit } });
  };
  const deleteHandler = async (id) => {
    try {
      setLoading({
        active: true,
        action: "delete-" + id,
      });
      const response = await axiosInstance.delete(`/agent/${id}`);
      if (response.data.success) {
        setRows(rows.filter((row) => row.id !== id));
        setShowDeleteModal({
          active: false,
          rowId: null,
        });
        setShowToast({
          active: true,
          message: "Row Deleted Successfully!",
          severity: "success",
        });
      } else {
        setShowToast({
          active: true,
          message: response.data.message,
          action: "error",
        });
      }
      setLoading({
        active: false,
        action: "",
      });
    } catch (err) {
      const errorRes = err.response?.data;

      setLoading({
        active: false,
        action: "",
      });

      setShowToast({
        active: true,
        message: errorRes?.message || "Fail to delete Collection",
        severity: "error",
      });
    }
  };
  const handleDeleteClick = (id) => () => {
    setShowDeleteModal({
      active: true,
      rowId: id,
    });
  };

  const saveHandler = async (newRow) => {
    try {
      setLoading({
        active: true,
        action: "save-" + newRow.id,
      });
      const response = await axiosInstance.post(`/agent/`, {
        ...newRow,
      });

      if (response.data.success) {
        const updatedRow = {
          ...newRow,
          isNew: false,
        };
        setShowToast({
          active: true,
          message: "Row Added Successfully!",
          severity: "success",
        });
        setLoading({
          active: false,
          action: "",
        });
        return {
          success: true,
          data: updatedRow,
        };
      } else {
        setShowToast({
          active: true,
          message: response.data.message,
          action: "error",
        });
        setLoading({
          active: false,
          action: "",
        });
        return {
          success: false,
          message: response.data.message,
        };
      }
    } catch (err) {
      console.log(err);
      const errorRes = err.response?.data;

      setLoading({
        active: false,
        action: "",
      });

      setShowToast({
        active: true,
        message: errorRes?.message || "Fail to Add Row",
        severity: "error",
      });
      return {
        success: false,
        message: errorRes?.message || "Fail to Add Row",
      };
    }
  };
  const handleSaveClick = (id) => () => {
    setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.View } });
  };

  const handleCancelClick = (id) => () => {
    setRowModesModel({
      ...rowModesModel,
      [id]: { mode: GridRowModes.View, ignoreModifications: true },
    });

    const editedRow = rows.find((row) => row.id === id);
    if (editedRow.isNew) {
      setRows(rows.filter((row) => row.id !== id));
    } else {
      setRows(
        rows.map((row) => {
          if (row.id === id) {
            return editedRow;
          }
          return row;
        })
      );
    }
  };

  const validateRow = (row) => {
    if (
      Object.keys(row).some((key) => {
        if (typeof row[key] === "string" && row[key].trim() === "") {
          return true;
        }
        return false;
      })
    ) {
      setShowToast({
        active: true,
        message: "Please fill all values to continue",
        severity: "error",
      });
      return false;
    }
    try {
      // Attempt to parse the YAML
      jsYaml.load(row.agentYaml);
    } catch (error) {
      setShowToast({
        active: true,
        message: "Invalid YAML string",
        severity: "error",
      });
      return false;
    }

    //check agentAddress as correct url
    if (validator.isURL(row.agentAddress)) {
      setShowToast({
        active: true,
        message: "Invalid Agent Address",
        severity: "error",
      });
      return false;
    }
    //check agentAddress as correct url
    if (`${row.agentAddress}`.endsWith("/")) {
      setShowToast({
        active: true,
        message: "Agent Address URL must not end with /",
        severity: "error",
      });
      return false;
    }

    return true;
  };
  const processRowUpdate = async (newRow) => {
    if (!validateRow(newRow)) {
      setRowModesModel({
        ...rowModesModel,
        [newRow.id]: { mode: GridRowModes.Edit },
      });
      return newRow;
    }
    let response;
    if (newRow.isNew) {
      response = await saveHandler(newRow);
    } else {
      response = await editHandler(newRow);
    }
    if (!response || !response.success) {
      console.log(response, newRow);
      setRowModesModel((oldModel) => ({
        ...oldModel,
        [newRow.id]: { mode: GridRowModes.Edit, fieldToFocus: "agentToken" },
      }));
      return newRow;
    }

    const updatedRow = response.data;
    setRows(rows.map((row) => (row.id === newRow.id ? updatedRow : row)));
    return updatedRow;
  };

  const handleRowModesModelChange = (newRowModesModel) => {
    // setRowModesModel(newRowModesModel);
  };

  const handleToastClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }

    setShowToast({
      active: false,
      message: "",
      severity: "",
    });
  };
  const columns = [
    {
      field: "id",
      headerName: "Agent Id",
      flex: 1,
      renderCell: (params) => <RenderExpandableCell {...params} />,
    },
    {
      field: "createdOn",
      headerName: " Created On",
      flex: 1,
      valueGetter: (params) => {
        return new Date(params.row.createdOn).toLocaleString();
      },
    },

    {
      field: "agentToken",
      headerName: "Agent Token",
      flex: 1,
      //  type: "number", //date  etc
      align: "left",
      headerAlign: "left",
      editable: true,
      renderEditCell: (params) =>
        params.hasFocus ? (
          <EditTextarea {...params} singleLine={true} />
        ) : (
          <InputBase value={params.value} sx={{ px: "16px" }} />
        ),
    },
    {
      field: "agentAddress",
      headerName: "Agent Address",
      flex: 1,
      //  type: "number", //date  etc
      align: "left",
      headerAlign: "left",
      editable: true,
      renderEditCell: (params) =>
        params.hasFocus ? (
          <EditTextarea {...params} singleLine={true} />
        ) : (
          <InputBase value={params.value} sx={{ px: "16px" }} />
        ),
    },
    {
      field: "authToken",
      headerName: "Auth Token",
      flex: 1,
      editable: true,
      renderEditCell: (params) =>
        params.hasFocus ? (
          <EditTextarea {...params} singleLine={true} />
        ) : (
          <InputBase value={params.value} sx={{ px: "16px" }} />
        ),
    },
    {
      field: "apiKey",
      headerName: "Api Key",
      flex: 1,
      editable: true,
      renderEditCell: (params) =>
        params.hasFocus ? (
          <EditTextarea {...params} singleLine={true} />
        ) : (
          <InputBase value={params.value} sx={{ px: "16px" }} />
        ),
      //type: "singleSelect",
      // valueOptions: ["Market", "Finance", "Development"],
    },
    {
      field: "agentYaml",
      headerName: "Agent Yaml",
      flex: 3,
      editable: true,
      type: "string",
      renderEditCell: (params) =>
        params.hasFocus ? (
          <EditTextarea {...params} />
        ) : (
          <InputBase
            value={`${params.value}`.split("\n")[0] || ""}
            sx={{ px: "16px" }}
          />
        ),
      renderCell: (params) => (
        <span>{`${params.value}`.split("\n")[0] || ""}</span>
      ),
    },
    {
      field: "actions",
      type: "actions",
      headerName: "Actions",
      width: 200,
      cellClassName: "actions",
      getActions: (params) => {
        const { id } = params;
        const isInEditMode = rowModesModel[id]?.mode === GridRowModes.Edit;
        const statusLoaded = params.row.statusLoaded;
        const status = params.row.status;

        if (isInEditMode) {
          return [
            <GridActionsCellItem
              icon={<SaveIcon />}
              label='Save'
              sx={{
                color: "primary.main",
              }}
              onClick={handleSaveClick(id)}
            />,
            <GridActionsCellItem
              icon={<CancelIcon />}
              label='Cancel'
              className='textPrimary'
              onClick={handleCancelClick(id)}
              color='inherit'
            />,
          ];
        }

        return [
          <GridActionsCellItem
            icon={
              <Tooltip
                title={
                  !statusLoaded
                    ? "Checking status"
                    : status === "online"
                    ? "online"
                    : "offline"
                }
              >
                <CircleIcon
                  sx={{
                    cursor: "default",
                    fill: !statusLoaded
                      ? "grey"
                      : status === "online"
                      ? "green"
                      : "red",
                  }}
                />
              </Tooltip>
            }
            label='Endpoints'
            className='textPrimary'
            color='inherit'
          />,
          <GridActionsCellItem
            icon={
              <Tooltip title={"Tunnel"}>
                <CellTowerIcon />
              </Tooltip>
            }
            label='Endpoints'
            className='textPrimary'
            onClick={() => {
              setShowEndpointDialog({
                active: true,
                row: params.row,
              });
            }}
            color='inherit'
          />,
          <GridActionsCellItem
            icon={
              <Tooltip title='Edit'>
                <EditIcon />
              </Tooltip>
            }
            label='Edit'
            className='textPrimary'
            onClick={handleEditClick(id)}
            color='inherit'
          />,
          <GridActionsCellItem
            icon={
              <Tooltip title='Delete'>
                <DeleteIcon />
              </Tooltip>
            }
            label='Delete'
            onClick={handleDeleteClick(id)}
            color='inherit'
          />,
        ];
      },
    },
  ];

  const renderDeleteRowDialog = (
    <Dialog
      maxWidth='sm'
      fullWidth
      open={showDeleteModal.active}
      onClose={() => {
        setShowDeleteModal({
          active: false,
          rowId: null,
        });
      }}
    >
      <DialogContent>
        <Grid
          container
          alignItems='flex-start'
          justifyContent={{ xs: "center", md: "flex-start" }}
        >
          <Grid item>
            <Typography variant='h6'>Delete Row</Typography>
            <div style={{ height: "8px" }}></div>
            <Typography variant='body2'>
              Are you sure you want to Delete row with id{" "}
              {showDeleteModal.rowId}?
            </Typography>
          </Grid>
          <Grid
            container
            alignItems='center'
            justifyContent='flex-end'
            style={{ marginTop: "22px", marginBottom: "2px", gap: "20px" }}
          >
            <Grid item>
              <Button
                onClick={() =>
                  setShowDeleteModal({
                    active: false,
                    rowId: null,
                  })
                }
                style={{
                  background: "transparent",
                  border: "1px solid #D0D5DD",
                  color: "#344054",
                  width: "25%",
                }}
              >
                No
              </Button>
            </Grid>
            <Grid item>
              <Button
                onClick={() => {
                  deleteHandler(showDeleteModal.rowId);
                }}
                style={{ width: "25%" }}
                disabled={
                  loading?.active &&
                  loading?.action === `delete-${showDeleteModal.rowId}`
                }
              >
                {loading?.active && loading?.action === "delete" && (
                  <CircularProgress
                    size='1rem'
                    color='inherit'
                    style={{ marginRight: "10px" }}
                  />
                )}
                Yes
              </Button>
            </Grid>
          </Grid>
        </Grid>
      </DialogContent>
    </Dialog>
  );

  if (loading && loading.action === "page") {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <CircularProgress />
      </div>
    );
  }
  if (error.active && error.action === "page") {
    return (
      <Grid
        container
        direction='column'
        alignItems='center'
        justifyContent='center'
        sx={{ minHeight: "100vh", padding: "0px 30px" }}
      >
        <Grid item>
          <Typography variant='h1' align='center'>
            Error !!!
          </Typography>
        </Grid>
        <Grid item style={{ marginTop: "30px" }}>
          <Typography variant='h5' align='center'>
            {error.message}
          </Typography>
        </Grid>
        <Grid item style={{ marginTop: "30px" }}>
          <Button
            variant='contained'
            size='large'
            style={{
              boxShadow: "none",
              borderRadius: "8px",

              fontSize: "30px",
            }}
            onClick={() => {
              window.location.reload();
            }}
          >
            Reload
          </Button>
        </Grid>
      </Grid>
    );
  }
  return (
    <Grid
      container
      justifyContent='center'
      alignItems='center'
      sx={{ minHeight: "100vh" }}
    >
      <Snackbar
        open={showToast.active}
        anchorOrigin={{ horizontal: "center", vertical: "bottom" }}
        autoHideDuration={4000}
        onClose={handleToastClose}
      >
        <Alert
          onClose={(e) => handleToastClose(e, "clickaway")}
          severity={showToast.severity}
        >
          {showToast.message}
        </Alert>
      </Snackbar>
      {renderDeleteRowDialog}
      <AgentEndpointsDialog
        open={showEndpointsDialog.active}
        onClose={() => {
          setShowEndpointDialog({
            active: false,
            row: null,
          });
        }}
        row={showEndpointsDialog.row}
        onUpdate={(updatedRow) => {
          let newRow;
          setRows((r) =>
            r.map((x) => {
              if (x.id === showEndpointsDialog?.row?.id) {
                newRow = {
                  ...x,
                  ...updatedRow,
                };
                return newRow;
              }
              return x;
            })
          );

          if (newRow) {
            setShowEndpointDialog((s) => {
              return {
                ...s,
                row: newRow,
              };
            });
          }
        }}
      />
      <Grid item sx={{ width: { md: "80%", xs: "100%" } }}>
        <DataGrid
          disableRowSelectionOnClick
          apiRef={apiRef}
          rows={rows}
          columns={columns}
          editMode='row'
          loading={loading.active}
          rowModesModel={rowModesModel}
          onRowModesModelChange={handleRowModesModelChange}
          onRowEditStop={handleRowEditStop}
          processRowUpdate={processRowUpdate}
          onProcessRowUpdateError={(error) => {
            console.log(error);
            setShowToast({
              active: true,
              message: error.message,
              severity: "error",
            });
          }}
          slots={{
            toolbar: EditToolbar,
          }}
          slotProps={{
            toolbar: { rows, setRows, setRowModesModel },
          }}
          localeText={{
            noRowsLabel:
              "No records available. Click the button to add a record.",
          }}
          autoHeight
        />
      </Grid>
    </Grid>
  );
}
