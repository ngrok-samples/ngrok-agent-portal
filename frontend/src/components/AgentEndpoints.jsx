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
  IconButton,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/DeleteOutlined";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Close";
import PlayCircleFilledWhiteIcon from "@mui/icons-material/PlayCircleFilledWhite";
import StopCircleIcon from "@mui/icons-material/StopCircle";
import ReplayIcon from "@mui/icons-material/Replay";
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
import axiosInstance from "../utils/axios";
import axios from "axios";
import jsYaml from "js-yaml";

import EditTextarea from "./EditTextarea";

function EditToolbar(props) {
  const { rows, setRows, setRowModesModel } = props;

  const handleClick = () => {
    //const id = ksuid.randomSync().toString();
    const id = uuidv4();
    setRows((oldRows) => [
      {
        id,
        createdOn: new Date().toString(),
        name: "",
        endpointYaml: "",
        // proto: "",
        // endPointaddr: "",
        // crt: "",
        // key: "",
        isNew: true,
      },
      ...oldRows,
    ]);
    setRowModesModel((oldModel) => ({
      ...oldModel,
      [id]: { mode: GridRowModes.Edit, fieldToFocus: "name" },
    }));
  };

  return (
    <GridToolbarContainer>
      <Grid container justifyContent='flex-end' gap='20px' sx={{ p: "10px" }}>
        <Grid item>
          <Button
            variant='contained'
            startIcon={<AddIcon />}
            onClick={handleClick}
            sx={{ textTransform: "none", px: "30px" }}
          >
            Add Tunnel
          </Button>
        </Grid>
      </Grid>
    </GridToolbarContainer>
  );
}

