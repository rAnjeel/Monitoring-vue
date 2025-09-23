// utils/dateFormatter.js
import dayjs from "dayjs";

/**
 * Formate une date avec Day.js
 * @param {string|Date} date - La date à formater
 * @param {string} format - Le format souhaité (ex: "DD/MM/YYYY HH:mm")
 * @returns {string} Date formatée
 */
export function formatDate(date, format = "DD/MM/YYYY") {
  if (!date) return "";
  return dayjs(date).format(format);
}
