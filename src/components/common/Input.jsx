import "./Input.css";

export default function Input({ label, type = "text", value, onChange, name, placeholder, error, required }) {
  return (
    <div className="field">
      {label && <label className="field__label" htmlFor={name}>{label}</label>}
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className={`field__input ${error ? "field__input--error" : ""}`}
      />
      {error && <span className="field__error">{error}</span>}
    </div>
  );
}
