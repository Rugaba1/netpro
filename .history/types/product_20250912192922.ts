import {  product } from "@/lib/generated/prisma";
import { PackageWithType } from "./package";
import { product_type } from "@/lib/generated/prisma";

export interface  ProductWithPackage extends  product {
    package: PackageWithType | null
    type: product_type
}

