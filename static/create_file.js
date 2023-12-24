import { getPathInfo, fetchDataByCurrentPath } from "./scripts.js";
const modal = document.getElementById("file-modal");
const overlay = document.querySelector(".overlay");
const closeModalBtn = document.getElementById("btn-file-close");
const createFilePanel1 = document.getElementById("createFilePanel1");
const createFilePanel2 = document.getElementById("createFilePanel2");
const submitCreateFile = document.getElementById("btn-submit-file");
let modalPanelId = "";

const openModal = function (panelId) {
  modal.classList.remove("hidden");
  overlay.classList.remove("hidden");
  modalPanelId = panelId;
};

const closeModal = function () {
  modal.classList.add("hidden");
  overlay.classList.add("hidden");
  modalPanelId = "";
};

createFilePanel1.addEventListener("click", () => openModal("panel1"));
createFilePanel2.addEventListener("click", () => openModal("panel2"));

closeModalBtn.addEventListener("click", closeModal);
overlay.addEventListener("click", closeModal);

export function createFileInput() {
  const fileValue = document.getElementById("file").value;
  createFile(modalPanelId, fileValue);
  document.getElementById("file").value = "";
  closeModal();
}
submitCreateFile.addEventListener('click',createFileInput);

function createFile(panelId, fileName) {
  let [path, partition, fetchPath, isPartition] = getPathInfo(panelId,'file',fileName);

  const oppositePanelId = panelId === "panel1" ? "panel2" : "panel1";
  let [oppositePath, oppositePartition, oppositeFetchPath, oppositeIsPartition] =
    getPathInfo(oppositePanelId,'file');

  fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("Success:", data);
      fetchDataByCurrentPath(panelId, partition, fetchPath, isPartition);
      fetchDataByCurrentPath(
        oppositePanelId,
        oppositePartition,
        oppositeFetchPath,
        oppositeIsPartition
      );
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}
