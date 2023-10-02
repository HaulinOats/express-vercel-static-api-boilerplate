const getNameBtn = document.querySelector("#getNameButton");
getNameBtn.addEventListener("click", () => {
  try {
    const request = fetch("/api/getName", {
      method: "POST",
      body: JSON.stringify({ name: "Some Message" })
    });
  } catch (err) {}
});
