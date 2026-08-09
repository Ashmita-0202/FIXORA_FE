import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import Input from "../components/common/Input";
import Button from "../components/common/Button";
import "./AuthForm.css";

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await signup(form);
      navigate("/");
    } catch {
      setError("Couldn't create your account. Try a different email.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container auth-page">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h1>Create your account</h1>
        <Input label="FirstName" firstname="firstname" value={form.firstname} onChange={handleChange} required />
        <Input label="Email" type="email" name="email" value={form.email} onChange={handleChange} required />

        <Input label="Password" type="password" name="password" value={form.password} onChange={handleChange} required />
        {error && <p className="auth-form__error">{error}</p>}
        <Button type="submit" disabled={submitting} fullWidth>{submitting ? "Creating…" : "Sign up"}</Button>
        <p className="auth-form__switch">Already have an account? <Link to="/login">Log in</Link></p>
      </form>
    </div>
  );
}
