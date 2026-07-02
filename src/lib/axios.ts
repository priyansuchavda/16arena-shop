import axios from "axios";

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_SHOP_API_BASE ?? "http://192.168.29.71:5006",
  headers: {
    "Content-Type": "application/json",
  },
});
