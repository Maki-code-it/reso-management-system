<?php
header('Content-Type: application/json');
require_once '../../../database.php';

class ProjectRepository extends Database {

    public function __construct() {
        parent::__construct();
    }

    /**
     * Get user by email
     */
    public function getUserByEmail($email) {
        try {
            $endpoint = 'users?select=*&email=eq.' . urlencode($email);
            $result = $this->request('GET', $endpoint);
            return (!empty($result) && is_array($result)) ? $result[0] : null;
        } catch (Exception $e) {
            error_log("Failed to load user by email: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Get user by ID
     */
    public function getUser($userId) {
        try {
            $endpoint = 'users?select=*&id=eq.' . intval($userId);
            $result = $this->request('GET', $endpoint);
            return (!empty($result) && is_array($result)) ? $result[0] : null;
        } catch (Exception $e) {
            error_log("Failed to load user $userId: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Get all projects (optionally filtered by project manager)
     */
    public function getProjects($userId = null) {
        try {
            $endpoint = 'projects?select=*&order=created_at.desc';
            if ($userId !== null) $endpoint .= '&project_manager_id=eq.' . intval($userId);

            $projects = $this->request('GET', $endpoint);
            if (!is_array($projects)) return [];

            foreach ($projects as &$project) {
                $this->loadProjectDetails($project);
            }

            return $projects;
        } catch (Exception $e) {
            error_log("Failed to load projects: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Get a single project by ID
     */
    public function getProject($projectId) {
        try {
            $endpoint = 'projects?select=*&id=eq.' . intval($projectId);
            $result = $this->request('GET', $endpoint);
            if (empty($result) || !is_array($result)) return null;

            $project = $result[0];
            $this->loadProjectDetails($project);
            return $project;
        } catch (Exception $e) {
            error_log("Failed to load project $projectId: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Create a new project
     */
    public function createProject($data) {
        try {
            if (empty($data['project_manager_id'])) throw new Exception('Project manager ID is required');

            $requestedResources = $data['resources'] ?? [];
            $data['resources'] = json_encode($requestedResources);

            $history = $data['history'] ?? [];
            unset($data['history']);

            $data['assigned_resources'] = 0;
            $data['status'] = $data['status'] ?? 'pending';
            $data['project_manager_id'] = strval($data['project_manager_id']);
            if (isset($data['created_by'])) $data['created_by'] = intval($data['created_by']);

            $result = $this->request('POST', 'projects', $data);
            if (empty($result) || !is_array($result)) throw new Exception('Failed to create project');

            $project = $result[0];
            $projectId = $project['id'];

            foreach ($history as $historyItem) {
                try {
                    $historyItem['project_id'] = $projectId;
                    if (isset($historyItem['created_by'])) $historyItem['created_by'] = strval($historyItem['created_by']);
                    $this->request('POST', 'project_history', $historyItem);
                } catch (Exception $e) {
                    error_log("Failed to add history entry: " . $e->getMessage());
                }
            }

            return $this->getProject($projectId);
        } catch (Exception $e) {
            error_log("Failed to create project: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Complete a project
     */
    public function completeProject($projectId, $userId = null) {
        try {
            $projectId = intval($projectId);

            $updateData = [
                'status' => 'completed',
                'completed_at' => date('Y-m-d')
            ];

            $endpoint = 'projects?id=eq.' . $projectId;
            $result = $this->request('PATCH', $endpoint, $updateData);
            if (empty($result)) throw new Exception('Failed to update project status');

            $this->addHistory($projectId, 'Project marked as completed', $userId);
            return $this->getProject($projectId);
        } catch (Exception $e) {
            error_log("Failed to complete project $projectId: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Add a project history entry
     */
    public function addHistory($projectId, $event, $userId = null) {
        try {
            $data = [
                'project_id' => intval($projectId),
                'event_date' => date('Y-m-d'),
                'event_description' => $event
            ];
            if ($userId !== null) $data['created_by'] = strval($userId);

            return $this->request('POST', 'project_history', $data);
        } catch (Exception $e) {
            error_log("Failed to add history: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Add a resource request to a project
     */
    public function addResourceRequest($projectId, $resources, $reason = null, $userId = null) {
        try {
            if (empty($resources)) throw new Exception('Resources are required');

            $summary = implode('; ', array_map(function($r) {
                return "+{$r['count']} {$r['type']} (skills: {$r['skills']})";
            }, $resources));

            $eventText = "Requested additional resources: " . $summary;
            if (!empty($reason)) $eventText .= " - " . $reason;

            return $this->addHistory($projectId, $eventText, $userId);
        } catch (Exception $e) {
            error_log("Failed to add resource request: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Helper: Load full project details (history, resources, manager)
     */
    private function loadProjectDetails(&$project) {
        $projectId = $project['id'];

        // History
        try {
            $project['project_history'] = $this->request('GET', 'project_history?select=*&project_id=eq.' . $projectId . '&order=created_at.desc');
        } catch (Exception $e) {
            $project['project_history'] = [];
        }

        // Resources
        try {
            $project['project_resources'] = $this->request('GET', 'project_resources?select=*&project_id=eq.' . $projectId);
        } catch (Exception $e) {
            $project['project_resources'] = [];
        }

        // Project manager
        if (!empty($project['project_manager_id'])) {
            try {
                $pmResult = $this->request('GET', 'users?select=id,name,email&id=eq.' . intval($project['project_manager_id']));
                $project['project_manager'] = !empty($pmResult) ? $pmResult[0] : null;
            } catch (Exception $e) {
                $project['project_manager'] = null;
            }
        } else {
            $project['project_manager'] = null;
        }

        // Parse resources JSON
        $project['resources'] = isset($project['resources']) ? json_decode($project['resources'], true) ?? [] : [];
        $project['assigned_resources'] = array_sum(array_map(fn($r) => intval($r['quantity'] ?? $r['count'] ?? 0), $project['project_resources']));
        if (!in_array($project['status'] ?? '', ['pending','active','completed','cancelled'])) $project['status'] = 'pending';
    }
}
