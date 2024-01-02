import {
  getPathInfo,
  fetchDataByCurrentPath,
  getSelectedLines,
  deselectLines,
  loadPartitionData,
  fetchFolderContents,
} from "./scripts.js";
import { openToast} from "./toast.js";

const modal = document.getElementById("rename-modal");
const overlay = document.querySelector(".overlay");
const closeModalBtn = document.getElementById("btn-rename-close");
const renameFilePanel1 = document.getElementById("renameFilePanel1");
const renameFilePanel2 = document.getElementById("renameFilePanel2");
const submitRenameFile = document.getElementById("btn-submit-rename");
let modalPanelId = "";

const openModal = function (panelId) {
  modal.classList.remove("hidden");
  overlay.classList.remove("hidden");
  modalPanelId = panelId;
  const selectedFiles = getDataToRename();
  if (selectedFiles.length > 1) {
    console.log("Cannot rename more than one element at a time!");
    deselectLines(tableBody);
    closeModal();
    return;
  }
  if (selectedFiles.length === 0) {
    console.log("You need to select an element to rename!");
    closeModal();
    return;
  }
  let srcNameArray = selectedFiles[0].replace(/\\/g, '/').split("/");
  let fullFileName = srcNameArray.pop(); 

  let fileNameWithoutExtension = fullFileName.split(".")[0]; 
  document.getElementById("rename").value = fileNameWithoutExtension;
};


const closeModal = function () {
  modal.classList.add("hidden");
  overlay.classList.add("hidden");
  modalPanelId = "";
};

renameFilePanel1.addEventListener("click", () => openModal("panel1"));
renameFilePanel2.addEventListener("click", () => openModal("panel2"));

closeModalBtn.addEventListener("click", closeModal);
overlay.addEventListener("click", closeModal);

function renameFileInput() {
  const renameValue = document.getElementById("rename").value;
  renameFile(modalPanelId, renameValue);
  document.getElementById("rename").value = "";
  closeModal();
}

submitRenameFile.addEventListener("click", renameFileInput);

function renameFile(panelId, fileName) {
  let destName = document.getElementById("rename").value;
  let newPath = "";
  const selectedFiles = getDataToRename();

  if (selectedFiles.length > 0) {
    let filePath = selectedFiles[0];
    let segments = filePath.replace(/\\/g, "/").split("/");
    let lastSegment = segments.pop();

    let parts = lastSegment.split(".");
    if (parts.length > 1) {
      parts[0] = destName;
      segments.push(parts.join("."));
    } else {
      segments.push(destName);
    }
    newPath = segments.join("/");
    let [path, partition, fetchPath, isPartition] = getPathInfo(panelId);
    const oppositePanelId = panelId === "panel1" ? "panel2" : "panel1";
    let [
      oppositePath,
      oppositePartition,
      oppositeFetchPath,
      oppositeIsPartition,
    ] = getPathInfo(oppositePanelId);
    fetch("/rename", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ src: selectedFiles[0], dest: newPath }),
    })
      .then((response) => response.json())
      .then((data) => {
        data["type"] = false;
        openToast(data)
        fetchDataByCurrentPath(panelId, partition, fetchPath, isPartition);
        fetchDataByCurrentPath(
          oppositePanelId,
          oppositePartition,
          oppositeFetchPath,
          true
        );
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  } else {
    console.log("No file selected to rename.");
  }
}

export function getDataToRename() {
  const panels = ["panel1", "panel2"];
  let currentPanelId = "";
  let pathsToRename = [];
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
    pathsToRename = pathsToRename.concat(paths);
  });
  return pathsToRename;
}
