<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

include_once '../config/database.php';
include_once '../objects/stock.php';

$database = new Database();
$db = $database->getConnection();
$stock = new Stock($db);

$stmt = $stock->read();
$num = $stmt->rowCount();

if ($num > 0) {
    $stock_arr = array();
    $stock_arr["records"] = array();

    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        extract($row);
        $stock_item = array(
            "id" => $id,
            "product_name" => $product_name,
            "category" => $category,
            "quantity" => $quantity,
            "min_quantity" => $min_quantity,
            "unit_price" => $unit_price,
            "total_value" => $total_value,
            "supplier" => $supplier,
            "location" => $location,
            "last_updated" => $last_updated,
            "status" => $quantity <= $min_quantity ? "Low Stock" : "In Stock"
        );
        array_push($stock_arr["records"], $stock_item);
    }

    http_response_code(200);
    echo json_encode($stock_arr);
} else {
    http_response_code(404);
    echo json_encode(array("message" => "No stock items found."));
}
?>
