<?php
class Database {
    protected $baseUrl;
    protected $apiKey;

    public function __construct() {
        $this->baseUrl = "https://edzqjailcajqxwxjxidg.supabase.co";
        $this->apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkenFqYWlsY2FqcXh3eGp4aWRnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTA1MTY1NCwiZXhwIjoyMDc2NjI3NjU0fQ.aDN283rTFJQV5_WWTV4-bJ_pnaLVm4Iu1TCnSoaJnfQ";

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
        return $this->request("PATCH", $endpoint, $data); // PATCH is safer than PUT for partial updates
    }
    
    public function delete($table, $query) {
        $endpoint = $table . '?' . $query;
        return $this->request("DELETE", $endpoint);
    }
    
}
?>
