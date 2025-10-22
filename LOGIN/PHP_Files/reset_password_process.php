<?php
session_start();
require_once "../PHP_Files/login.php";
header('Content-Type: application/json');

// Get email and code from session
$email = $_SESSION['reset_email'] ?? '';
$code = $_SESSION['reset_code'] ?? '';
$newPassword = $_POST['password'] ?? '';

if (!$email || !$code) {
    echo json_encode(["success" => false, "message" => "Session expired. Please request a new code."]);
    exit;
}

$user = new User();
$result = $user->resetPasswordWithCode($email, $code, $newPassword);

// Clear session after successful reset
if ($result['success']) {
    unset($_SESSION['reset_email'], $_SESSION['reset_code']);
}

echo json_encode($result);
?>
