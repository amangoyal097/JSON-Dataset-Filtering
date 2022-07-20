import React, { useState, useEffect } from "react";
import axios from "axios";
import PropTypes from "prop-types";
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarExportContainer,
  GridToolbarDensitySelector,
  GridCsvExportMenuItem,
  useGridApiContext,
  gridFilteredSortedRowIdsSelector,
  gridVisibleColumnFieldsSelector,
} from "@mui/x-data-grid";
import Modal from "@mui/material/Modal";
import Grid from "@mui/material/Grid";
import { makeStyles } from "@mui/styles";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Button from "@mui/material/Button";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import TextField from "@mui/material/TextField";
import OutlinedInput from "@mui/material/OutlinedInput";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import CustomNoRowsOverlay from "./NoRows.js";
import Backdrop from "@mui/material/Backdrop";
import CircularProgress from "@mui/material/CircularProgress";

import Landing from "./Landing.js";
import Swal from "sweetalert2";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import Select from "@mui/material/Select";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
};
const useStyles = makeStyles({
  heading: {
    fontSize: "3rem",
    fontFamily: "Work Sans",
    fontWeight: "bold",
  },
  drag: {
    background: "#f23030",
    padding: "0.7rem",
    height: "100%",
  },
  innerdrag: {
    background: "#d92b2b",
    border: "2px dashed #333333",
    padding: "5rem 0rem",
  },
  label: {
    color: "white",
    fontFamily: "'Baloo Thambi 2'",
    fontSize: "1rem",
    opacity: 0.7,
  },
  uploading: {
    height: "23.57rem",
    border: "1px solid #D3D3D3",
  },
  uploadText: {
    fontFamily: "Work Sans",
  },
  fileName: {
    margin: 0,
    fontFamily: "'Baloo Thambi 2'",
    fontSize: "2rem",
  },
  fileSize: {
    margin: 0,
    fontFamily: "Work Sans",
    fontSize: "1.5rem",
    opacity: 0.7,
  },
  root: {
    "& .MuiDataGrid-columnHeaders": {
      backgroundColor: "blue",
      color: "rgba(255,0,0,0.7)",
      fontSize: 16,
    },
  },
});

const getJson = (apiRef) => {
  // Select rows and columns
  const filteredSortedRowIds = gridFilteredSortedRowIdsSelector(apiRef);
  const visibleColumnsField = gridVisibleColumnFieldsSelector(apiRef);

  // Format the data. Here we only keep the value
  const data = filteredSortedRowIds.map((id) => {
    const row = {};
    visibleColumnsField.forEach((field) => {
      row[field] = apiRef.current.getCellParams(id, field).value;
    });
    return row;
  });

  // Stringify with some indentation
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#parameters
  return JSON.stringify(data, null, 2);
};

const exportBlob = (blob, filename) => {
  // Save the blob in a json file
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();

  setTimeout(() => {
    URL.revokeObjectURL(url);
  });
};

const JsonExportMenuItem = (props) => {
  const apiRef = useGridApiContext();

  const { hideMenu } = props;

  return (
    <MenuItem
      onClick={() => {
        const jsonString = getJson(apiRef);
        const blob = new Blob([jsonString], {
          type: "text/json",
        });

        exportBlob(blob, "Data.json");

        // Hide the export menu after the export
        hideMenu?.();
      }}
    >
      Download as JSON
    </MenuItem>
  );
};

JsonExportMenuItem.propTypes = {
  hideMenu: PropTypes.func,
};

const csvOptions = {
  fileName: "Data",
  delimiter: ",",
};

const CustomExportButton = (props) => (
  <GridToolbarExportContainer {...props}>
    <GridCsvExportMenuItem options={csvOptions} />
    <JsonExportMenuItem />
  </GridToolbarExportContainer>
);

const CustomToolbar = (props) => (
  <GridToolbarContainer {...props}>
    <GridToolbarDensitySelector />
    <CustomExportButton />
  </GridToolbarContainer>
);

