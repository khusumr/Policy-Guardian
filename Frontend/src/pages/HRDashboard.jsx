import { useState } from "react";
import Sidebar from "../components/Sidebar";
import SectionEditor from "./SectionEditor";
import PolicyOverall from "./PolicyOverall";
import SectionGenerate from "./SectionGenerate";
import CustomSectionForm from "./CustomSectionForm";
import IncidentReport from "./IncidentReport";
import UploadPolicyForm from "./UploadPolicyForm";
import { getSections } from "../data/store";

function HRDashboard({ user }) {
  const [sections, setSections] = useState(getSections());
  const [page, setPage] = useState("home");
  const [selectedSection, setSelectedSection] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [pending, setPending] = useState(null);
  const [customSectionRole, setCustomSectionRole] = useState(null);
  const [uploadRole, setUploadRole] = useState(null);

  function refreshSections() {
    setSections(getSections());
  }

  function handleSelectSection(section) {
    setSelectedSection(section);
    setPage("editor");
  }

  function handleSelectPending(role, sectionType) {
    setPending({ role, sectionType });
    setPage("generate");
  }

  function handleSelectOverall(role) {
    setSelectedRole(role);
    setPage("overall");
  }

  function handleAddCustomSection(role) {
    setCustomSectionRole(role);
    setPage("customQuestionnaire");
  }

  function handleAddUpload(role) {
    setUploadRole(role);
    setPage("upload");
  }

  function handleSectionCreated(section) {
    refreshSections();
    setSelectedSection(section);
    setPage("editor");
  }

  function handleSectionUpdated(section) {
    refreshSections();
    setSelectedSection(section);
  }

  const selectedKey =
    page === "overall" && selectedRole
      ? `overall:${selectedRole}`
      : page === "editor" && selectedSection
      ? selectedSection.id
      : page === "generate" && pending
      ? `pending:${pending.role}:${pending.sectionType}`
      : null;

  return (
    <div className="dashboard">
      <Sidebar
        sections={sections}
        selectedKey={selectedKey}
        onSelectSection={handleSelectSection}
        onSelectPending={handleSelectPending}
        onSelectOverall={handleSelectOverall}
        onAddCustomSection={handleAddCustomSection}
        onAddUpload={handleAddUpload}
        onOpenIncidentReport={() => setPage("incident")}
      />

      <div className="content">
        {page === "editor" && selectedSection ? (
          <SectionEditor
            section={selectedSection}
            onUpdated={handleSectionUpdated}
          />
        ) : page === "overall" && selectedRole ? (
          <PolicyOverall
            role={selectedRole}
            sections={sections}
          />
        ) : page === "generate" && pending ? (
          <SectionGenerate
            role={pending.role}
            sectionType={pending.sectionType}
            onSectionCreated={handleSectionCreated}
          />
        ) : page === "customQuestionnaire" && customSectionRole ? (
          <CustomSectionForm
            role={customSectionRole}
            onSectionCreated={handleSectionCreated}
          />
        ) : page === "upload" && uploadRole ? (
          <UploadPolicyForm
            role={uploadRole}
            onSectionCreated={handleSectionCreated}
          />
        ) : page === "incident" ? (
          <IncidentReport />
        ) : (
          <>
            <h1>Welcome {user}</h1>
            <p>
              Pick a role in the sidebar, then a section within it,
              to get started.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default HRDashboard;