<?php
require_once __DIR__ . '/vendor/autoload.php'; // load Composer packages
use Dotenv\Dotenv;

class Database {
    protected $baseUrl;
    protected $apiKey;

    public function __construct() {
        // Load environment variables from .env file
        $dotenv = Dotenv::createImmutable(__DIR__);
        $dotenv->load();

        // Assign values from the .env file
        $this->baseUrl = $_ENV['SUPABASE_URL'];
        $this->apiKey  = $_ENV['SUPABASE_API_KEY'];

        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
    }

    protected function request($method, $endpoint, $data = null) {
        $url = $this->baseUrl . "/rest/v1/" . $endpoint;

        $headers = [
            "Content-Type: application/json",
            "apikey: {$this->apiKey}",
            "Authorization: Bearer {$this->apiKey}",
            "Prefer: return=representation"
        ];

        $options = [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_HTTPHEADER => $headers
        ];

        if ($data) {
            $options[CURLOPT_POSTFIELDS] = json_encode($data);
        }

        $ch = curl_init();
        curl_setopt_array($ch, $options);
        $response = curl_exec($ch);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            return ["error" => $error];
        }

        return json_decode($response, true);
    }

    public function get($table, $query = '') {
        $endpoint = $table;
        if (!empty($query)) {
            $endpoint .= "?" . $query;
        }
        return $this->request("GET", $endpoint);
    }

    public function post($table, $data) {
        return $this->request("POST", $table, $data);
    }

    public function put($table, $data, $query) {
        $endpoint = $table . '?' . $query;
        return $this->request("PATCH", $endpoint, $data);
    }

    public function delete($table, $query) {
        $endpoint = $table . '?' . $query;
        return $this->request("DELETE", $endpoint);
    }
}
?>
