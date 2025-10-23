<?php
error_reporting(E_ALL & ~E_NOTICE & ~E_WARNING);

if (session_status() === PHP_SESSION_NONE) session_start();

header('Content-Type: application/json');
require_once '../../../database.php';
$db = new Database();

$userId = $_SESSION['user_id'] ?? null;
if (!$userId) {
    http_response_code(401);
    echo json_encode(['error'=>'Not logged in']);
    exit;
}

$action = $_GET['action'] ?? '';

switch($action) {

    case 'load':
        // Get user_details
        $details = $db->get('user_details', "user_id=eq.$userId");
        
        // Get main user info (name, email) from users table
        $user = $db->get('users', "id=eq.$userId");
        $user = $user[0] ?? [];
    
        // Merge name and email into details
        $detailsRow = $details[0] ?? [];
        $detailsRow['name'] = $user['name'] ?? '';
        $detailsRow['email'] = $user['email'] ?? '';
    
        // Get skills
        $skills = $db->get('user_skills', "user_id=eq.$userId");
    
        echo json_encode([
            'details' => $detailsRow,
            'skills' => array_map(fn($s) => ['id'=>$s['id'], 'skill'=>$s['skills']], $skills)
        ]);
        break;
    

    case 'save_personal':
        $data = json_decode(file_get_contents('php://input'), true);
        $update = [
            'job_title' => $data['job_title'] ?? null,
            'status' => $data['status'] ?? null
        ];
        $db->put('user_details', $update, "user_id=eq.$userId");
        echo json_encode(['success'=>true]);
        break;

    case 'save_professional':
        $data = json_decode(file_get_contents('php://input'), true);
        
        $updateDetails = [
            'department' => $data['department'] ?? null,
            'phone_number' => $data['phone_number'] ?? null,
            'location' => $data['location'] ?? null,
            'join_date' => $data['join_date'] ?? null
        ];
         $db->put('user_details', $updateDetails, "user_id=eq.$userId");
        
            // Update email in users table
        if (!empty($data['email'])) {
            $db->put('users', ['email' => $data['email']], "id=eq.$userId");
        }
        
        echo json_encode(['success'=>true]);
        break;
        

    case 'add_skill':
        $data = json_decode(file_get_contents('php://input'), true);
        $skill = trim($data['skill'] ?? '');
        if ($skill) {
            $db->post('user_skills', [
                'user_id' => $userId,
                'skills' => $skill   // <-- use the correct column name
            ]);
        }
        echo json_encode(['success'=>true]);
        break;
        

    case 'remove_skill':
        $data = json_decode(file_get_contents('php://input'), true);
        $skillId = $data['id'] ?? null;
        if ($skillId) $db->delete('user_skills', "id=eq.$skillId");
        echo json_encode(['success'=>true]);
        break;
    

    case 'upload_avatar':
        if (!empty($_FILES['avatar']['tmp_name'])) {
            $uploadDir = __DIR__ . '/../../uploads/';
                
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }
        
         $tmp = $_FILES['avatar']['tmp_name'];
        $ext = pathinfo($_FILES['avatar']['name'], PATHINFO_EXTENSION);
        $filename = "avatar_$userId.$ext";
        $destination = $uploadDir . $filename;
        
        if (move_uploaded_file($tmp, $destination)) {
                $avatarWebPath = "uploads/$filename";
                $db->put('user_details', ['profile_pic' => $avatarWebPath], "user_id=eq.$userId");
                echo json_encode(['success'=>true, 'avatar'=>$avatarWebPath]);
            } else {
                echo json_encode(['error'=>'Failed to move uploaded file']);
            }
            } else {
                echo json_encode(['error'=>'No file uploaded']);
            }
            break;
        

    default:
        echo json_encode(['error'=>'Invalid action']);
}
