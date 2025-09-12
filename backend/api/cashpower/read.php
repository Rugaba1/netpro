<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

include_once '../config/database.php';
include_once '../objects/cashpower.php';

$database = new Database();
$db = $database->getConnection();
$cashpower = new Cashpower($db);

$stmt = $cashpower->read();
$num = $stmt->rowCount();

if ($num > 0) {
    $cashpower_arr = array();
    $cashpower_arr["records"] = array();

    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        extract($row);
        $cashpower_item = array(
            "id" => $id,
            "transaction_id" => $transaction_id,
            "customer_name" => $customer_name,
            "customer_phone" => $customer_phone,
            "meter_number" => $meter_number,
            "amount" => $amount,
            "units" => $units,
            "token" => $token,
            "commission" => $commission,
            "commission_rate" => $commission_rate,
            "status" => $status,
            "payment_method" => $payment_method,
            "created_at" => $created_at
        );
        array_push($cashpower_arr["records"], $cashpower_item);
    }

    http_response_code(200);
    echo json_encode($cashpower_arr);
} else {
    http_response_code(404);
    echo json_encode(array("message" => "No cashpower transactions found."));
}
?>
