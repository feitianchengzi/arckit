const api = window.productFeedback;
const submit = document.getElementById("submitMode");
const status = document.getElementById("statusMode");
const retry = document.getElementById("retryButton");
const close = document.getElementById("closeButton");
const state = document.getElementById("feedbackState");

submit.addEventListener("click", () => api.switchMode("submit"));
status.addEventListener("click", () => api.switchMode("status"));
retry.addEventListener("click", () => api.retry());
close.addEventListener("click", () => api.close());

api.onState((value = {}) => {
  submit.classList.toggle("active", value.mode !== "status");
  status.classList.toggle("active", value.mode === "status");
  const failed = value.status === "error";
  submit.disabled = value.status !== "ready";
  status.disabled = value.status !== "ready";
  retry.classList.toggle("hidden", !failed);
  state.textContent = failed ? `连接失败 · ${value.code || "sdk_error"}` : value.status === "ready" ? "已连接" : "正在连接…";
});
