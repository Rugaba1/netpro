import { Renamedpackage, package_type } from "@/lib/generated/prisma";

export interface PackageWithType extends Renamedpackage {
  package_type: package_type; // relation field included
}
