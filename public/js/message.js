const getNameBtn = document.querySelector("#getNameButton");
const successEl = document.querySelector(".success");
const errorEl = document.querySelector(".error");

getNameBtn.addEventListener("click", async () => {
  try {
    const request = await fetch("/api/message", {
      method: "POST",
      headers: {
        "Content-type": "application/json"
      },
      body: JSON.stringify({ wasSuccessful: true })
    });
    const response = await request.json();
    if (response.success) {
      successEl.classList.add("show");
      errorEl.classList.remove("show");
      successEl.textContent = response.success;
    } else if (response.error) {
      successEl.classList.remove("show");
      errorEl.classList.add("show");
      errorEl.textContent = response.error;
    }
  } catch (error) {
    successEl.classList.remove("show");
    errorEl.classList.add("show");
    successEl.textContent = error;
  }
});
