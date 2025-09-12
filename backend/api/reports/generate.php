<?php
// Required headers
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Include database and report object files
include_once '../../config/database.php';

// Get database connection
$database = new Database();
$db = $database->getConnection();

// Get posted data
$data = json_decode(file_get_contents("php://input"));

// Make sure data is not empty
if(!empty($data->report_type) && !empty($data->start_date) && !empty($data->end_date)) {
    
    // Sanitize input
    $report_type = htmlspecialchars(strip_tags($data->report_type));
    $start_date = htmlspecialchars(strip_tags($data->start_date));
    $end_date = htmlspecialchars(strip_tags($data->end_date));
    
    // Initialize response array
    $response = array();
    
    try {
        // Based on report type, generate appropriate report
        switch($report_type) {
            case 'sales':
                // Query for sales report
                $query = "SELECT 
                            DATE(i.created_at) as date,
                            COUNT(i.id) as total_invoices,
                            SUM(i.amount_to_pay) as total_amount,
                            SUM(i.paid_amount) as paid_amount,
                            SUM(i.remained_amount) as remained_amount
                          FROM 
                            invoices i
                          WHERE 
                            DATE(i.created_at) BETWEEN :start_date AND :end_date
                          GROUP BY 
                            DATE(i.created_at)
                          ORDER BY 
                            DATE(i.created_at) ASC";
                
                // Prepare statement
                $stmt = $db->prepare($query);
                
                // Bind parameters
                $stmt->bindParam(':start_date', $start_date);
                $stmt->bindParam(':end_date', $end_date);
                
                // Execute query
                $stmt->execute();
                
                // Fetch results
                $sales_data = array();
                while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                    array_push($sales_data, $row);
                }
                
                $response = array(
                    "report_type" => "sales",
                    "start_date" => $start_date,
                    "end_date" => $end_date,
                    "data" => $sales_data
                );
                break;
                
            case 'customers':
                // Query for customer report
                $query = "SELECT 
                            c.customer_name,
                            COUNT(i.id) as total_invoices,
                            SUM(i.amount_to_pay) as total_amount,
                            SUM(i.paid_amount) as paid_amount,
                            SUM(i.remained_amount) as remained_amount
                          FROM 
                            customers c
                          LEFT JOIN 
                            invoices i ON c.id = i.customer_id
                          WHERE 
                            DATE(i.created_at) BETWEEN :start_date AND :end_date
                          GROUP BY 
                            c.id
                          ORDER BY 
                            SUM(i.amount_to_pay) DESC";
                
                // Prepare statement
                $stmt = $db->prepare($query);
                
                // Bind parameters
                $stmt->bindParam(':start_date', $start_date);
                $stmt->bindParam(':end_date', $end_date);
                
                // Execute query
                $stmt->execute();
                
                // Fetch results
                $customer_data = array();
                while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                    array_push($customer_data, $row);
                }
                
                $response = array(
                    "report_type" => "customers",
                    "start_date" => $start_date,
                    "end_date" => $end_date,
                    "data" => $customer_data
                );
                break;
                
            case 'products':
                // Query for product report
                $query = "SELECT 
                            p.product_type,
                            p.bundle,
                            COUNT(ii.id) as total_sold,
                            SUM(ii.total_price) as total_revenue
                          FROM 
                            products p
                          LEFT JOIN 
                            invoice_items ii ON p.id = ii.product_id
                          LEFT JOIN 
                            invoices i ON ii.invoice_id = i.id
                          WHERE 
                            DATE(i.created_at) BETWEEN :start_date AND :end_date
                          GROUP BY 
                            p.id
                          ORDER BY 
                            COUNT(ii.id) DESC";
                
                // Prepare statement
                $stmt = $db->prepare($query);
                
                // Bind parameters
                $stmt->bindParam(':start_date', $start_date);
                $stmt->bindParam(':end_date', $end_date);
                
                // Execute query
                $stmt->execute();
                
                // Fetch results
                $product_data = array();
                while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                    array_push($product_data, $row);
                }
                
                $response = array(
                    "report_type" => "products",
                    "start_date" => $start_date,
                    "end_date" => $end_date,
                    "data" => $product_data
                );
                break;
                
            default:
                // Invalid report type
                http_response_code(400);
                echo json_encode(array("message" => "Invalid report type."));
                return;
        }
        
        // Set response code - 200 OK
        http_response_code(200);
        
        // Return the report data
        echo json_encode($response);
        
    } catch(PDOException $e) {
        // Set response code - 500 Internal Server Error
        http_response_code(500);
        
        // Tell the user
        echo json_encode(array("message" => "Error generating report: " . $e->getMessage()));
    }
    
} else {
    // Set response code - 400 Bad Request
    http_response_code(400);
    
    // Tell the user
    echo json_encode(array("message" => "Unable to generate report. Data is incomplete."));
}
?>
