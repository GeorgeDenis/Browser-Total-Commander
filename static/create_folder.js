import { getPathInfo, fetchDataByCurrentPath } from "./scripts.js";
import { openToast} from "./toast.js";
const modal = document.getElementById("folder-modal");
const overlay = document.querySelector(".overlay");
const closeModalBtn = document.getElementById("btn-folder-close");
const createFolderPanel1 = document.getElementById("createPanel1");
const createFolderPanel2 = document.getElementById("createPanel2");
const submitCreateFolder = document.getElementById("btn-submit-folder");

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

createFolderPanel1.addEventListener("click", () => openModal("panel1"));
createFolderPanel2.addEventListener("click", () => openModal("panel2"));

export function createFolderInput() {
  const folderValue = document.getElementById("folder").value;
  createFolder(modalPanelId, folderValue);
  document.getElementById("folder").value = "";
  closeModal();
}
submitCreateFolder.addEventListener('click',createFolderInput);

closeModalBtn.addEventListener("click", closeModal);
overlay.addEventListener("click", closeModal);

function createFolder(panelId, folderName) {
  let [path, partition, fetchPath, isPartition] = getPathInfo(panelId, 'folder',folderName);

  const oppositePanelId = panelId === "panel1" ? "panel2" : "panel1";
  let [oppositePath, oppositePartition, oppositeFetchPath, oppositeIsPartition] =
    getPathInfo(oppositePanelId,'folder');

  fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
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
        oppositeIsPartition
      );
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}
