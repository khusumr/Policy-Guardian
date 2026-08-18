// A radio input styled as a selectable card — role pickers, typeface
// pickers, anywhere the mockups show a bordered card with a dot + label.
function RadioCard({
  name,
  value,
  checked,
  onChange,
  title,
  description,
  wip,
  className = "",
}) {
  const classes = [
    "radio-card",
    checked ? "radio-card-selected" : "",
    wip ? "radio-card-wip" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <label className={classes}>
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
      />
      <span className="dot" style={{ marginTop: 3 }} />
      <span>
        <span className="radio-card-title">{title}</span>
        {description && <span className="radio-card-desc">{description}</span>}
      </span>
    </label>
  );
}

export default RadioCard;
