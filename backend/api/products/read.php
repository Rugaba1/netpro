<?php
// Required headers
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// Include database and product object files
include_once '../../config/database.php';
include_once '../../objects/product.php';

// Instantiate database and product object
$database = new Database();
$db = $database->getConnection();

// Initialize product object
$product = new Product($db);

// Query products
$stmt = $product->read();
$num = $stmt->rowCount();

// Check if more than 0 record found
if($num > 0) {
    // Products array
    $products_arr = array();

    // Retrieve table contents
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        extract($row);

        $product_item = array(
            "id" => $id,
            "package_id" => $package_id,
            "product_type" => $product_type,
            "bundle" => $bundle,
            "wholesales_price" => $wholesales_price,
            "selling_price" => $selling_price,
            "duration" => $duration,
            "status" => $status
        );

        array_push($products_arr, $product_item);
    }

    // Set response code - 200 OK
    http_response_code(200);

    // Show products data in JSON format
    echo json_encode($products_arr);
} else {
    // Set response code - 404 Not found
    http_response_code(404);

    // Tell the user no products found
    echo json_encode(array("message" => "No products found."));
}
?>
