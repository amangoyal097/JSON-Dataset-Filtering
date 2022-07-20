import React from "react";
import json from "./images/json.png";
import icon from "./images/icon.png";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { humanFileSize, nameCheck } from "./utils.js";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import FilterAltIcon from "@mui/icons-material/FilterAlt";

import Swal from "sweetalert2";

const Landing = ({
  fileStage,
  classes,
  setFileStage,
  setSelectedFile,
  handleDrop,
  selectedFile,
}) => {
  return (
    <>
      {fileStage === "Not Uploaded" && (
        <Grid item md={7} xl={5} mt="5rem">
          <Grid
            container
            className={classes.drag}
            justifyContent="center"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            <Grid
              container
              className={classes.innerdrag}
              justifyContent="center"
            >
              <Grid container justifyContent="center" margin={2}>
                <Grid item md={1}>
                  <img src={json} alt="JSON" width="100%" />
                </Grid>
              </Grid>
              <Grid item md={5} xl={3}>
                <Button
                  fullWidth
                  variant="contained"
                  style={{
                    backgroundColor: "white",
                    color: "black",
                    fontFamily: "'Baloo Thambi 2'",
                    fontWeight: "bold",
                    fontSize: "1.2rem",
                  }}
                  component="label"
                  startIcon={<UploadFileIcon />}
                >
                  Choose File
                  <input
                    accept=".json"
                    type="file"
                    onChange={(event) => {
                      if (event.target.files.length > 1) {
                        Swal.fire({
                          icon: "error",
                          title: "Oops...",
                          text: "Cannot add more than one file!",
                        });
                        return;
                      }
                      if (event.target.files[0].type !== "application/json") {
                        Swal.fire({
                          icon: "error",
                          title: "Oops...",
                          text: "The file should be a JSON file!",
                        });
                        return;
                      }
                      setFileStage("Uploading");
                      setSelectedFile(event.target.files[0]);
                    }}
                    hidden
                  />
                </Button>
              </Grid>
              <Grid container justifyContent="center">
                <h1 className={classes.label}>or drop files here</h1>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      )}
      {fileStage === "Uploading" && (
        <Grid item md={7} xl={5} mt="5rem">
          <Grid container justifyContent="center" className={classes.uploading}>
            <Grid
              container
              justifyContent="center"
              height="100%"
              alignItems="center"
            >
              <Grid item lg={1.5}>
                <img src={icon} alt="UploadIcon" width="100%" />
              </Grid>
              <h1 className={classes.uploadText}>Uploading</h1>
            </Grid>
          </Grid>
        </Grid>
      )}
      {fileStage === "Uploaded" && (
        <Grid item md={7} xl={5} mt="5rem">
          <Grid
            container
            justifyContent="center"
            className={classes.uploading}
            direction="column"
          >
            <Grid container justifyContent="center" alignItems="center">
              <Grid container justifyContent="center">
                <Grid item lg={1.5}>
                  <img src={icon} alt="UploadIcon" width="100%" />
                </Grid>
              </Grid>
              <Grid container justifyContent="center">
                <p className={classes.fileName}>
                  {nameCheck(selectedFile.name)}
                </p>
              </Grid>
              <Grid container justifyContent="center">
                <p className={classes.fileSize}>
                  {humanFileSize(selectedFile.size)}
                </p>
              </Grid>
            </Grid>
          </Grid>
          <Grid container justifyContent="center" mt={2}>
            <Button
              variant="contained"
              style={{
                backgroundColor: "#f23030",
                color: "white",
                fontFamily: "'Baloo Thambi 2'",
                fontWeight: "bold",
                fontSize: "1.2rem",
                padding: "0.5rem 1.5rem",
              }}
              onClick={() => setFileStage("Filter")}
              component="label"
              startIcon={<FilterAltIcon />}
            >
              Filter
            </Button>
          </Grid>
        </Grid>
      )}
    </>
  );
};

export default Landing;
