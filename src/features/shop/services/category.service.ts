import { type ApiCategory } from "../types/shop.types";
import { getData } from "./shop.service";

export function fetchCategories(): Promise<ApiCategory[]> {
  return getData<ApiCategory[]>("/api/v1/shop/categories");
}
