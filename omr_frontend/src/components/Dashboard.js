import React from "react";
import NavBar from "./NavBar";
import FileUpload from "./FileUpload";

const Dashboard = ({ onLogout }) => {
  return (
    <div>
      <NavBar onLogout={onLogout} />
      <div style={{ margin: "50px auto", width: "80%" }}>
        <FileUpload />
      </div>
    </div>
  );
};

export default Dashboard;
