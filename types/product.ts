import {  product } from "@/lib/generated/prisma";
import { PackageWithType } from "./package";
import { product_type } from "@/lib/generated/prisma";

export interface  ProductWithPackage extends  product {
    Renamedpackage: PackageWithType | null
    product_type: product_type
}

