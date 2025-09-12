<?php
class Customer {
    private $conn;
    private $table_name = "customers";

    public $id;
    public $name;
    public $email;
    public $phone;
    public $address;
    public $city;
    public $country;
    public $customer_type;
    public $tax_id;
    public $credit_limit;
    public $status;
    public $created_at;

    public function __construct($db) {
        $this->conn = $db;
    }

    function read() {
        $query = "SELECT * FROM " . $this->table_name . " ORDER BY created_at DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    function create() {
        $query = "INSERT INTO " . $this->table_name . " 
                  SET name=:name, email=:email, phone=:phone, address=:address, 
                      city=:city, country=:country, customer_type=:customer_type, 
                      tax_id=:tax_id, credit_limit=:credit_limit";

        $stmt = $this->conn->prepare($query);

        $this->name = htmlspecialchars(strip_tags($this->name));
        $this->email = htmlspecialchars(strip_tags($this->email));
        $this->phone = htmlspecialchars(strip_tags($this->phone));
        $this->address = htmlspecialchars(strip_tags($this->address));
        $this->city = htmlspecialchars(strip_tags($this->city));
        $this->country = htmlspecialchars(strip_tags($this->country));
        $this->customer_type = htmlspecialchars(strip_tags($this->customer_type));
        $this->tax_id = htmlspecialchars(strip_tags($this->tax_id));
        $this->credit_limit = htmlspecialchars(strip_tags($this->credit_limit));

        $stmt->bindParam(":name", $this->name);
        $stmt->bindParam(":email", $this->email);
        $stmt->bindParam(":phone", $this->phone);
        $stmt->bindParam(":address", $this->address);
        $stmt->bindParam(":city", $this->city);
        $stmt->bindParam(":country", $this->country);
        $stmt->bindParam(":customer_type", $this->customer_type);
        $stmt->bindParam(":tax_id", $this->tax_id);
        $stmt->bindParam(":credit_limit", $this->credit_limit);

        if ($stmt->execute()) {
            return true;
        }
        return false;
    }
}
?>
