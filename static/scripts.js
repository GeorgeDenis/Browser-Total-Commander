const panel1List = document.getElementById("panel1List")
const panel2List = document.getElementById("panel2List")

document.addEventListener("DOMContentLoaded", () => {
  loadPartitionList(panel1List);
  loadPartitionList(panel2List);
});


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


