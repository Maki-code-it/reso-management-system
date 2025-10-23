<?php
require_once '../../../database.php';

header('Content-Type: application/json');

session_start();
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit;
}

$userId = (int)$_SESSION['user_id'];
$db = new Database();

try {
    // Active projects managed by this user
    $active = $db->get('projects', "status=eq.active&project_manager_id=eq.$userId");
    $activeCount = is_array($active) ? count($active) : 0;

    // Pending requests created by this user
    $pending = $db->get('projects', "status=eq.pending&created_by=eq.$userId");
    $pendingCount = is_array($pending) ? count($pending) : 0;

    // Completed projects managed by this user
    $completed = $db->get('projects', "status=eq.completed&project_manager_id=eq.$userId");
    $completedCount = is_array($completed) ? count($completed) : 0;

    // Total resources assigned for projects managed by this user
    $projects = $db->get('projects', "project_manager_id=eq.$userId");
    $totalResources = 0;
    if (is_array($projects)) {
        foreach ($projects as $p) {
            $totalResources += $p['assigned_resources'] ?? 0;
        }
    }

    echo json_encode([
        'success' => true,
        'data' => [
            'active' => $activeCount,
            'pending' => $pendingCount,
            'completed' => $completedCount,
            'resources' => $totalResources
        ]
    ]);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
