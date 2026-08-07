const policies = [
  "Work From Home",
  "Travel",
  "Internship",
  "Security",
  "Leave Policy",
  "Code of Conduct"
];

function Sidebar({ setSelectedPolicy, setPage }) {

  function openPolicy(policy) {
    console.log("clicked:", policy);

    setSelectedPolicy(policy);
    setPage("policy");
  }
  console.log("Sidebar loaded");
  return (
    <div className="sidebar">

      <h2>Policies</h2>

      {policies.map((policy) => (
        <button
          key={policy}
          className="tab"
          onClick={() => openPolicy(policy)}
        >
          {policy}
        </button>
      ))}

    </div>
  );
}

export default Sidebar;