<?php
class Stock {
    private $conn;
    private $table_name = "stock";

    public $id;
    public $product_id;
    public $product_name;
    public $category;
    public $quantity;
    public $min_quantity;
    public $unit_price;
    public $total_value;
    public $supplier;
    public $location;
    public $last_updated;

    public function __construct($db) {
        $this->conn = $db;
    }

    function read() {
        $query = "SELECT * FROM " . $this->table_name . " ORDER BY last_updated DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    function getLowStock() {
        $query = "SELECT * FROM " . $this->table_name . " WHERE quantity <= min_quantity ORDER BY quantity ASC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    function getTotalValue() {
        $query = "SELECT SUM(total_value) as total FROM " . $this->table_name;
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row['total'];
    }

    function create() {
        $query = "INSERT INTO " . $this->table_name . " 
                  SET product_name=:product_name, category=:category, quantity=:quantity, 
                      min_quantity=:min_quantity, unit_price=:unit_price, supplier=:supplier, 
                      location=:location";

        $stmt = $this->conn->prepare($query);

        $this->product_name = htmlspecialchars(strip_tags($this->product_name));
        $this->category = htmlspecialchars(strip_tags($this->category));
        $this->quantity = htmlspecialchars(strip_tags($this->quantity));
        $this->min_quantity = htmlspecialchars(strip_tags($this->min_quantity));
        $this->unit_price = htmlspecialchars(strip_tags($this->unit_price));
        $this->supplier = htmlspecialchars(strip_tags($this->supplier));
        $this->location = htmlspecialchars(strip_tags($this->location));

        $stmt->bindParam(":product_name", $this->product_name);
        $stmt->bindParam(":category", $this->category);
        $stmt->bindParam(":quantity", $this->quantity);
        $stmt->bindParam(":min_quantity", $this->min_quantity);
        $stmt->bindParam(":unit_price", $this->unit_price);
        $stmt->bindParam(":supplier", $this->supplier);
        $stmt->bindParam(":location", $this->location);

        if ($stmt->execute()) {
            return true;
        }
        return false;
    }
}
?>
