<?php
require_once '../../../database.php';
header('Content-Type: application/json');

// Start the session if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Check if user_id exists in session
if (!isset($_SESSION['user_id'])) {
    echo json_encode([]);
    exit;
}

$userId = $_SESSION['user_id'];

$db = new Database();

// Fetch only pending projects for this user, newest first
$projects = $db->get('projects', "status=eq.pending&created_by=eq.$userId&order=created_at.desc");

// Return JSON
echo json_encode($projects);
