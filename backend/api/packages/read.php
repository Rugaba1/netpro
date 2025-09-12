<?php
// Required headers
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// Include database and package object files
include_once '../../config/database.php';
include_once '../../objects/package.php';

// Instantiate database and package object
$database = new Database();
$db = $database->getConnection();

// Initialize package object
$package = new Package($db);

// Query packages
$stmt = $package->read();
$num = $stmt->rowCount();

// Check if more than 0 record found
if($num > 0) {
    // Packages array
    $packages_arr = array();

    // Retrieve table contents
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        extract($row);

        $package_item = array(
            "id" => $id,
            "package_type" => $package_type,
            "package_description" => $package_description,
            "created_at" => $created_at,
            "updated_at" => $updated_at
        );

        array_push($packages_arr, $package_item);
    }

    // Set response code - 200 OK
    http_response_code(200);

    // Show packages data in JSON format
    echo json_encode($packages_arr);
} else {
    // Set response code - 404 Not found
    http_response_code(404);

    // Tell the user no packages found
    echo json_encode(array("message" => "No packages found."));
}
?>
