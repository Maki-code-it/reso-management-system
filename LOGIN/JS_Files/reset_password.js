document.addEventListener("DOMContentLoaded", () => {
    const resetForm = document.getElementById("resetForm");
    const urlParams = new URLSearchParams(window.location.search);
    const email = urlParams.get("email") || "";
    const code = urlParams.get("code") || "";
  
    resetForm.addEventListener("submit", async (e) => {
      e.preventDefault();
  
      const newPassword = document.getElementById("password").value;
      if (!newPassword) {
        Swal.fire("Error", "Please enter a new password", "error");
        return;
      }
  
      const formData = new FormData();
      formData.append("email", email);
      formData.append("code", code);
      formData.append("password", newPassword);
  
      try {
        const response = await fetch("../PHP_Files/reset_password_process.php", {
          method: "POST",
          body: formData
        });
  
        const result = await response.json();
  
        if (result.success) {
          Swal.fire({
            title: "Password Reset Successful!",
            icon: "success",
            confirmButtonColor: "#595959"
          }).then(() => {
            window.location.href = "../HTML_Files/login.html";
          });
        } else {
          Swal.fire("Error", result.message || "Failed to reset password", "error");
        }
      } catch (err) {
        Swal.fire("Error", "An unexpected error occurred", "error");
        console.error(err);
      }
    });
  });
  