<?php
/**
 * Project API - using ProjectRepository
 */

// Start output buffering
ob_start();

// Error reporting - log errors but don't display
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

session_start();

// Clear buffered output and set JSON header
ob_end_clean();
header('Content-Type: application/json');

require_once 'ProjectRepository.php';

// Auth check
if (!isset($_SESSION['user_id'], $_SESSION['role'])) {
    http_response_code(401);
    exit(json_encode(['success' => false, 'error' => 'Unauthorized']));
}

$userId = (int)$_SESSION['user_id'];
$userRole = $_SESSION['role'];
$action = $_GET['action'] ?? '';

// Helper to get JSON input
function getInput() {
    $input = file_get_contents('php://input');
    $decoded = json_decode($input, true);
    return $decoded ?: [];
}

// Helper to send JSON response
function respond($data = null, $error = null, $code = 200) {
    http_response_code($code);
    echo json_encode($error ? ['success' => false, 'error' => $error] : ['success' => true, 'data' => $data]);
    exit;
}

try {
    // Instantiate ProjectRepository
    $repo = new ProjectRepository();

    switch ($action) {

        case 'getAll':
            $projects = $repo->getProjects($userRole === 'project_manager' ? $userId : null);

            $formatted = array_map(function($p) {
                return [
                    'id' => $p['id'],
                    'project_name' => $p['project_name'] ?? '',
                    'status' => $p['status'] ?? 'pending',
                    'start_date' => $p['start_date'] ?? null,
                    'duration' => $p['duration'] ?? '',
                    'priority' => $p['priority'] ?? '',
                    'total_resources_needed' => (int)($p['total_resources_needed'] ?? 0),
                    'assigned_resources' => (int)($p['assigned_resources'] ?? 0),
                    'created_at' => $p['created_at'] ?? null,
                    'completed_at' => $p['completed_at'] ?? null,
                    'notes' => $p['notes'] ?? '',
                    'resources' => $p['resources'] ?? [],
                    'history' => array_map(function($h) {
                        return [
                            'ts' => $h['event_date'] ?? $h['created_at'] ?? null,
                            'event' => $h['event_description'] ?? ''
                        ];
                    }, $p['project_history'] ?? []),
                    'project_manager' => $p['project_manager'] ?? null
                ];
            }, $projects);

            respond($formatted);
            break;

        case 'create':
            if ($userRole !== 'project_manager') {
                respond(null, 'Only Project Managers can create projects', 403);
            }

            $input = getInput();

            if (empty($input['project_name'])) {
                respond(null, 'Project name is required', 400);
            }

            $projectData = [
                'project_name' => $input['project_name'],
                'status' => 'pending',
                'start_date' => $input['start_date'] ?? null,
                'duration' => $input['duration'] ?? '',
                'priority' => $input['priority'] ?? '',
                'total_resources_needed' => (int)($input['total_resources_needed'] ?? 0),
                'assigned_resources' => 0,
                'notes' => $input['notes'] ?? '',
                'resources' => $input['resources'] ?? [],
                'project_manager_id' => $userId,
                'created_by' => $userId,
                'history' => [[
                    'event_date' => date('Y-m-d'),
                    'event_description' => 'Request submitted',
                    'created_by' => $userId
                ]]
            ];

            $result = $repo->createProject($projectData);
            respond($result);
            break;

        case 'requestResources':
            $input = getInput();
            $projectId = (int)($input['project_id'] ?? 0);

            if (!$projectId) {
                respond(null, 'Project ID is required', 400);
            }

            $project = $repo->getProject($projectId);
            if (!$project) {
                respond(null, 'Project not found', 404);
            }

            if ($userRole === 'project_manager' && $project['project_manager_id'] != $userId) {
                respond(null, 'Unauthorized', 403);
            }

            $result = $repo->addResourceRequest(
                $projectId,
                $input['resources'] ?? [],
                $input['reason'] ?? null,
                $userId
            );

            respond($result);
            break;

        case 'completeProject':
            $input = getInput();
            $projectId = (int)($input['project_id'] ?? 0);

            if (!$projectId) {
                respond(null, 'Project ID is required', 400);
            }

            $project = $repo->getProject($projectId);
            if (!$project) {
                respond(null, 'Project not found', 404);
            }

            if ($userRole === 'project_manager' && $project['project_manager_id'] != $userId) {
                respond(null, 'Only the project manager can complete this project', 403);
            }

            if ($project['status'] === 'completed') {
                respond(null, 'Project is already completed', 400);
            }

            $result = $repo->completeProject($projectId, $userId);
            respond($result);
            break;

        case 'getUserInfo':
            $user = $repo->getUser($userId);
            if (!$user) {
                respond(null, 'User not found', 404);
            }
            respond($user);
            break;

        default:
            respond(null, 'Invalid action', 400);
    }

} catch (Exception $e) {
    error_log('Project API Error: ' . $e->getMessage());
    respond(null, $e->getMessage(), 500);
}
