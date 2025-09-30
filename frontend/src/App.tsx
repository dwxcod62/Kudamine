import { BrowserRouter } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AppBankio from "./Kudamine";
import "./styles/App.css";

export default function App() {
    return (
        <div className="syne-mono-regular">
            <BrowserRouter>
                <AppBankio />
            </BrowserRouter>
            <ToastContainer position="top-right" autoClose={3000} />
        </div>
    );
}
