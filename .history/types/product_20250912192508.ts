import {  product } from "@/lib/generated/prisma";
import { PackageWithType } from "./package";
 

export interface  ProductWithPackage extends  product {
    package: PackageWithType | null
}

