-- Insert sample data for stock items
INSERT INTO stock_items (item_name, item_type, quantity, unit_price, supplier, purchase_date, status) VALUES
('Router TP-Link AC1200', 'Hardware', 15, 25000, 'Tech Imports Ltd', '2025-06-01', 'in_stock'),
('4G LTE Modem', 'Hardware', 8, 35000, 'Network Solutions', '2025-06-05', 'in_stock'),
('Cat6 Ethernet Cable (100m)', 'Cable', 5, 18000, 'Cable Masters', '2025-06-10', 'in_stock'),
('Wireless Access Point', 'Hardware', 3, 45000, 'Tech Imports Ltd', '2025-06-15', 'low_stock'),
('Network Switch 8-Port', 'Hardware', 0, 30000, 'Network Solutions', '2025-06-20', 'out_of_stock'),
('Fiber Optic Cable (500m)', 'Cable', 2, 120000, 'Fiber Connect Ltd', '2025-06-25', 'low_stock'),
('RJ45 Connectors (Pack of 100)', 'Accessories', 12, 5000, 'Cable Masters', '2025-07-01', 'in_stock'),
('Crimping Tool', 'Tool', 5, 8000, 'Tech Tools Ltd', '2025-07-05', 'in_stock'),
('Network Tester', 'Tool', 2, 15000, 'Tech Tools Ltd', '2025-07-10', 'low_stock'),
('Outdoor Antenna 4G/LTE', 'Hardware', 6, 28000, 'Antenna Specialists', '2025-07-15', 'in_stock');

-- Insert sample data for cashpower transactions
INSERT INTO cashpower_transactions (transaction_id, customer_name, meter_number, amount, token, commission, transaction_date, status) VALUES
('CP-20250701-001', 'John Doe', '12345678901', 5000, '1234-5678-9012-3456-7890', 250, '2025-07-01', 'completed'),
('CP-20250702-002', 'Jane Smith', '23456789012', 10000, '2345-6789-0123-4567-8901', 500, '2025-07-02', 'completed'),
('CP-20250703-003', 'Robert Johnson', '34567890123', 15000, '3456-7890-1234-5678-9012', 750, '2025-07-03', 'completed'),
('CP-20250704-004', 'Mary Williams', '45678901234', 20000, '4567-8901-2345-6789-0123', 1000, '2025-07-04', 'completed'),
('CP-20250705-005', 'David Brown', '56789012345', 5000, '5678-9012-3456-7890-1234', 250, '2025-07-05', 'completed'),
('CP-20250706-006', 'Sarah Miller', '67890123456', 10000, '6789-0123-4567-8901-2345', 500, '2025-07-06', 'completed'),
('CP-20250707-007', 'Michael Davis', '78901234567', 15000, '7890-1234-5678-9012-3456', 750, '2025-07-07', 'completed'),
('CP-20250708-008', 'Jennifer Garcia', '89012345678', 20000, '8901-2345-6789-0123-4567', 1000, '2025-07-08', 'completed'),
('CP-20250709-009', 'James Rodriguez', '90123456789', 5000, '9012-3456-7890-1234-5678', 250, '2025-07-09', 'pending'),
('CP-20250710-010', 'Patricia Martinez', '01234567890', 10000, NULL, 0, '2025-07-10', 'failed');
