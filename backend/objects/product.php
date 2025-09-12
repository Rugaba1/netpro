<?php
class Product {
    // Database connection and table name
    private $conn;
    private $table_name = "products";

    // Object properties
    public $id;
    public $package_id;
    public $product_type;
    public $bundle;
    public $wholesales_price;
    public $selling_price;
    public $duration;
    public $status;
    public $created_at;
    public $updated_at;

    // Constructor with $db as database connection
    public function __construct($db) {
        $this->conn = $db;
    }

    // Read all products
    public function read() {
        // Select all query
        $query = "SELECT
                    id, package_id, product_type, bundle, wholesales_price, selling_price, duration, status, created_at, updated_at
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

    // Create product
    public function create() {
        // Query to insert record
        $query = "INSERT INTO
                    " . $this->table_name . "
                SET
                    package_id=:package_id, product_type=:product_type, bundle=:bundle, 
                    wholesales_price=:wholesales_price, selling_price=:selling_price, 
                    duration=:duration, status=:status";

        // Prepare query
        $stmt = $this->conn->prepare($query);

        // Sanitize
        $this->package_id = htmlspecialchars(strip_tags($this->package_id));
        $this->product_type = htmlspecialchars(strip_tags($this->product_type));
        $this->bundle = htmlspecialchars(strip_tags($this->bundle));
        $this->wholesales_price = htmlspecialchars(strip_tags($this->wholesales_price));
        $this->selling_price = htmlspecialchars(strip_tags($this->selling_price));
        $this->duration = htmlspecialchars(strip_tags($this->duration));
        $this->status = htmlspecialchars(strip_tags($this->status));

        // Bind values
        $stmt->bindParam(":package_id", $this->package_id);
        $stmt->bindParam(":product_type", $this->product_type);
        $stmt->bindParam(":bundle", $this->bundle);
        $stmt->bindParam(":wholesales_price", $this->wholesales_price);
        $stmt->bindParam(":selling_price", $this->selling_price);
        $stmt->bindParam(":duration", $this->duration);
        $stmt->bindParam(":status", $this->status);

        // Execute query
        if($stmt->execute()) {
            return true;
        }

        return false;
    }
}
?>
