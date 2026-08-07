import { useState } from "react";
import Sidebar from "../components/Sidebar";

function Dashboard({ user }) {

  console.log("Dashboard loaded");

  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [page, setPage] = useState("home");

  return (
    <div className="dashboard">

      <Sidebar 
        setSelectedPolicy={setSelectedPolicy}
        setPage={setPage}
      />

      <div className="content">

        {page === "questionnaire" ? (
          <>
            <h1>Questionnaire</h1>
          </>
        ) : selectedPolicy ? (
          <>
            <h1>{selectedPolicy}</h1>

            <button
              className="questionnaire-button"
              onClick={() => setPage("questionnaire")}
            >
              Questionnaire
            </button>
          </>
        ) : (
          <>
            <h1>Welcome {user}</h1>
            <p>Select a policy from the sidebar.</p>
          </>
        )}

      </div>

    </div>
  );
}

export default Dashboard;