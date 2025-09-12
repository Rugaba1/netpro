<?php
class Package {
    // Database connection and table name
    private $conn;
    private $table_name = "packages";

    // Object properties
    public $id;
    public $package_type;
    public $package_description;
    public $created_at;
    public $updated_at;

    // Constructor with $db as database connection
    public function __construct($db) {
        $this->conn = $db;
    }

    // Read all packages
    public function read() {
        // Select all query
        $query = "SELECT
                    id, package_type, package_description, created_at, updated_at
                FROM
                    " . $this->table_name . "
                ORDER BY
                    id DESC";

        // Prepare query statement
        $stmt = $this->conn->prepare($query);

        // Execute query
        $stmt->execute();

        return $stmt;
    }

    // Create package
    public function create() {
        // Query to insert record
        $query = "INSERT INTO
                    " . $this->table_name . "
                SET
                    package_type=:package_type, package_description=:package_description";

        // Prepare query
        $stmt = $this->conn->prepare($query);

        // Sanitize
        $this->package_type = htmlspecialchars(strip_tags($this->package_type));
        $this->package_description = htmlspecialchars(strip_tags($this->package_description));

        // Bind values
        $stmt->bindParam(":package_type", $this->package_type);
        $stmt->bindParam(":package_description", $this->package_description);

        // Execute query
        if($stmt->execute()) {
            return true;
        }

        return false;
    }
}
?>
