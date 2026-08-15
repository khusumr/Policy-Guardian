import SealBadge from "./SealBadge";

// Shows what % of assigned employees have signed this role's policy.
// The colors here are drawn from the theme (purple ring), and at 100%
// the ring hands off to the same seal badge used throughout the app,
// rather than inventing a second "done" indicator.
function SignaturesPieChart({ signed, total }) {
  const percent = total === 0 ? 0 : Math.round((signed / total) * 100);
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const dashoffset = circumference * (1 - percent / 100);
  const isComplete = total > 0 && percent === 100;
  const color = isComplete ? "#4f8a63" : percent >= 50 ? "#7a2e9e" : "#b8792f";

  return (
    <div className="signatures-chart">
      <div className="signatures-chart-ring">
        <svg width="140" height="140" viewBox="0 0 140 140">
          <circle cx="70" cy="70" r={radius} fill="none" stroke="#e3d7f2" strokeWidth="14" />
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="14"
            strokeDasharray={circumference}
            strokeDashoffset={dashoffset}
            strokeLinecap="round"
            transform="rotate(-90 70 70)"
          />
          <text
            x="70"
            y="66"
            textAnchor="middle"
            fontSize="26"
            fontWeight="600"
            fontFamily="IBM Plex Mono, monospace"
            fill="#221130"
          >
            {percent}%
          </text>
          <text x="70" y="86" textAnchor="middle" fontSize="10" letterSpacing="1.5" fill="#6d5f82">
            SIGNED
          </text>
        </svg>
        {isComplete && (
          <span className="signatures-chart-seal">
            <SealBadge size="sm" />
          </span>
        )}
      </div>
      <p className="signatures-caption">
        {total === 0
          ? "Not sent yet"
          : `${signed} of ${total} ${total === 1 ? "person has" : "people have"} signed`}
      </p>
    </div>
  );
}

export default SignaturesPieChart;
