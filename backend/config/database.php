<?php
/**
 * Database Configuration for NETPRO Management System
 * 
 * This file contains the database connection settings and helper functions
 * for connecting to the MySQL database.
 */

class Database {
    // Database credentials
    private $host = "localhost";
    private $db_name = "netpro_management";
    private $username = "root";
    private $password = "";
    private $charset = "utf8mb4";
    
    public $conn;
    
    /**
     * Get database connection
     * 
     * @return PDO|null Database connection object or null on failure
     */
    public function getConnection() {
        $this->conn = null;
        
        try {
            $dsn = "mysql:host=" . $this->host . ";dbname=" . $this->db_name . ";charset=" . $this->charset;
            
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"
            ];
            
            $this->conn = new PDO($dsn, $this->username, $this->password, $options);
            
        } catch(PDOException $exception) {
            error_log("Connection error: " . $exception->getMessage());
            return null;
        }
        
        return $this->conn;
    }
    
    /**
     * Test database connection
     * 
     * @return bool True if connection successful, false otherwise
     */
    public function testConnection() {
        $connection = $this->getConnection();
        return $connection !== null;
    }
    
    /**
     * Get database configuration for external use
     * 
     * @return array Database configuration array
     */
    public function getConfig() {
        return [
            'host' => $this->host,
            'database' => $this->db_name,
            'username' => $this->username,
            'charset' => $this->charset
        ];
    }
    
    /**
     * Execute a query and return results
     * 
     * @param string $query SQL query to execute
     * @param array $params Parameters for prepared statement
     * @return array|false Query results or false on failure
     */
    public function query($query, $params = []) {
        try {
            $connection = $this->getConnection();
            if (!$connection) {
                return false;
            }
            
            $stmt = $connection->prepare($query);
            $stmt->execute($params);
            
            return $stmt->fetchAll();
            
        } catch(PDOException $exception) {
            error_log("Query error: " . $exception->getMessage());
            return false;
        }
    }
    
    /**
     * Execute an insert/update/delete query
     * 
     * @param string $query SQL query to execute
     * @param array $params Parameters for prepared statement
     * @return bool|int True/affected rows on success, false on failure
     */
    public function execute($query, $params = []) {
        try {
            $connection = $this->getConnection();
            if (!$connection) {
                return false;
            }
            
            $stmt = $connection->prepare($query);
            $result = $stmt->execute($params);
            
            return $result ? $stmt->rowCount() : false;
            
        } catch(PDOException $exception) {
            error_log("Execute error: " . $exception->getMessage());
            return false;
        }
    }
    
    /**
     * Get the last inserted ID
     * 
     * @return string|false Last insert ID or false on failure
     */
    public function lastInsertId() {
        try {
            $connection = $this->getConnection();
            if (!$connection) {
                return false;
            }
            
            return $connection->lastInsertId();
            
        } catch(PDOException $exception) {
            error_log("Last insert ID error: " . $exception->getMessage());
            return false;
        }
    }
}

/**
 * Global database instance
 */
$database = new Database();

/**
 * Helper function to get database connection
 * 
 * @return PDO|null Database connection
 */
function getDbConnection() {
    global $database;
    return $database->getConnection();
}

/**
 * Helper function to execute queries
 * 
 * @param string $query SQL query
 * @param array $params Query parameters
 * @return array|false Query results
 */
function dbQuery($query, $params = []) {
    global $database;
    return $database->query($query, $params);
}

/**
 * Helper function to execute non-select queries
 * 
 * @param string $query SQL query
 * @param array $params Query parameters
 * @return bool|int Execution result
 */
function dbExecute($query, $params = []) {
    global $database;
    return $database->execute($query, $params);
}

// Set error reporting for development
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Set timezone
date_default_timezone_set('Africa/Kigali');

// CORS headers for API access
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Set content type for API responses
header("Content-Type: application/json; charset=UTF-8");
?>
