export const truncateAddress = (address?: string, maxLength: number = 20): string => {
  if (!address) return "-"; // handle empty or undefined
  return address.length > maxLength ? address.slice(0, maxLength) + "..." : address;
};