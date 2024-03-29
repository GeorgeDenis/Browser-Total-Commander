import { getPathInfo,loadPartitionData,fetchFolderContents } from "./scripts.js";
import { openToast} from "./toast.js";

const deleteButton = document.getElementById("btn-delete")

function deleteSelectedFiles() {
  const panels = ["panel1", "panel2"];
  let currentPanelId = "";
  let pathsToDelete = [];
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
    pathsToDelete = pathsToDelete.concat(paths);
  });
  let [path, partition, fetchPath, isPartition] = getPathInfo(currentPanelId);

  if (pathsToDelete.length > 0) {
    fetch("/", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ paths: pathsToDelete }),
    })
      .then((response) => response.json())
      .then((data) => {
        let message = data.message;
        let dataResults = [];
        const results = data.results;
        let resultText = "";
        results.forEach((result) => {
          if (result.src_path) resultText += `Source Path: ${result.src_path} `;
          if (result.reason) resultText += `Reason: ${result.reason} `;
          if (result.status) resultText += `Status: ${result.status}`;
          dataResults.push(resultText);
          resultText = "";
        });
        data.message = message;
        data["type"] = true;
        data["results"] = dataResults;
        openToast(data);
        selectedRowsElements.forEach((row) => row.remove());
        if (isPartition) {
          loadPartitionData(currentPanelId, partition);
        } else {
          fetchFolderContents(currentPanelId, partition, fetchPath);
        }
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  } else {
    console.log("No files selected for deletion.");
  }
}

deleteButton.addEventListener("click", deleteSelectedFiles);
