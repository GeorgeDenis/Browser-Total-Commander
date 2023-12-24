import { getPathInfo,loadPartitionData,fetchFolderContents } from "./scripts.js";

const copyButton = document.getElementById("btn-copy")

function copySelectedFiles(){
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
  let [path, partition, fetchPath, isPartition] = getPathInfo(currentPanelId);
  if (pathsToCopy.length > 0) {
    console.log(pathsToCopy)
  } else {
    console.log("No files selected for copying.");
  }
}

copyButton.addEventListener("click",copySelectedFiles);