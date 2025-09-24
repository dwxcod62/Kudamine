import { BrowserRouter } from "react-router-dom";
import AppBankio from "./Kudamine";
import "./styles/App.css";

export default function App() {
    return (
        <BrowserRouter>
            <AppBankio />
        </BrowserRouter>
    );
}
