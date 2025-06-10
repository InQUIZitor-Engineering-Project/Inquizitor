import React from "react";
import { useAuth } from "../../context/AuthContext";

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  return (
    <div>
      <h1>Profil</h1>
      <p>Imię: {user?.first_name}</p>
      <p>Nazwisko: {user?.last_name}</p>
      <p>Email: {user?.email}</p>
    </div>
  );
};

export default ProfilePage;
