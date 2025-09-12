<?php
class Invoice {
    // Database connection and table name
    private $conn;
    private $table_name = "invoices";

    // Object properties
    public $id;
    public $invoice_number;
    public $customer_id;
    public $billing_name;
    public $product_type;
    public $payment_method;
    public $amount_to_pay;
    public $paid_amount;
    public $remained_amount;
    public $started_date;
    public $expired_date;
    public $status;
    public $created_at;
    public $updated_at;

    // Constructor with $db as database connection
    public function __construct($db) {
        $this->conn = $db;
    }

    // Read all invoices with customer name
    public function read() {
        // Select all query with JOIN to get customer name
        $query = "SELECT
                    i.id, i.invoice_number, i.customer_id, c.customer_name, i.billing_name, 
                    i.product_type, i.payment_method, i.amount_to_pay, i.paid_amount, 
                    i.remained_amount, i.started_date, i.expired_date, i.status, 
                    i.created_at, i.updated_at
                FROM
                    " . $this->table_name . " i
                LEFT JOIN
                    customers c ON i.customer_id = c.id
                ORDER BY
                    i.id DESC";

        // Prepare query statement
        $stmt = $this->conn->prepare($query);

        // Execute query
        $stmt->execute();

        return $stmt;
    }

    // Create invoice
    public function create() {
        // Query to insert record
        $query = "INSERT INTO
                    " . $this->table_name . "
                SET
                    invoice_number=:invoice_number, customer_id=:customer_id, billing_name=:billing_name, 
                    product_type=:product_type, payment_method=:payment_method, amount_to_pay=:amount_to_pay, 
                    paid_amount=:paid_amount, remained_amount=:remained_amount, started_date=:started_date, 
                    expired_date=:expired_date, status=:status";

        // Prepare query
        $stmt = $this->conn->prepare($query);

        // Sanitize
        $this->invoice_number = htmlspecialchars(strip_tags($this->invoice_number));
        $this->customer_id = htmlspecialchars(strip_tags($this->customer_id));
        $this->billing_name = htmlspecialchars(strip_tags($this->billing_name));
        $this->product_type = htmlspecialchars(strip_tags($this->product_type));
        $this->payment_method = htmlspecialchars(strip_tags($this->payment_method));
        $this->amount_to_pay = htmlspecialchars(strip_tags($this->amount_to_pay));
        $this->paid_amount = htmlspecialchars(strip_tags($this->paid_amount));
        $this->remained_amount = htmlspecialchars(strip_tags($this->remained_amount));
        $this->started_date = htmlspecialchars(strip_tags($this->started_date));
        $this->expired_date = htmlspecialchars(strip_tags($this->expired_date));
        $this->status = htmlspecialchars(strip_tags($this->status));

        // Bind values
        $stmt->bindParam(":invoice_number", $this->invoice_number);
        $stmt->bindParam(":customer_id", $this->customer_id);
        $stmt->bindParam(":billing_name", $this->billing_name);
        $stmt->bindParam(":product_type", $this->product_type);
        $stmt->bindParam(":payment_method", $this->payment_method);
        $stmt->bindParam(":amount_to_pay", $this->amount_to_pay);
        $stmt->bindParam(":paid_amount", $this->paid_amount);
        $stmt->bindParam(":remained_amount", $this->remained_amount);
        $stmt->bindParam(":started_date", $this->started_date);
        $stmt->bindParam(":expired_date", $this->expired_date);
        $stmt->bindParam(":status", $this->status);

        // Execute query
        if($stmt->execute()) {
            return true;
        }

        return false;
    }
}
?>
