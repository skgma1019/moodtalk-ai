export default function AuthForm({ title, buttonText, fields, helperText, footer, onSubmit }) {
  const handleSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    onSubmit(Object.fromEntries(formData.entries()), event.currentTarget);
  };

  return (
    <section className="card auth-card">
      <div className="section-head">
        <div>
          <p className="section-kicker">Auth</p>
          <h2>{title}</h2>
          {helperText ? <p className="helper-text">{helperText}</p> : null}
        </div>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        {fields.map((field) => (
          <label key={field.name}>
            <span>{field.label}</span>
            <input
              type={field.type}
              name={field.name}
              placeholder={field.placeholder}
              required
              minLength={field.minLength}
            />
          </label>
        ))}

        <button type="submit" className="primary-button">
          {buttonText}
        </button>
        {footer}
      </form>
    </section>
  );
}
