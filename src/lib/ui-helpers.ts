export function getDisplayName(input: {
  fullName?: string | null;
  email?: string | null;
}) {
  if (input.fullName && input.fullName.trim().length > 0) {
    return input.fullName;
  }

  if (input.email) {
    return input.email.split("@")[0];
  }

  return "Traveler";
}

export function formatDateRange(
  startDate?: string | null,
  endDate?: string | null
) {
  if (!startDate && !endDate) return "No date selected";
  if (startDate && !endDate) return `${startDate} — End date`;
  if (!startDate && endDate) return `Start date — ${endDate}`;
  return `${startDate} — ${endDate}`;
}

export function getMoodClass(mood?: string | null) {
  switch (mood) {
    case "Adventurous":
      return "bg-orange-100 text-orange-700";
    case "Peaceful":
      return "bg-sky-100 text-sky-700";
    case "Unforgettable":
      return "bg-purple-100 text-purple-700";
    case "Vibrant":
      return "bg-emerald-100 text-emerald-700";
    case "Romantic":
      return "bg-pink-100 text-pink-700";
    case "Relaxing":
      return "bg-green-100 text-green-700";
    case "Nature":
      return "bg-lime-100 text-lime-700";
    case "Food":
      return "bg-yellow-100 text-yellow-700";
    default:
      return "bg-sage/40 text-foreground";
  }
}

export function getPinColor(mood?: string | null) {
  switch (mood) {
    case "Adventurous":
      return "bg-orange-400";
    case "Peaceful":
      return "bg-sky-400";
    case "Unforgettable":
      return "bg-purple-400";
    case "Vibrant":
      return "bg-emerald-400";
    case "Romantic":
      return "bg-pink-400";
    case "Relaxing":
      return "bg-green-400";
    case "Nature":
      return "bg-lime-400";
    case "Food":
      return "bg-yellow-400";
    default:
      return "bg-sunset";
  }
}