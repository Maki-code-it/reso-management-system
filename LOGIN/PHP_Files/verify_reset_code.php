<?php
session_start();
require_once "../PHP_Files/login.php"; // adjust path

header('Content-Type: application/json');

$email = $_POST['email'] ?? '';
$code = $_POST['code'] ?? '';

$user = new User();
$result = $user->verifyResetCode($email, $code);

if ($result['success']) {
    // Save email/code to session for the reset page
    $_SESSION['reset_email'] = $email;
    $_SESSION['reset_code'] = $code;
}

echo json_encode($result);
