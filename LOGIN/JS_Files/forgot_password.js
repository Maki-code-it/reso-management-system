const sendCodeBtn = document.getElementById("sendCodeBtn");
const forgotForm = document.getElementById("forgotForm");

sendCodeBtn.addEventListener("click", async () => {
  const email = document.getElementById("email").value;
  if (!email) {
    Swal.fire("Error", "Please enter your email", "error");
    return;
  }

  const formData = new FormData();
  formData.append("email", email);

  const response = await fetch("../PHP_Files/forgot_password_process.php", {
    method: "POST",
    body: formData
  });

  const result = await response.json();

  if (result.success) {
    Swal.fire("Code Sent!", `Check your email for the reset code.`, "success");
  } else {
    Swal.fire("Error", result.message || "Failed to send code", "error");
  }
});

forgotForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const code = document.getElementById("code").value;

  if (!code) {
    Swal.fire("Error", "Please enter the reset code", "error");
    return;
  }

  const formData = new FormData();
  formData.append("email", email);
  formData.append("code", code);

  const response = await fetch("../PHP_Files/verify_reset_code.php", {
    method: "POST",
    body: formData
  });

  const result = await response.json();

  if (result.success) {
    Swal.fire({
      title: "Code Verified!",
      icon: "success",
      confirmButtonColor: "#595959"
    }).then(() => {
      // Redirect to a page where user can enter new password
      window.location.href = `reset_password.html?email=${encodeURIComponent(email)}&code=${encodeURIComponent(code)}`;
    });
  } else {
    Swal.fire("Error", result.message, "error");
  }
});
