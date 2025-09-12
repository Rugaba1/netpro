<?php
// Required headers
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// Include database and user object files
include_once '../../config/database.php';
include_once '../../objects/user.php';

// Instantiate database and user object
$database = new Database();
$db = $database->getConnection();

// Initialize user object
$user = new User($db);

// Query users
$stmt = $user->read();
$num = $stmt->rowCount();

// Check if more than 0 record found
if($num > 0) {
    // Users array
    $users_arr = array();
    $users_arr["records"] = array();

    // Retrieve table contents
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        extract($row);

        $user_item = array(
            "id" => $id,
            "username" => $username,
            "email" => $email,
            "firstName" => $first_name,
            "lastName" => $last_name,
            "role" => $role,
            "status" => $is_active ? "active" : "inactive",
            "permissions" => json_decode($permissions, true)
        );

        array_push($users_arr["records"], $user_item);
    }

    // Set response code - 200 OK
    http_response_code(200);

    // Show users data in JSON format
    echo json_encode($users_arr);
} else {
    // Set response code - 404 Not found
    http_response_code(404);

    // Tell the user no users found
    echo json_encode(array("message" => "No users found."));
}
?>
