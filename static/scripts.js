const panel1List = document.getElementById("panel1List")
const panel2List = document.getElementById("panel2List")

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
          content += `<tr>
                                  <td>${name}</td>
                                  <td>${info.extension || ""}</td>
                                  <td>${info.size}</td>
                                  <td>${info.date}</td>
                              </tr>`;
        }
        tableBody.innerHTML = content;

        const otherTableId = panelId === "panel1" ? "panel2" : "panel1";
        addRowSelectionListeners(tableBody, otherTableId);
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
  });
}

