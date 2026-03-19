export default function AuthForm({ title, buttonText, fields, onSubmit }) {
  const handleSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    onSubmit(Object.fromEntries(formData.entries()), event.currentTarget);
  };

  return (
    <section className="card auth-card">
      <div className="section-head">
        <div>
          <p className="section-kicker">{title}</p>
          <h2>{title}</h2>
        </div>
      </div>
      <form className="auth-form" onSubmit={handleSubmit}>
        {fields.map((field) => (
          <label key={field.name}>
            {field.label}
            <input
              type={field.type}
              name={field.name}
              placeholder={field.placeholder}
              required
              minLength={field.minLength}
            />
          </label>
        ))}
        <button type="submit" className="primary-button">{buttonText}</button>
      </form>
    </section>
  );
}
