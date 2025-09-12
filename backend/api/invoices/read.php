<?php
// Required headers
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// Include database and invoice object files
include_once '../../config/database.php';
include_once '../../objects/invoice.php';

// Instantiate database and invoice object
$database = new Database();
$db = $database->getConnection();

// Initialize invoice object
$invoice = new Invoice($db);

// Query invoices
$stmt = $invoice->read();
$num = $stmt->rowCount();

// Check if more than 0 record found
if($num > 0) {
    // Invoices array
    $invoices_arr = array();

    // Retrieve table contents
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        extract($row);

        $invoice_item = array(
            "id" => $id,
            "invoice_number" => $invoice_number,
            "customer_id" => $customer_id,
            "customer_name" => $customer_name,
            "billing_name" => $billing_name,
            "product_type" => $product_type,
            "payment_method" => $payment_method,
            "amount_to_pay" => $amount_to_pay,
            "paid_amount" => $paid_amount,
            "remained_amount" => $remained_amount,
            "started_date" => $started_date,
            "expired_date" => $expired_date,
            "status" => $status
        );

        array_push($invoices_arr, $invoice_item);
    }

    // Set response code - 200 OK
    http_response_code(200);

    // Show invoices data in JSON format
    echo json_encode($invoices_arr);
} else {
    // Set response code - 404 Not found
    http_response_code(404);

    // Tell the user no invoices found
    echo json_encode(array("message" => "No invoices found."));
}
?>
