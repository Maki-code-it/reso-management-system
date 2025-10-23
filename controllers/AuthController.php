<?php
if(session_status() === PHP_SESSION_NONE) session_start();

$action = $_GET['action'] ?? '';

if($action === 'logout'){
    // Destroy session
    session_unset();
    session_destroy();

    // Return JSON response
    header('Content-Type: application/json');
    echo json_encode(['success' => true]);
    exit;
}
