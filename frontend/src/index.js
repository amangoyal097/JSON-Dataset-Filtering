import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BrowserRouter as Router } from "react-router-dom";

const rootNode = document.getElementById("root");

ReactDOM.createRoot(rootNode).render(
  <Router>
    <App />
  </Router>
);
