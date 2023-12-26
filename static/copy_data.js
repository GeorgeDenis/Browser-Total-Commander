import {
  getPathInfo,
  loadPartitionData,
  fetchFolderContents,
  fetchDataByCurrentPath,
  deselectLines,
} from "./scripts.js";

const copyButton = document.getElementById("btn-copy");

function copySelectedFiles() {
  const panels = ["panel1", "panel2"];
  let currentPanelId = "";
  let pathsToCopy = [];
  let selectedRowsElements = [];

  panels.forEach((panelId) => {
    const tableBody = document
      .getElementById(panelId)
      .getElementsByTagName("tbody")[0];
    const selectedRows = tableBody.querySelectorAll("tr.selected");

    const paths = Array.from(selectedRows).map((row) => {
      selectedRowsElements.push(row);
      return row.getAttribute("data-path");
    });
    if (paths.length) {
      currentPanelId = panelId === "panel1" ? "panel2" : "panel1";
    }
    pathsToCopy = pathsToCopy.concat(paths);
  });
  let [path, partition, fetchPath, isPartition] = getPathInfo(
    currentPanelId,
    "copy"
  );
  const oppositePanelId = currentPanelId === "panel1" ? "panel2" : "panel1";
  if (pathsToCopy.length > 0) {
    fetch(path, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ paths: pathsToCopy }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Success:", data.message);
        const results = data.results;
        results.forEach((result) => {
          console.log(result);
        });
        fetchDataByCurrentPath(currentPanelId, partition, fetchPath, isPartition);
        const panel = document.getElementById(oppositePanelId);
        let tableBody = panel.getElementsByTagName("tbody")[0];
        deselectLines(tableBody)
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  } else {
    console.log("No files selected for copying.");
  }
}

copyButton.addEventListener("click", copySelectedFiles);
