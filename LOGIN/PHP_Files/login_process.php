<?php
session_start();
require_once "../PHP_Files/login.php";
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = $_POST['email'] ?? '';
    $password = $_POST['password'] ?? '';

    if (empty($email) || empty($password)) {
        echo json_encode(["success" => false, "message" => "Email and password are required"]);
        exit;
    }

    $user = new User();
    $result = $user->login($email, $password);

    if ($result['success']) {
        $_SESSION['user_id'] = $result['user_id'];
        $_SESSION['email'] = $email;
        $_SESSION['role'] = strtolower($result['role'] ?? '');

        switch ($_SESSION['role']) {
            case 'project_manager':
                $result['redirect'] = '../../project-manager/pm-dashboard.html';
                break;
            case 'employee':
                $result['redirect'] = '/reso-management-system/employee/employee-dashboard.html';
                break;
            case 'hr_admin':
                $result['redirect'] = '/reso-management-system/hr/hr-dashboard.html';
                break;
            default:
                $result['redirect'] = '../HTML_Files/default_dashboard.html';
        }
    }

    echo json_encode($result);
    exit;
}

?>