function Home() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileStage, setFileStage] = useState("Not Uploaded");
  const [data, setData] = useState({});
  const [open, setOpen] = useState(false);
  const [openFilterDetails, setOpenFilterDetails] = useState(false);
  const [filters, setFilters] = useState([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [newFilter, setNewFilter] = useState({
    column_name: "",
    column_data_type: "",
    type: "",
    values: [],
    value: "",
  });
  const [currFilter, setCurrFilter] = useState({
    column_name: "",
    column_data_type: "",
    type: "",
    values: [],
    value: "",
  });

  const toIsoString = (date) => {
    return date.toISOString();
  };

  const classes = useStyles();

  const handleNewFilterChange = (event, label) => {
    if (label == "column") {
      let data_type = data.meta.find(
        (e) => e.fieldName == event.target.value
      ).dataType;
      setNewFilter({
        column_name: event.target.value,
        column_data_type: data_type,
        type: "",
        values: [],
        value: "",
      });
    } else if (label == "type") {
      let value = "";
      let min = "";
      let max = "";
      if (
        event.target.value === "Equals" &&
        (newFilter.column_data_type === "date" ||
          newFilter.column_data_type === "time" ||
          newFilter.column_data_type === "datetime")
      )
        value = toIsoString(
          new Date(
            data.filters.find(
              (e) => e.name == newFilter.column_name
            ).rangeValues[0]
          )
        );
      if (event.target.value === "Range") {
        min = data.filters.find((e) => e.name == newFilter.column_name)
          .rangeValues[0];
        max = data.filters.find((e) => e.name == newFilter.column_name)
          .rangeValues[1];
      }
      setNewFilter({
        column_name: newFilter.column_name,
        column_data_type: newFilter.column_data_type,
        type: event.target.value,
        values: [],
        value: value,
        min: min,
        max: max,
      });
    } else if (label == "min") {
      setNewFilter({ ...newFilter, min: Number(event.target.value) });
    } else if (label == "max") {
      setNewFilter({ ...newFilter, max: Number(event.target.value) });
    } else if (label == "minD") {
      setNewFilter({ ...newFilter, min: toIsoString(event) });
    } else if (label == "maxD") {
      setNewFilter({ ...newFilter, max: toIsoString(event) });
    } else if (label == "value") {
      setNewFilter({
        ...newFilter,
        value:
          newFilter.column_data_type === "number"
            ? Number(event.target.value)
            : event.target.value,
      });
    } else if (label == "valueD") {
      setNewFilter({ ...newFilter, value: toIsoString(event) });
    } else if (label == "values") {
      setNewFilter({
        ...newFilter,
        values:
          typeof event.target.value === "string"
            ? event.target.value.split(",")
            : event.target.value,
      });
    }
  };

  window.addEventListener("beforeunload", (event) => {
    if (fileStage !== "Not Uploaded") {
      event = event || window.event;
      if (event) event.returnValue = `Are you sure you want to leave?`;
      else return `Are you sure you want to leave?`;
    }
  });
  const onFileUpload = () => {
    const formData = new FormData();

    formData.append("myFile", selectedFile, selectedFile.name);
    axios({
      method: "post",
      url: "http://localhost:8080/uploadfile",
      data: formData,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
      .then(function (response) {
        setData(response.data);
        setFileStage("Uploaded");
      })
      .catch(function (response) {
        console.log(response);
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: "Error while parsing file!",
        });
        setFileStage("Not Uploaded");
      });
  };
  const filterData = () => {
    setFilterOpen(true);
    const formData = new FormData();
    formData.set("filters", JSON.stringify(filters));
    formData.set("fileHash", data.file_name);
    axios
      .post("http://localhost:8080/filterData", formData)
      .then((response) => {
        setData({ ...data, rows: response.data.rows });
        setFilterOpen(false);
      })
      .catch((response) => {
        console.log(response);
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: "Coud not filter data!",
        });
        setFilterOpen(false);
      });
  };

  useEffect(() => {
    if (selectedFile) {
      onFileUpload();
      setNewFilter({
        column_name: "",
        column_data_type: "",
        type: "",
        values: [],
        value: "",
      });
    }
  }, [selectedFile]);

  const handleDelete = (index) => {
    setFilters(filters.filter((filter, ind) => ind !== index));
    setOpenFilterDetails(false);
  };

  const fileData = () => {
    let colTemp = [];
    data.columns.forEach((element) => {
      colTemp.push({ field: element, headerName: element, flex: 1 });
    });

    return (
      <>
        <Backdrop sx={{ color: "#fff", zIndex: 200 }} open={filterOpen}>
          <CircularProgress color="inherit" />
        </Backdrop>
        <Modal
          keepMounted
          open={open}
          onClose={() => setOpen(false)}
          style={{ zIndex: 200 }}
        >
          <Box sx={style}>
            <h3 style={{ fontFamily: "Work Sans" }}>Add Filters</h3>
            <h5 style={{ fontFamily: "Work Sans" }}>
              Select the column you want to add the filter on
            </h5>
            <FormControl fullWidth>
              <InputLabel id="select-label">Column</InputLabel>
              <Select
                labelId="select-label"
                id="demo-simple-select"
                value={newFilter.column_name}
                label="Column"
                onChange={(e) => handleNewFilterChange(e, "column")}
              >
                {colTemp.map((col) => (
                  <MenuItem key={col.headerName} value={col.headerName}>
                    {col.headerName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {newFilter.column_name && (
              <>
                <h5 style={{ fontFamily: "Work Sans" }}>
                  Select the type of filter you want to apply
                </h5>
                <FormControl fullWidth>
                  <InputLabel id="select-label">Type</InputLabel>
                  <Select
                    labelId="select-label"
                    id="demo-simple-select"
                    value={newFilter.type}
                    label="Type"
                    onChange={(e) => handleNewFilterChange(e, "type")}
                  >
                    {data?.filters.find((e) => e.name == newFilter.column_name)
                      .range && <MenuItem value="Range">Range</MenuItem>}
                    {data?.filters.find((e) => e.name == newFilter.column_name)
                      .substring && (
                      <MenuItem value="Substring">Substring</MenuItem>
                    )}
                    {data?.filters.find((e) => e.name == newFilter.column_name)
                      .search && <MenuItem value="Equals">Equals</MenuItem>}
                    {data?.filters.find((e) => e.name == newFilter.column_name)
                      .select && <MenuItem value="Select">Select</MenuItem>}
                  </Select>
                </FormControl>
              </>
            )}
            {newFilter.type == "Range" &&
              data.meta.find((e) => e.fieldName == newFilter.column_name)
                .dataType !== "date" && (
                <Grid
                  container
                  justifyContent="space-around"
                  spacing={2}
                  mt={1}
                >
                  <Grid item xs={6}>
                    <TextField
                      id="min"
                      label="From"
                      type="number"
                      variant="outlined"
                      value={
                        newFilter.min ??
                        data?.filters.find(
                          (e) => e.name == newFilter.column_name
                        ).rangeValues[0]
                      }
                      onChange={(e) => handleNewFilterChange(e, "min")}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      id="max"
                      label="To"
                      type="number"
                      variant="outlined"
                      value={newFilter.max}
                      onChange={(e) => handleNewFilterChange(e, "max")}
                    />
                  </Grid>
                </Grid>
              )}
            {newFilter.type == "Range" &&
              data.meta.find((e) => e.fieldName == newFilter.column_name)
                .dataType === "date" && (
                <Grid
                  container
                  justifyContent="space-around"
                  spacing={2}
                  mt={1}
                >
                  <Grid item xs={6}>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <DatePicker
                        minDate={
                          new Date(
                            data?.filters.find(
                              (e) => e.name == newFilter.column_name
                            ).rangeValues[0]
                          )
                        }
                        maxDate={
                          new Date(
                            data?.filters.find(
                              (e) => e.name == newFilter.column_name
                            ).rangeValues[1]
                          )
                        }
                        label="From"
                        value={newFilter.min}
                        inputProps={{
                          readOnly: true,
                          disabled: true,
                        }}
                        onChange={(e) => handleNewFilterChange(e, "minD")}
                        renderInput={(params) => <TextField {...params} />}
                      />
                    </LocalizationProvider>
                  </Grid>
                  <Grid item xs={6}>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <DatePicker
                        minDate={
                          new Date(
                            data?.filters.find(
                              (e) => e.name == newFilter.column_name
                            ).rangeValues[0]
                          )
                        }
                        maxDate={
                          new Date(
                            data?.filters.find(
                              (e) => e.name == newFilter.column_name
                            ).rangeValues[1]
                          )
                        }
                        label="To"
                        value={newFilter.max}
                        onChange={(e) => handleNewFilterChange(e, "maxD")}
                        inputProps={{
                          readOnly: true,
                          disabled: true,
                        }}
                        renderInput={(params) => <TextField {...params} />}
                      />
                    </LocalizationProvider>
                  </Grid>
                </Grid>
              )}
            {(newFilter.type == "Substring" || newFilter.type == "Equals") &&
              data.meta.find((e) => e.fieldName == newFilter.column_name)
                .dataType !== "date" && (
                <Grid container spacing={2} my={1}>
                  <Grid item xs={6}>
                    <TextField
                      id="outlined-basic"
                      label="Query"
                      variant="outlined"
                      value={newFilter.value}
                      type={
                        newFilter.column_data_type === "number"
                          ? "number"
                          : "text"
                      }
                      onChange={(e) => handleNewFilterChange(e, "value")}
                    />
                  </Grid>
                </Grid>
              )}
            {(newFilter.type == "Substring" || newFilter.type == "Equals") &&
              data.meta.find((e) => e.fieldName == newFilter.column_name)
                .dataType === "date" && (
                <Grid container spacing={2} my={1}>
                  <Grid item xs={6}>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <DatePicker
                        label="Equals"
                        minDate={
                          new Date(
                            data?.filters.find(
                              (e) => e.name == newFilter.column_name
                            ).rangeValues[0]
                          )
                        }
                        maxDate={
                          new Date(
                            data?.filters.find(
                              (e) => e.name == newFilter.column_name
                            ).rangeValues[1]
                          )
                        }
                        value={newFilter.value}
                        inputProps={{
                          readOnly: true,
                          disabled: true,
                        }}
                        onChange={(e) => handleNewFilterChange(e, "valueD")}
                        renderInput={(params) => <TextField {...params} />}
                      />
                    </LocalizationProvider>
                  </Grid>
                </Grid>
              )}
            {newFilter.type == "Select" && (
              <Grid container spacing={2} my={1}>
                <Grid item xs={6}>
                  <FormControl sx={{ minWidth: "50%" }}>
                    <InputLabel id="values-select-label">Type</InputLabel>
                    <Select
                      fullWidth
                      multiple
                      labelId="values-select-label"
                      label="Select"
                      value={newFilter.values}
                      onChange={(e) => handleNewFilterChange(e, "values")}
                      input={<OutlinedInput label="Values" />}
                    >
                      {data?.filters
                        .find((e) => e.name == newFilter.column_name)
                        .selections.map((selection, index) => (
                          <MenuItem key={index} value={selection}>
                            {selection}
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            )}
            <Grid container mt={2}>
              <Button onClick={() => addFilter()}>Add Filter</Button>
            </Grid>
          </Box>
        </Modal>
        <Modal
          open={openFilterDetails}
          onClose={() => {
            setCurrFilter({});
            setOpenFilterDetails(false);
          }}
          style={{ zIndex: 200 }}
        >
          <Box sx={style}>
            <Grid container spacing={2} my={1}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Column Name"
                  variant="outlined"
                  value={currFilter.column_name}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Filter Type"
                  variant="outlined"
                  value={currFilter.type}
                />
              </Grid>
            </Grid>
            {currFilter.type == "Range" &&
              data.meta.find((e) => e.fieldName == currFilter.column_name)
                .dataType !== "date" && (
                <Grid
                  container
                  justifyContent="space-around"
                  spacing={2}
                  mt={1}
                >
                  <Grid item xs={6}>
                    <TextField
                      id="min"
                      label="From"
                      type="number"
                      variant="outlined"
                      value={
                        currFilter.min ??
                        data?.filters.find(
                          (e) => e.name == currFilter.column_name
                        ).rangeValues[0]
                      }
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      id="max"
                      label="To"
                      type="number"
                      variant="outlined"
                      value={currFilter.max}
                    />
                  </Grid>
                </Grid>
              )}
            {currFilter.type == "Range" &&
              data.meta.find((e) => e.fieldName == currFilter.column_name)
                .dataType === "date" && (
                <Grid
                  container
                  justifyContent="space-around"
                  spacing={2}
                  mt={1}
                >
                  <Grid item xs={6}>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <DatePicker
                        readOnly
                        minDate={
                          new Date(
                            data?.filters.find(
                              (e) => e.name == currFilter.column_name
                            ).rangeValues[0]
                          )
                        }
                        maxDate={
                          new Date(
                            data?.filters.find(
                              (e) => e.name == currFilter.column_name
                            ).rangeValues[1]
                          )
                        }
                        label="From"
                        value={currFilter.min}
                        inputProps={{
                          readOnly: true,
                          disabled: true,
                        }}
                        renderInput={(params) => <TextField {...params} />}
                      />
                    </LocalizationProvider>
                  </Grid>
                  <Grid item xs={6}>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <DatePicker
                        readOnly
                        minDate={
                          new Date(
                            data?.filters.find(
                              (e) => e.name == currFilter.column_name
                            ).rangeValues[0]
                          )
                        }
                        maxDate={
                          new Date(
                            data?.filters.find(
                              (e) => e.name == currFilter.column_name
                            ).rangeValues[1]
                          )
                        }
                        label="To"
                        value={currFilter.max}
                        inputProps={{
                          readOnly: true,
                          disabled: true,
                        }}
                        renderInput={(params) => <TextField {...params} />}
                      />
                    </LocalizationProvider>
                  </Grid>
                </Grid>
              )}
            {(currFilter.type == "Substring" || currFilter.type == "Equals") &&
              data.meta.find((e) => e.fieldName == currFilter.column_name)
                .dataType !== "date" && (
                <Grid container spacing={2} my={1}>
                  <Grid item xs={6}>
                    <TextField
                      id="outlined-basic"
                      label="Query"
                      variant="outlined"
                      value={currFilter.value}
                      type={
                        currFilter.column_data_type === "number"
                          ? "number"
                          : "text"
                      }
                    />
                  </Grid>
                </Grid>
              )}
            {(currFilter.type == "Substring" || currFilter.type == "Equals") &&
              data.meta.find((e) => e.fieldName == currFilter.column_name)
                .dataType === "date" && (
                <Grid container spacing={2} my={1}>
                  <Grid item xs={6}>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <DatePicker
                        readOnly
                        label="Equals"
                        minDate={
                          new Date(
                            data?.filters.find(
                              (e) => e.name == currFilter.column_name
                            ).rangeValues[0]
                          )
                        }
                        maxDate={
                          new Date(
                            data?.filters.find(
                              (e) => e.name == currFilter.column_name
                            ).rangeValues[1]
                          )
                        }
                        value={currFilter.value}
                        inputProps={{
                          readOnly: true,
                          disabled: true,
                        }}
                        renderInput={(params) => <TextField {...params} />}
                      />
                    </LocalizationProvider>
                  </Grid>
                </Grid>
              )}
            {currFilter.type == "Select" && (
              <Grid container spacing={2} my={1}>
                <Grid item xs={6}>
                  <FormControl sx={{ minWidth: "50%" }}>
                    <InputLabel id="values-select-label">Type</InputLabel>
                    <Select
                      fullWidth
                      readOnly
                      multiple
                      labelId="values-select-label"
                      label="Select"
                      value={currFilter.values}
                      input={<OutlinedInput label="Values" />}
                    >
                      {data?.filters
                        .find((e) => e.name == currFilter.column_name)
                        .selections.map((selection, index) => (
                          <MenuItem key={index} value={selection}>
                            {selection}
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            )}
            {/* <Grid container mt={2}>
              <Button onClick={() => addFilter()}>Add Filter</Button>
            </Grid> */}
          </Box>
        </Modal>
        <Grid container justifyContent="center">
          <Grid item xs={10}>
            <Grid container justifyContent="left-align">
              {filters.map((filter, index) => (
                <Button
                  key={index}
                  style={{
                    color: "black",
                    fontFamily: "Work Sans",
                    fontSize: "1rem",
                    padding: "0.5rem 1.5rem",
                    marginBottom: "1rem",
                    marginRight: "0.5rem",
                    background: "#D3D3D3",
                    boxShadow: 3,
                  }}
                  component="label"
                  endIcon={
                    <CloseIcon
                      style={{ fontSize: "1.5rem" }}
                      onClick={() => {
                        handleDelete(index);
                      }}
                    />
                  }
                >
                  <span
                    onClick={() => {
                      setCurrFilter(filter);
                      setOpenFilterDetails(true);
                    }}
                  >
                    {filter.type} | {filter.column_name}
                  </span>
                </Button>
              ))}
              <Button
                variant="contained"
                style={{
                  color: "white",
                  fontFamily: "'Baloo Thambi 2'",
                  fontWeight: "bold",
                  fontSize: "1rem",
                  padding: "0.5rem 1.5rem",
                  marginBottom: "1rem",
                  boxShadow: 3,
                }}
                onClick={() => setOpen(true)}
                component="label"
                startIcon={<AddIcon style={{ fontSize: "1.5rem" }} />}
              >
                Add Filters
              </Button>
            </Grid>
            <Paper elevation={5}>
              <DataGrid
                rows={data.rows}
                columns={colTemp}
                disableColumnMenu={true}
                disableColumnSelector={true}
                components={{
                  Toolbar: CustomToolbar,
                  NoRowsOverlay: CustomNoRowsOverlay,
                }}
                disableSelectionOnClick={true}
                getRowId={(row) => row.Id}
                sx={{
                  height: "40rem",
                  "& .MuiDataGrid-columnHeaders": {
                    backgroundColor: "#112B3C",
                    borderRadius: "0rem",
                    fontSize: "1rem",
                    fontFamily: "Work Sans",
                    color: "white",
                  },
                  ".MuiDataGrid-columnHeader:focus": {
                    outline: "none",
                  },
                  ".MuiDataGrid-columnHeader:focus-within": {
                    outline: "none",
                  },
                  ".MuiDataGrid-toolbarContainer": {
                    backgroundColor: "#112B3C",
                    borderRadius: "0rem",
                    "& > button": {
                      color: "white",
                      margin: "0.5rem",
                    },
                  },
                  "&.MuiButtonBase-root": {
                    color: "white",
                  },
                  ".MuiDataGrid-sortIcon": {
                    color: "white",
                  },
                  ".MuiDataGrid-cell": {
                    fontSize: "1rem",
                    fontFamily: "'Baloo Thambi 2'",
                  },
                  ".MuiDataGrid-row:nth-of-type(even)": {
                    backgroundColor: "rgba(211,211,211,0.5)",
                  },
                  ".MuiDataGrid-sortIcon": {
                    color: "white",
                  },
                }}
                disableColumnFilter={true}
              />
            </Paper>
          </Grid>
        </Grid>
        <Grid container justifyContent="center">
          <Button
            variant="contained"
            style={{
              color: "white",
              fontFamily: "'Baloo Thambi 2'",
              fontWeight: "bold",
              fontSize: "1.2rem",
              padding: "0.5rem 1.5rem",
              margin: "2rem 0.5rem 0rem",
            }}
            onClick={() => filterData()}
            component="label"
            startIcon={<FilterAltIcon />}
          >
            Filter
          </Button>
          <Button
            variant="contained"
            style={{
              backgroundColor: "#f23030",
              color: "white",
              fontFamily: "'Baloo Thambi 2'",
              fontWeight: "bold",
              fontSize: "1.2rem",
              margin: "2rem 0.5rem 0rem",
            }}
            onClick={() => {
              setSelectedFile(null);
              setFilters([]);
              setData({});
              setFileStage("Not Uploaded");
            }}
            component="label"
            startIcon={<FilterAltIcon />}
          >
            Filter New File
          </Button>
        </Grid>
      </>
    );
  };

  const handleDrop = (e) => {
    e.preventDefault();
    // console.log(e.items.length);
    if (e.dataTransfer.items.length > 1) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Cannot add more than one file!",
      });
      return;
    }
    if (e.dataTransfer.items[0].type !== "application/json") {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "The file should be a JSON file!",
      });
      return;
    }
    setFileStage("Uploading");
    setSelectedFile(e.dataTransfer.items[0].getAsFile());
  };

  const addFilter = () => {
    if (newFilter.column_name === "") {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Choose column name!",
      });
      return;
    }
    if (newFilter.type === "") {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Choose type of filter!",
      });
      return;
    }
    if (newFilter.type === "Range") {
      if (newFilter.min === "" || newFilter.max === "") {
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: "Values cannot be empty",
        });
        return;
      }
      console.log(newFilter.min, newFilter.max);
      if (newFilter.min > newFilter.max) {
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: "Minimum value cannot be more than maximum value",
        });
        return;
      }
    }
    if (
      (newFilter.type === "Equals" || newFilter.type === "Substring") &&
      newFilter.value === ""
    ) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Values cannot be empty",
      });
      return;
    }
    if (newFilter.type === "Select" && newFilter.values.length === 0) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Select alteast one value!",
      });
      return;
    }
    setFilters([...filters, newFilter]);
    setNewFilter({
      column_name: "",
      column_data_type: "",
      type: "",
      values: [],
      value: "",
    });
    setOpen(false);
  };

  return (
    <div style={{ background: "#f5f5f5", minHeight: "100%" }}>
      <Grid container justifyContent="center" padding={2}>
        <h1 className={classes.heading}>End-User Search Queries (JSON)</h1>
        <Grid container justifyContent="center">
          <Landing
            fileStage={fileStage}
            classes={classes}
            setFileStage={setFileStage}
            setSelectedFile={setSelectedFile}
            handleDrop={handleDrop}
            selectedFile={selectedFile}
          />
          {fileStage === "Filter" && fileData()}
        </Grid>
      </Grid>
    </div>
  );
}

export default Home;
