import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Star rating input.
 *
 * The API accepts an integer 1-5, so the value is always a whole number. The
 * fieldset/legend pairing plus the radio inputs mean it is keyboard- and
 * screen-reader-operable, which a row of buttons would not be.
 */
export function RatingInput({
  value,
  onChange,
  disabled = false,
  name = "rating",
}: {
  value: number;
  onChange: (rating: number) => void;
  disabled?: boolean;
  name?: string;
}) {
  return (
    <fieldset className="space-y-1.5" disabled={disabled}>
      <legend className="text-sm font-medium text-slate-700">Rating</legend>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <label key={star} className="cursor-pointer p-0.5">
            <input
              type="radio"
              name={name}
              value={star}
              checked={value === star}
              onChange={() => onChange(star)}
              className="sr-only"
            />
            <Star
              className={cn(
                "size-7 transition-colors",
                star <= value
                  ? "fill-amber-400 text-amber-400"
                  : "text-slate-300 hover:text-amber-300",
              )}
              aria-hidden
            />
            <span className="sr-only">{star} star{star === 1 ? "" : "s"}</span>
          </label>
        ))}
        {value > 0 && (
          <span className="ml-2 text-sm font-medium text-slate-600">{value} / 5</span>
        )}
      </div>
    </fieldset>
  );
}

/** Read-only star display, for showing a stored rating on a booking. */
export function RatingDisplay({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            "size-4",
            star <= Math.round(rating)
              ? "fill-amber-400 text-amber-400"
              : "text-slate-300",
          )}
          aria-hidden
        />
      ))}
    </span>
  );
}