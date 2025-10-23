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
                $result['redirect'] = '../EMPLOYEE/Employee_Dashboard/HTML_Files/employee_dashboard.html';
                break;
            case 'admin':
                $result['redirect'] = '../ADMIN/Admin_Dashboard/HTML_Files/admin_dashboard.html';
                break;
            default:
                $result['redirect'] = '../HTML_Files/default_dashboard.html';
        }
    }

    echo json_encode($result);
    exit;
}

?>
