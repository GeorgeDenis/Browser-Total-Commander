import {
  getPathInfo,
  loadPartitionData,
  fetchFolderContents,
  fetchDataByCurrentPath,
  deselectLines,
} from "./scripts.js";
import { getDataToRename } from "./rename_data.js";
import { openToast } from "./toast.js";

const editButton = document.getElementById("btn-edit");
const modal = document.getElementById("edit-modal");
const overlay = document.querySelector(".overlay");
const closeModalBtn = document.getElementById("btn-edit-close");
const editArea = document.getElementById("edit");
const submitEditFile = document.getElementById("btn-submit-edit");

const editSelectedFiles = async function () {
  const selectedFiles = getDataToRename();
  let [partition, path] = verifyEditModal(selectedFiles);
  let textValue = editArea.value;
  if (selectedFiles.length === 1) {
    try {
      const response = await fetch(`/textfile/${partition}?path=${path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: textValue }),
      });
      const data = await response.json();
      console.log("Success:", data);
      closeModal();
      data['type'] = false;
      openToast(data);
    } catch (error) {
      console.error("Error:", error);
    }
  }
};

const openModal = function () {
  modal.classList.remove("hidden");
  overlay.classList.remove("hidden");
  const selectedFiles = getDataToRename();
  if (selectedFiles.length > 1) {
    console.log("Cannot edit more than one element at a time!");
    closeModal();
    return;
  }
  if (selectedFiles.length === 0) {
    console.log("You need to select an element to rename!");
    closeModal();
    return;
  }

  let [partition, path] = verifyEditModal(selectedFiles);
  if (partition && path) {
    let textareaValue = loadTextAndSetToTextarea(partition, path);
    editArea.value = textareaValue;
  }
};

const verifyEditModal = function (selectedFiles) {
  let srcNameArrayCopy = selectedFiles[0].replace(/\\/g, "/");
  let srcNameArray = selectedFiles[0].replace(/\\/g, "/").split("/");
  let fileName = srcNameArray.pop();
  let fileParts = fileName.split(".");

  if (
    fileParts.length < 2 ||
    fileParts[fileParts.length - 1].toLowerCase() !== "txt"
  ) {
    console.log("You need to select a text file to edit!");
    closeModal();
    return [null,null];
  }
  const partition = srcNameArrayCopy[0];
  const path = srcNameArrayCopy.slice(4);
  return [partition, path];
};

const closeModal = function () {
  modal.classList.add("hidden");
  overlay.classList.add("hidden");
};
editButton.addEventListener("click", openModal);
closeModalBtn.addEventListener("click", closeModal);
overlay.addEventListener("click", closeModal);

const getTextFromFile = async function (partition, path) {
  try {
    const response = await fetch(`/textfile/${partition}?path=${path}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error("Error:", error);
  }
};
async function loadTextAndSetToTextarea(partition, path) {
  let textareaValue = await getTextFromFile(partition, path);
  editArea.value = textareaValue;
}

submitEditFile.addEventListener("click", editSelectedFiles);
