const toast = document.getElementById("toast-modal");
const closeToastBtn = document.getElementById("btn-toast-close");
const overlay = document.querySelector(".overlay");

const openToast = function (data) {
  const dataContainer = document.getElementById("data-container"); 

  dataContainer.innerHTML = '';

  let complexOperation = data.type;
  if (!complexOperation) {
    let message = data.message ? data.message : data.error;
    let dataType = data.message ? "success" : "error";

    const p = document.createElement("p");
    p.classList.add(dataType);
    p.textContent = message;
    dataContainer.appendChild(p); 
  } else {
    data.results.forEach(result => {
      const p = document.createElement("p");
      if (result.includes("Status: Failed")) {
        p.classList.add("error"); 
      } else if (result.includes("Status: Success")) {
        p.classList.add("success"); 
      }
      p.textContent = `${result}`; 
      dataContainer.appendChild(p); 
    });
  }

  toast.classList.remove("hidden");
  overlay.classList.remove("hidden");
};


const closeToast = function () {
  toast.classList.add("hidden");
  overlay.classList.add("hidden");
};
closeToastBtn.addEventListener("click", closeToast);
export { openToast, closeToast };
