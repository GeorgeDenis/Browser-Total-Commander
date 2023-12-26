const panel1List = document.getElementById("panel1List");
const panel2List = document.getElementById("panel2List");

let pathPanel1 = "";
let pathPanel2 = "";
const otherTableId = "";

async function loadPartitionList(panel) {
  const response = await fetch("/partitions");
  const data = await response.json();
  data.partitions.forEach((partition) => {
    const option = document.createElement("option");
    option.value = partition;
    option.textContent = partition;
    panel.appendChild(option);
  });
}

function loadPartitionData(panelId, partition) {
  fetch(`/${partition}`)
    .then((response) => response.json())
    .then((data) => {
      const panel = document.getElementById(panelId);
      let tableBody = panel.getElementsByTagName("tbody")[0];

      if (data.error) {
        tableBody.innerHTML = `<tr><td colspan="4">Error: ${data.error}</td></tr>`;
      } else {
        let content = "";
        for (const [name, info] of Object.entries(data.folders)) {
          content += `<tr data-path="${info.path}">
                                  <td>${name}</td>
                                  <td>${info.extension || ""}</td>
                                  <td>${info.size}</td>
                                  <td>${info.date}</td>
                              </tr>`;
        }
        tableBody.innerHTML = content;

        const otherTableId = panelId === "panel1" ? "panel2" : "panel1";
        addRowSelectionListeners(tableBody, otherTableId);
        if (panelId === "panel1") {
          pathPanel1 = partition;
        } else {
          pathPanel2 = partition;
        }
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      tableBody.innerHTML = `<tr><td colspan="4">Error loading data: ${error}</td></tr>`;
    });
}

function initPartitionSelectors() {
  Promise.all([
    loadPartitionList(panel1List),
    loadPartitionList(panel2List),
  ]).then(() => {
    panel1PartitionSelector();
    panel2PartitionSelector();
  });

  panel1List.addEventListener("change", panel1PartitionSelector);
  panel2List.addEventListener("change", panel2PartitionSelector);
}
function panel1PartitionSelector() {
  if (panel1List.options.length > 0) {
    const selectedPartition = panel1List.value;
    loadPartitionData("panel1", selectedPartition);
  }
}

function panel2PartitionSelector() {
  if (panel2List.options.length > 0) {
    const selectedPartition = panel2List.value;
    loadPartitionData("panel2", selectedPartition);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initPartitionSelectors();
});

function addRowSelectionListeners(tableBody, otherTableId) {
  tableBody.querySelectorAll("tr").forEach((row) => {
    row.addEventListener("click", () => {
      const otherTableBody = document
        .getElementById(otherTableId)
        .getElementsByTagName("tbody")[0];
      const selectedInOtherTable = otherTableBody.querySelector(".selected");
      if (!selectedInOtherTable) {
        row.classList.toggle("selected");
      }
    });
    row.addEventListener("dblclick", function () {
      const fullPath = this.getAttribute("data-path");
      const parts = fullPath.split("/");
      const partition = parts[0][0];
      const path = parts.slice(1).join("/");
      const tableId = otherTableId === "panel1" ? "panel2" : "panel1";
      fetchFolderContents(tableId, partition, path);
    });
  });
}
function deselectLines(tableBody) {
  tableBody.querySelectorAll("tr").forEach((row) => {
    if (row.classList.contains("selected")) {
      row.classList.remove("selected");
    }
  });
}
function getSelectedLines(tableBody){
  const selectedFiles = []
  tableBody.querySelectorAll("tr").forEach((row) => {
    if (row.classList.contains("selected")) {
      selectedFiles.push(row.getAttribute("data-path"))
    }
  });
  return selectedFiles;
}
function fetchFolderContents(panelId, partition, path) {
  fetch(`/${partition}?path=${encodeURIComponent(path)}`)
    .then((response) => response.json())
    .then((data) => {
      const panel = document.getElementById(panelId);
      let tableBody = panel.getElementsByTagName("tbody")[0];

      if (data.error) {
        tableBody.innerHTML = `<tr><td colspan="4">Error: ${data.error}</td></tr>`;
      } else {
        let content = "";
        for (const [name, info] of Object.entries(data.folders)) {
          content += `<tr data-path="${info.path}">
                          <td>${name}</td>
                          <td>${info.extension || ""}</td>
                          <td>${info.size}</td>
                          <td>${info.date}</td>
                      </tr>`;
        }
        tableBody.innerHTML = content;
        const otherTableId = panelId === "panel1" ? "panel2" : "panel1";
        addRowSelectionListeners(tableBody, otherTableId);
        if (panelId === "panel1") {
          pathPanel1 = `${partition}?path=${path}`;
        } else {
          pathPanel2 = `${partition}?path=${path}`;
        }
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      tableBody.innerHTML = `<tr><td colspan="4">Error loading data: ${error}</td></tr>`;
    });
}
function getPathInfo(panelId, type = "folder", folderName = "") {
  let path = panelId === "panel1" ? pathPanel1 : pathPanel2;
  const fetchPath = path.split("=")[1];
  const partition = path[0];
  let isPartition = false;
  if (path.length === 1) {
    path = `${type}/${path}?path=/${folderName}`;
    isPartition = true;
  } else {
    path = `/${type}/${path}/${folderName}`;
  }
  return [path, partition, fetchPath, isPartition];
}

function fetchDataByCurrentPath(
  panelId,
  partition,
  fetchPath,
  isPartition = false
) {
  if (isPartition) {
    loadPartitionData(panelId, partition);
  } else {
    fetchFolderContents(panelId, partition, fetchPath);
  }
}

export {
  getPathInfo,
  fetchDataByCurrentPath,
  loadPartitionData,
  fetchFolderContents,
  deselectLines,
  getSelectedLines,
};
