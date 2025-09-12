<?php
class Cashpower {
    private $conn;
    private $table_name = "cashpower_transactions";

    public $id;
    public $transaction_id;
    public $customer_name;
    public $customer_phone;
    public $meter_number;
    public $amount;
    public $units;
    public $token;
    public $commission;
    public $commission_rate;
    public $status;
    public $payment_method;
    public $processed_by;
    public $notes;
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

    function getTotalCommission() {
        $query = "SELECT SUM(commission) as total FROM " . $this->table_name . " WHERE status = 'completed'";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row['total'];
    }

    function getTotalSales() {
        $query = "SELECT SUM(amount) as total FROM " . $this->table_name . " WHERE status = 'completed'";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row['total'];
    }

    function create() {
        $query = "INSERT INTO " . $this->table_name . " 
                  SET transaction_id=:transaction_id, customer_name=:customer_name, 
                      customer_phone=:customer_phone, meter_number=:meter_number, 
                      amount=:amount, units=:units, token=:token, commission=:commission, 
                      commission_rate=:commission_rate, payment_method=:payment_method, 
                      processed_by=:processed_by";

        $stmt = $this->conn->prepare($query);

        $this->transaction_id = htmlspecialchars(strip_tags($this->transaction_id));
        $this->customer_name = htmlspecialchars(strip_tags($this->customer_name));
        $this->customer_phone = htmlspecialchars(strip_tags($this->customer_phone));
        $this->meter_number = htmlspecialchars(strip_tags($this->meter_number));
        $this->amount = htmlspecialchars(strip_tags($this->amount));
        $this->units = htmlspecialchars(strip_tags($this->units));
        $this->token = htmlspecialchars(strip_tags($this->token));
        $this->commission = htmlspecialchars(strip_tags($this->commission));
        $this->commission_rate = htmlspecialchars(strip_tags($this->commission_rate));
        $this->payment_method = htmlspecialchars(strip_tags($this->payment_method));
        $this->processed_by = htmlspecialchars(strip_tags($this->processed_by));

        $stmt->bindParam(":transaction_id", $this->transaction_id);
        $stmt->bindParam(":customer_name", $this->customer_name);
        $stmt->bindParam(":customer_phone", $this->customer_phone);
        $stmt->bindParam(":meter_number", $this->meter_number);
        $stmt->bindParam(":amount", $this->amount);
        $stmt->bindParam(":units", $this->units);
        $stmt->bindParam(":token", $this->token);
        $stmt->bindParam(":commission", $this->commission);
        $stmt->bindParam(":commission_rate", $this->commission_rate);
        $stmt->bindParam(":payment_method", $this->payment_method);
        $stmt->bindParam(":processed_by", $this->processed_by);

        if ($stmt->execute()) {
            return true;
        }
        return false;
    }
}
?>
