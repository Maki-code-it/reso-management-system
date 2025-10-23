<?php
require_once "../../database.php";

class User extends Database {
    public function login($email, $password) {
        $result = $this->get("users", "email=eq." . urlencode($email));
    
        if (empty($result)) {
            return ["success" => false, "message" => "Email not found."];
        }
    
        $user = $result[0];
        $hashedPassword = trim($user['password']);
    
        if (password_verify($password, $hashedPassword)) {
            if (session_status() === PHP_SESSION_NONE) session_start();
        
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['user_name'] = $user['name'];
            $_SESSION['user_role'] = $user['role'];
        
            return [
                "success" => true,
                "message" => "Login successful!",
                "role" => $user['role'],
                "user_id" => $user['id']  // <--- add this
            ];
        }
         else {
            return ["success" => false, "message" => "Incorrect password."];
        }
    }

     // Create a 6-digit reset code and save to DB
     public function createResetCode($email) {
        $result = $this->get("users", "email=eq." . urlencode($email));
        if (empty($result)) return ["success" => false, "message" => "User not found"];

        $code = random_int(100000, 999999); // 6-digit code
        $expiry = date('Y-m-d H:i:s', strtotime('+10 minutes'));

        $this->request("PATCH", "users?email=eq." . urlencode($email), [
            "reset_code" => $code,
            "code_expiry" => $expiry
        ]);

        return ["success" => true, "code" => $code];
    }

    // Verify reset code
    public function verifyResetCode($email, $code) {
        $result = $this->get("users", "email=eq." . urlencode($email));
        if (empty($result)) return ["success" => false, "message" => "User not found"];

        $user = $result[0];
        $currentTime = date('Y-m-d H:i:s');

        if ($user['reset_code'] == $code && $user['code_expiry'] > $currentTime) {
            return ["success" => true, "message" => "Code verified"];
        } else {
            return ["success" => false, "message" => "Invalid or expired code"];
        }
    }

    // Reset password using verified code
    public function resetPasswordWithCode($email, $code, $newPassword) {
        $verify = $this->verifyResetCode($email, $code);
        if (!$verify['success']) return $verify;

        $hashed = password_hash($newPassword, PASSWORD_BCRYPT);

        $this->request("PATCH", "users?email=eq." . urlencode($email), [
            "password" => $hashed,
            "reset_code" => null,
            "code_expiry" => null
        ]);

        return ["success" => true, "message" => "Password updated successfully"];
    }
    
    
    
}



?>
