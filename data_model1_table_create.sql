CREATE TABLE public.customer (
    id  NOT NULL,
    name  NOT NULL,
    billing_nqme  NOT NULL,
    tin  NOT NULL,
    phone  NOT NULL,
    service_number  NOT NULL,
    created_at  NOT NULL,
    updated_at  NOT NULL,
    user  NOT NULL
);


CREATE TABLE public.package_type (
    id  NOT NULL,
    name  NOT NULL,
    created_at  NOT NULL,
    updated_at  NOT NULL,
    user  NOT NULL
);


CREATE TABLE public.package (
    id  NOT NULL,
    type  NOT NULL,
    description  NOT NULL,
    created_at  NOT NULL,
    updated_at  NOT NULL,
    user  NOT NULL
);


CREATE TABLE public.product (
    id  NOT NULL,
    package_type  NOT NULL,
    bundle  NOT NULL,
    price  NOT NULL,
    net_price  NOT NULL,
    duration  NOT NULL,
    type  NOT NULL,
    created_at  NOT NULL,
    updated_at  NOT NULL,
    user  NOT NULL
);


CREATE TABLE public.product_type (
    id  NOT NULL,
    name  NOT NULL,
    created_at  NOT NULL,
    updated_at  NOT NULL,
    user  NOT NULL
);


CREATE TABLE public.invoice (
    id  NOT NULL,
    customer  NOT NULL,
    products  NOT NULL,
    amount_paid  NOT NULL,
    amount_to_pay  NOT NULL,
    start_date  NOT NULL,
    end_date  NOT NULL,
    created_at  NOT NULL,
    updated_at  NOT NULL,
    user  NOT NULL
);


CREATE TABLE public.invoice_product (
    id  NOT NULL,
    invoice_id  NOT NULL,
    product_id  NOT NULL,
    qty  NOT NULL,
    created_at  NOT NULL,
    updated_at  NOT NULL,
    user  NOT NULL
);


CREATE TABLE public.proforoma_invoice (
    id  NOT NULL,
    customer  NOT NULL,
    products  NOT NULL,
    start_date  NOT NULL,
    end_date  NOT NULL,
    created_at  NOT NULL,
    updated_at  NOT NULL,
    user  NOT NULL
);


CREATE TABLE public.proforoma_product (
    id  NOT NULL,
    proforoma_id  NOT NULL,
    qty  NOT NULL,
    product_id  NOT NULL,
    price  NOT NULL,
    description  NOT NULL,
    created_at  NOT NULL,
    updated_at  NOT NULL,
    notes  NOT NULL,
    discount  NOT NULL,
    user  NOT NULL
);


CREATE TABLE public.quotation (
    id  NOT NULL,
    products  NOT NULL,
    customer  NOT NULL,
    created_at  NOT NULL,
    updated_at  NOT NULL,
    user  NOT NULL
);


CREATE TABLE public.quotation_product (
    id  NOT NULL,
    quotation_id  NOT NULL,
    product_id  NOT NULL,
    qty  NOT NULL,
    price  NOT NULL,
    discount  NOT NULL,
    created_at  NOT NULL,
    updated_at  NOT NULL,
    notes  NOT NULL,
    user  NOT NULL
);


CREATE TABLE public.stock_item (
    id  NOT NULL,
    name  NOT NULL,
    category  NOT NULL,
    status  NOT NULL,
    price  NOT NULL,
    supplier  NOT NULL,
    min_level  NOT NULL,
    reo_level  NOT NULL,
    created_at  NOT NULL,
    updated_at  NOT NULL,
    user  NOT NULL
);


CREATE TABLE public.stock_items_category (
    id  NOT NULL,
    name  NOT NULL,
    created_at  NOT NULL,
    updated_at  NOT NULL,
    user  NOT NULL
);


CREATE TABLE public.supplier (
    id  NOT NULL,
    name  NOT NULL,
    tin  NOT NULL,
    phone  NOT NULL,
    created_at  NOT NULL,
    updated_at  NOT NULL,
    user  NOT NULL
);


CREATE TABLE public.entity1 (
);


CREATE TABLE public.users (
    id  NOT NULL,
    username  NOT NULL,
    email  NOT NULL,
    password  NOT NULL,
    created_at  NOT NULL,
    updated_at  NOT NULL
);


CREATE TABLE public.user_permissions (
    id  NOT NULL,
    user_id  NOT NULL,
    created_at  NOT NULL,
    update_at  NOT NULL,
    user  NOT NULL
);


CREATE TABLE public.notifications (
    id  NOT NULL,
    content  NOT NULL,
    type  NOT NULL,
    is_read  NOT NULL,
    for  NOT NULL,
    created_at  NOT NULL,
    updated_at  NOT NULL,
    user  NOT NULL
);


CREATE TABLE public.notification_type (
    id  NOT NULL,
    name  NOT NULL,
    created_at  NOT NULL,
    updated_at  NOT NULL,
    user  NOT NULL
);


CREATE TABLE public.user_actions (
    id  NOT NULL,
    user  NOT NULL,
    action  NOT NULL,
    created_at  NOT NULL,
    updated_at  NOT NULL
);

