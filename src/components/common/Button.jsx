import "./Button.css";

export default function Button({ children, variant = "primary", type = "button", onClick, disabled, fullWidth }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`btn btn--${variant} ${fullWidth ? "btn--full" : ""}`}
    >
      {children}
    </button>
  );
}
