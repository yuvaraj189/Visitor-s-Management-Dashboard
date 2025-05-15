import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="bg-blue-700 text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <div className="font-bold text-xl">Visitor Dashboard</div>
        <div className="space-x-4">
          <Link to="/" className="hover:underline">Visitor signup</Link>
         
          <Link to="/admin/login" className="hover:underline">Admin Login</Link>
          
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
