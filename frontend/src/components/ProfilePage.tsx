import React, { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode'; // Ensure jwt-decode is available or added as a dependency if not already.

// Define DecodedToken interface (can be imported if centralized)
interface DecodedToken {
  userId: string;
  email: string;
  role:string;
  organizationId: number;
  organizationSchema: string;
  iat: number;
  exp: number;
}

interface ProfilePageProps {
  onClose: () => void; // Prop for handling the close action
}

const ProfilePage: React.FC<ProfilePageProps> = ({ onClose }) => {
  const [email, setEmail] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        const decodedToken = jwtDecode<DecodedToken>(token);
        setEmail(decodedToken.email);
        setRole(decodedToken.role);
      } catch (error) {
        console.error("Error decoding token for profile:", error);
        // Handle error, maybe clear states or redirect
      }
    }
  }, []);

  return (
    <div className="p-6 bg-white shadow-lg rounded-lg max-w-lg mx-auto mt-8">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">User Profile</h2>
      {email && <p className="text-gray-700 mb-2"><strong>Email:</strong> {email}</p>}
      {role && <p className="text-gray-700 mb-4"><strong>Role:</strong> {role}</p>}
      <button
        onClick={onClose}
        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded mt-6"
      >
        Close
      </button>
    </div>
  );
};

export default ProfilePage;
