import { useState } from "react";
import Sidebar from "../components/Sidebar";
import PolicyEditor from "./PolicyEditor";
import Questionnaire from "./Questionnaire";
import { getPolicies } from "../data/store";

function HRDashboard({ user }) {
  const [policies, setPolicies] = useState(getPolicies());
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [page, setPage] = useState("home"); // "home" | "questionnaire" | "editor"

  function refreshPolicies() {
    setPolicies(getPolicies());
  }

  function handleSelectPolicy(policy) {
    setSelectedPolicy(policy);
    setPage("editor");
  }

  function handleNewPolicy() {
    setSelectedPolicy(null);
    setPage("questionnaire");
  }

  function handlePolicyCreated(policy) {
    refreshPolicies();
    setSelectedPolicy(policy);
    setPage("editor");
  }

  function handlePolicyUpdated(policy) {
    refreshPolicies();
    setSelectedPolicy(policy);
  }

  return (
    <div className="dashboard">
      <Sidebar
        policies={policies}
        onSelectPolicy={handleSelectPolicy}
        onNewPolicy={handleNewPolicy}
      />

      <div className="content">
        {page === "questionnaire" ? (
          <Questionnaire onPolicyCreated={handlePolicyCreated} />
        ) : page === "editor" && selectedPolicy ? (
          <PolicyEditor policy={selectedPolicy} onUpdated={handlePolicyUpdated} />
        ) : (
          <>
            <h1>Welcome {user}</h1>
            <p>Select a policy from the sidebar, or create a new one.</p>
          </>
        )}
      </div>
    </div>
  );
}

export default HRDashboard;
