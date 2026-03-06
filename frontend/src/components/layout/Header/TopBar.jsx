import { useState } from "react";
import SearchBar from "./SearchBar";
import { useNavigate } from "react-router-dom";

export default function TopBar() {

    const [postcodeOpen, setPostcodeOpen] = useState(false);
    const navigate = useNavigate();
    return(
    <div className="topbar">
        {/* Left */}
        <div className="topbar_left">
            <span className="topbar_logo">BRFN Marketplace</span>
        </div>

        {/* Center */}
        <div className={`topbar_center ${postcodeOpen ? "topbar_center--compact" : ""}`}>
            <SearchBar/>
        </div>

        {/* Right */}
        <div className="topbar_right">
            {/* postcode visual only for now */}
            {!postcodeOpen ? (
                <button className="postcode-chip" type="button" onClick={() => setPostcodeOpen(true)} >
                    📍 Enter postcode
                </button>
                ) : (
                <div className="postcode-edit">
                    <span className="postcode-icon">📍</span>
                    <input className="postcode-input" placeholder="e.g. BS1 5XX" type="text" />
                    <button className="postcode-save" type="button" onClick={() => setPostcodeOpen(false)} >
                    Save
                    </button>
                </div>
            )}

            <button onClick={() => navigate("/login")}>
                👤 Login
            </button>

            
            <button className="topbar-btn" type="button">
                🛒 Cart
            </button>

        </div>
    </div>
    );
}