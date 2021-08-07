window.addEventListener("load", () => {
  const search = document.getElementById("search");
  const searchValue = document.getElementById("search-value");

  search.addEventListener("click", () => {
    window.location.href = "/?search=" + searchValue.value;
  });

  searchValue.addEventListener("keyup", ({ key }) => {
    if (key === "Enter") {
      window.location.href = "/?search=" + searchValue.value;
    }
  });

  const videoElement = document.getElementById("video");
  videoElement.setAttribute("src", "kane"); // empty source
  videoElement.load();
  setTimeout(() => {
    videoElement.setAttribute("src", `/video/${Date.now()}`);
    videoElement.load();
  }, 3000);
});

const seeMovie = (oldSearch, id) => {
  if (oldSearch) {
    window.location.href = `/?search=${oldSearch}`;
  }
  if (id) {
    const xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
      if (this.readyState == 4 && this.status == 200) {
        // Typical action to be performed when the document is ready:
        console.log(xhttp.responseText);
      }
    };
    xhttp.open("GET", `/load?id=${id}`, true);
    xhttp.send();
  }
};