export default function FullFeaturedCrudGrid({ data, onUpdate }) {
  const [rows, setRows] = useState(
    data?.endpoints
      ? data.endpoints.map((x) => {
          return {
            ...x,
            statusLoaded: false,
            status: "offline",
          };
        })
      : []
  );
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

  const checkAgentStatus = async () => {
    try {
      setLoading({
        active: true,
        action: "agentStatus",
      });
      const response = await axios.get(`${data?.agentAddress}`);
      if (response.data.success) {
        onUpdate({
          statusLoaded: true,
          status: "online",
        });
      } else {
        onUpdate({
          statusLoaded: true,
          status: "offline",
        });
      }
    } catch (err) {
      onUpdate({
        statusLoaded: true,
        status: "offline",
      });
    } finally {
      setLoading({
        active: false,
        action: "",
      });
    }

    // setRows(newAgentList);
  };

  const getEndpointStatus = async () => {
    try {
      const response = await axios.get(
        `${data?.agentAddress}/getEndPointStatus/${data.id}`,
        {
          headers: {
            token: data.agentToken,
          },
        }
      );
      if (response.data.success) {
        const endpointsStatus = response.data.data.doc;

        setRows((rowsArray) =>
          rowsArray.map((rowItem) => {
            let end = endpointsStatus.find((item) => item.id === rowItem.id);
            return {
              ...rowItem,
              statusLoaded: true,
              status: end ? end.status : "offline",
            };
          })
        );
      } else {
        setRows((rowsArray) =>
          rowsArray.map((rowItem) => {
            return {
              ...rowItem,
              statusLoaded: true,
              status: "offline",
            };
          })
        );
      }
    } catch (err) {
      setRows((rowsArray) =>
        rowsArray.map((rowItem) => {
          return {
            ...rowItem,
            statusLoaded: true,
            status: "offline",
          };
        })
      );
    }
  };
  useEffect(() => {
    if (data?.id) {
      if (data.status === "offline") {
        setRows((rowsArray) =>
          rowsArray.map((rowItem) => {
            return {
              ...rowItem,
              statusLoaded: true,
              status: "offline",
            };
          })
        );
      } else {
        getEndpointStatus();
      }
    }
  }, [data?.id, data?.status]);
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
      const response = await axiosInstance.patch(
        `/endpoint/${data.id}/${newRow.id}`,
        newRow
      );
      if (response.data.success) {
        const newDoc = response.data.data.doc;
        const updatedRow = {
          ...newDoc,
          id: newDoc._id,
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
      const response = await axiosInstance.delete(`/endpoint/${data.id}/${id}`);
      if (response.data.success) {
        const newRows = rows.filter((row) => row.id !== id);
        setRows(newRows);
        onUpdate({
          endpoints: newRows,
        });
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
      const response = await axiosInstance.post(`/endpoint/${data.id}`, {
        ...newRow,
      });
      if (response.data.success) {
        const newDoc = response.data.data.doc;
        const updatedRow = {
          ...newDoc,
          id: newDoc._id,
          isNew: false,
          statusLoaded: true,
          status: "offline",
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
    }
  };

  const validateRow = (row) => {
    // if (
    //   Object.keys(row).some((key) => {
    //     if (key === "crt" || key === "key") return false;
    //     if (typeof row[key] === "string" && row[key].trim() === "") {
    //       return true;
    //     }
    //     return false;
    //   })
    // ) {
    //   setShowToast({
    //     active: true,
    //     message: "Please fill all values to continue",
    //     severity: "error",
    //   });
    //   return false;
    // }

    if (
      rows
        .filter((x) => x.id !== row.id)
        .some((x) => `${x.name}`.toLowerCase() === `${row.name}`.toLowerCase())
    ) {
      setShowToast({
        active: true,
        message: "Endpoint name cannot  be duplicated.",
        severity: "error",
      });
      return false;
    }
    try {
      // Attempt to parse the YAML
      jsYaml.load(row.endpointYaml);
    } catch (error) {
      setShowToast({
        active: true,
        message: "Invalid YAML string",
        severity: "error",
      });
      return false;
    }
    // if (row.proto === "tls") {
    //   if (row.crt === "" || row.key === "") {
    //     setShowToast({
    //       active: true,
    //       message: "Endpoint key or crt cannot be empty.",
    //       severity: "error",
    //     });
    //     return false;
    //   }
    // }

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
    let body = newRow;
    if (body.proto !== "tls") {
      body.key = "";
      body.crt = "";
    }
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
    const newRows = rows.map((row) =>
      row.id === newRow.id ? updatedRow : row
    );
    setRows(newRows);
    onUpdate({
      endpoints: newRows,
    });
    return updatedRow;
  };
  const statusChangeHandler = async (newRow) => {
    try {
      setLoading({
        active: true,
        action: "status-" + newRow.id,
      });
      const response = await axiosInstance.patch(
        `/endpoint/updateStatus/${data.id}/${newRow.id}`
      );
      if (response.data.success) {
        const newStatus = response.data.data.doc.status;
        const updatedRow = {
          ...newRow,
          status: newStatus,
        };
        setShowToast({
          active: true,
          message: "Status Updated Successfully!",
          severity: "success",
        });
        const newRows = rows.map((row) =>
          row.id === newRow.id ? updatedRow : row
        );
        setRows(newRows);
        onUpdate({
          endpoints: newRows,
        });
        setLoading({
          active: false,
          action: "",
        });
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
    }
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

  const handleCustomFieldChange = (event, id, field) => {
    const newValue = event.target.value;
    apiRef.current.setEditCellValue({ id, field, value: newValue }, event);
  };

  const columns = [
    {
      field: "name",
      headerName: "Endpoint name",
      flex: 1,
      //  type: "number", //date  etc
      align: "left",
      headerAlign: "left",
      editable: true,
    },
    {
      field: "endpointYaml",
      headerName: "Endpoint Yaml",
      flex: 2,
      editable: true,
      type: "string",
      renderEditCell: (params) => {
        return params.hasFocus ? (
          <EditTextarea {...params} />
        ) : (
          <InputBase value={params.value} sx={{ px: "16px" }} />
        );
      },
    },
    // {
    //   field: "endPointaddr",
    //   headerName: "Endpoint Address",
    //   flex: 2,
    //   editable: true,
    //   align: "left",
    //   headerAlign: "left",
    //   //type: "singleSelect",
    //   // valueOptions: ["Market", "Finance", "Development"],
    // },
    // {
    //   field: "proto",
    //   headerName: "Protocol",
    //   flex: 1,
    //   editable: true,
    //   type: "singleSelect",
    //   valueOptions: ["http", "tls", "tcp"],
    // },
    // {
    //   field: "crt",
    //   headerName: "CRT",
    //   flex: 1,
    //   editable: true,
    //   renderCell: (params) => {
    //     return params.row.proto === "tls" ? (
    //       <InputBase value={params.value} />
    //     ) : (
    //       <Typography sx={{ width: "100%" }}></Typography>
    //     );
    //   },
    //   renderEditCell: (params) => {
    //     const { id, field } = params;
    //     return params.row.proto === "tls" ? (
    //       <InputBase
    //         value={params.value}
    //         onChange={(event) => handleCustomFieldChange(event, id, field)}
    //         sx={{ px: "16px" }}
    //       />
    //     ) : (
    //       <Typography sx={{ width: "100%" }}></Typography>
    //     );
    //   },
    // },
    // {
    //   field: "key",
    //   headerName: "Key",
    //   flex: 1,
    //   editable: true,
    //   renderCell: (params) => {
    //     return params.row.proto === "tls" ? (
    //       <InputBase value={params.value} />
    //     ) : (
    //       <Typography sx={{ width: "100%" }}></Typography>
    //     );
    //   },
    //   renderEditCell: (params) => {
    //     const { id, field } = params;
    //     return params.row.proto === "tls" ? (
    //       <InputBase
    //         value={params.value}
    //         onChange={(event) => handleCustomFieldChange(event, id, field)}
    //         sx={{ px: "16px" }}
    //       />
    //     ) : (
    //       <Typography sx={{ width: "100%" }}></Typography>
    //     );
    //   },
    // },
    {
      field: "actions",
      type: "actions",
      headerName: "Actions",

      cellClassName: "actions",
      getActions: (params) => {
        const { id, row } = params;

        const isInEditMode = rowModesModel[id]?.mode === GridRowModes.Edit;

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

        let statusDisabled =
          !data?.statusLoaded ||
          data.status === "offline" ||
          !row.statusLoaded ||
          (loading?.active && loading?.action === `status-${row.id}`);
        return [
          <GridActionsCellItem
            sx={{ cursor: statusDisabled ? "default" : "pointer" }}
            icon={
              <Tooltip
                title={
                  !data?.statusLoaded
                    ? "Checking Agent status"
                    : data.status === "offline"
                    ? "Tunnels can only be started when the agent is online"
                    : !row.statusLoaded
                    ? "Checking Tunnel Status"
                    : row.status === "online"
                    ? "Stop"
                    : "Start"
                }
              >
                {!data?.statusLoaded ||
                data.status === "offline" ||
                !row.statusLoaded ? (
                  <PlayCircleFilledWhiteIcon sx={{ fill: "grey" }} />
                ) : loading?.active &&
                  loading?.action === `status-${row.id}` ? (
                  <CircularProgress size='1rem' />
                ) : row.status === "online" ? (
                  <StopCircleIcon sx={{ fill: "red" }} />
                ) : (
                  <PlayCircleFilledWhiteIcon sx={{ fill: "green" }} />
                )}
              </Tooltip>
            }
            label='status'
            className='textPrimary'
            onClick={() => {
              if (statusDisabled) {
                return;
              }
              statusChangeHandler(row);
            }}
            color='inherit'
          />,
          <GridActionsCellItem
            icon={<EditIcon />}
            label='Edit'
            className='textPrimary'
            onClick={handleEditClick(id)}
            color='inherit'
          />,
          <GridActionsCellItem
            icon={<DeleteIcon />}
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
          minHeight: "100%",
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
        sx={{ minHeight: "100%", padding: "0px 30px" }}
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
    <Grid container justifyContent='center' alignItems='center'>
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
      <Grid item sx={{ width: "100%" }}>
        <Typography
          variant='h5'
          sx={{
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <IconButton
            sx={{ p: 0 }}
            disabled={loading?.active && loading?.action === `agentStatus`}
            onClick={checkAgentStatus}
          >
            {loading?.active && loading?.action === `agentStatus` ? (
              <CircularProgress size='1rem' />
            ) : (
              <ReplayIcon />
            )}
          </IconButton>
          Agent Status: {!data?.statusLoaded ? "Checking status" : data.status}
        </Typography>
      </Grid>
      <Grid item sx={{ width: "100%", mt: "10px" }}>
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
          pagination={false}
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
