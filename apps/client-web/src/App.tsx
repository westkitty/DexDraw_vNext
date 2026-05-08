import { BrowserRouter, Route, Routes } from "react-router-dom";
import { BoardPage } from "./components/BoardPage";
import { Gateway } from "./components/Gateway";
import { HomePage } from "./components/HomePage";

export default function App() {
  return (
    <Gateway>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/boards/:boardId" element={<BoardPage />} />
        </Routes>
      </BrowserRouter>
    </Gateway>
  );
}
